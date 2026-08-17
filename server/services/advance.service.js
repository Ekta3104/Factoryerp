import { pool } from '../config/db.js';
import { AdvanceModel } from '../models/advance.model.js';
import { FinancialLedgerModel } from '../models/financialLedger.model.js';

export const AdvanceService = {
  async getCategories() {
    return await AdvanceModel.getCategories();
  },

  async createCategory(catData) {
    if (!catData.name) throw new Error('Category name is required.');
    return await AdvanceModel.createCategory(catData);
  },

  async getAdvances(params) {
    return await AdvanceModel.getAllAdvances(params);
  },

  async getAdvanceDetails(id) {
    const adv = await AdvanceModel.getAdvanceById(id);
    if (!adv) throw new Error('Advance record not found.');
    return adv;
  },

  async disburseAdvance(data, userId) {
    const { party_id, category_id, amount, disbursement_date, reason, payment_method, reference_number, project_work_name, notes } = data;

    if (!party_id || !amount || parseFloat(amount) <= 0 || !reason || !disbursement_date || !payment_method) {
      throw new Error('Party, positive Amount, Disbursement Date, Payment Method, and Reason are required.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const advanceNumber = await AdvanceModel.generateAdvanceNumber();
      const totalAmt = parseFloat(amount);

      const advInsertRes = await client.query(`
        INSERT INTO advances
          (advance_number, party_id, category_id, amount, adjusted_amount, refunded_amount, disbursement_date, reason, payment_method, reference_number, project_work_name, status, notes, created_by)
        VALUES ($1, $2, $3, $4, 0, 0, $5, $6, $7, $8, $9, 'Active', $10, $11)
        RETURNING *
      `, [
        advanceNumber,
        party_id,
        category_id || null,
        totalAmt,
        disbursement_date,
        reason,
        payment_method,
        reference_number || null,
        project_work_name || null,
        notes || null,
        userId || null,
      ]);

      const advance = advInsertRes.rows[0];

      // Write to Immutable Financial Ledger
      const txnNum = `TXN-ADV-${Date.now()}`;
      const txnRes = await client.query(`
        INSERT INTO financial_transactions
          (transaction_number, transaction_date, party_id, transaction_type, debit_amount, credit_amount, payment_method, reference_number, advance_id, created_by)
        VALUES ($1, $2, $3, 'ADVANCE_DISBURSED', $4, 0, $5, $6, $7, $8)
        RETURNING *
      `, [
        txnNum,
        disbursement_date,
        party_id,
        totalAmt,
        payment_method,
        reference_number || null,
        advance.id,
        userId || null,
      ]);

      // Write Audit Log
      await FinancialLedgerModel.writeAuditLog(client, {
        transaction_id: txnRes.rows[0].id,
        entity_name: 'advances',
        entity_id: advance.id,
        action: 'GIVE_ADVANCE',
        new_state: advance,
        user_id: userId,
      });

      await client.query('COMMIT');
      return advance;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async allocateAdvance(data, userId, externalClient = null) {
    const { advance_id, allocation_type, amount, allocation_date, salary_payment_id, expense_id, reference_number, notes } = data;

    const allocAmt = parseFloat(amount);
    if (!advance_id || !allocAmt || allocAmt <= 0 || !allocation_type || !allocation_date) {
      throw new Error('Advance ID, positive Allocation Amount, Allocation Type, and Date are required.');
    }

    const client = externalClient || await pool.connect();
    const ownsTransaction = !externalClient;
    try {
      if (ownsTransaction) await client.query('BEGIN');

      // Pessimistic Row Lock
      const advRes = await client.query(`SELECT * FROM advances WHERE id = $1 FOR UPDATE`, [advance_id]);
      if (advRes.rows.length === 0) throw new Error('Advance record not found.');

      const advance = advRes.rows[0];
      const currentOutstanding = parseFloat(advance.outstanding_balance);

      if (currentOutstanding < allocAmt) {
        throw new Error(`Allocation amount (₹${allocAmt}) exceeds outstanding advance balance (₹${currentOutstanding}).`);
      }

      const newAdjusted = parseFloat(advance.adjusted_amount) + allocAmt;
      const newOutstanding = currentOutstanding - allocAmt;
      const newStatus = newOutstanding < 0.01 ? 'Fully Adjusted' : 'Partially Adjusted';

      // Update Advance
      await client.query(`
        UPDATE advances
        SET adjusted_amount = $1,
            status = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newAdjusted, newStatus, advance_id]);

      // Insert Allocation Record
      const allocInsertRes = await client.query(`
        INSERT INTO advance_allocations
          (advance_id, allocation_type, amount, allocation_date, salary_payment_id, expense_id, reference_number, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        advance_id,
        allocation_type,
        allocAmt,
        allocation_date,
        salary_payment_id || null,
        expense_id || null,
        reference_number || null,
        notes || null,
        userId || null,
      ]);

      const allocation = allocInsertRes.rows[0];

      // Write to Immutable Ledger
      const txnNum = `TXN-ADJ-${Date.now()}`;
      const txnRes = await client.query(`
        INSERT INTO financial_transactions
          (transaction_number, transaction_date, party_id, transaction_type, debit_amount, credit_amount, reference_number, advance_id, advance_allocation_id, created_by)
        VALUES ($1, $2, $3, 'ADVANCE_ADJUSTED', 0, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        txnNum,
        allocation_date,
        advance.party_id,
        allocAmt,
        reference_number || null,
        advance_id,
        allocation.id,
        userId || null,
      ]);

      // Write Audit Log
      await FinancialLedgerModel.writeAuditLog(client, {
        transaction_id: txnRes.rows[0].id,
        entity_name: 'advance_allocations',
        entity_id: allocation.id,
        action: 'ADJUST_ADVANCE',
        old_state: { outstanding_balance: currentOutstanding },
        new_state: { outstanding_balance: newOutstanding, allocation },
        user_id: userId,
      });

      if (ownsTransaction) await client.query('COMMIT');
      return allocation;
    } catch (error) {
      if (ownsTransaction) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (ownsTransaction) client.release();
    }
  },

  async recordRefund(data, userId) {
    const { advance_id, amount, refund_date, payment_method, reference_number, notes } = data;
    const refundAmt = parseFloat(amount);

    if (!advance_id || !refundAmt || refundAmt <= 0 || !refund_date || !payment_method) {
      throw new Error('Advance ID, positive Refund Amount, Refund Date, and Payment Method are required.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Pessimistic Row Lock
      const advRes = await client.query(`SELECT * FROM advances WHERE id = $1 FOR UPDATE`, [advance_id]);
      if (advRes.rows.length === 0) throw new Error('Advance record not found.');

      const advance = advRes.rows[0];
      const currentOutstanding = parseFloat(advance.outstanding_balance);

      if (currentOutstanding < refundAmt) {
        throw new Error(`Refund amount (₹${refundAmt}) exceeds outstanding advance balance (₹${currentOutstanding}).`);
      }

      const newRefunded = parseFloat(advance.refunded_amount) + refundAmt;
      const newOutstanding = currentOutstanding - refundAmt;
      const newStatus = newOutstanding < 0.01 ? 'Fully Adjusted' : 'Partially Adjusted';

      // Update Advance
      await client.query(`
        UPDATE advances
        SET refunded_amount = $1,
            status = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newRefunded, newStatus, advance_id]);

      // Insert Allocation Record with type 'Direct Refund'
      const allocInsertRes = await client.query(`
        INSERT INTO advance_allocations
          (advance_id, allocation_type, amount, allocation_date, reference_number, notes, created_by)
        VALUES ($1, 'Direct Refund', $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        advance_id,
        refundAmt,
        refund_date,
        reference_number || null,
        notes || null,
        userId || null,
      ]);

      const allocation = allocInsertRes.rows[0];

      // Write to Immutable Ledger
      const txnNum = `TXN-REF-${Date.now()}`;
      const txnRes = await client.query(`
        INSERT INTO financial_transactions
          (transaction_number, transaction_date, party_id, transaction_type, debit_amount, credit_amount, payment_method, reference_number, advance_id, advance_allocation_id, created_by)
        VALUES ($1, $2, $3, 'ADVANCE_REFUNDED', 0, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        txnNum,
        refund_date,
        advance.party_id,
        refundAmt,
        payment_method,
        reference_number || null,
        advance_id,
        allocation.id,
        userId || null,
      ]);

      // Write Audit Log
      await FinancialLedgerModel.writeAuditLog(client, {
        transaction_id: txnRes.rows[0].id,
        entity_name: 'advances',
        entity_id: advance_id,
        action: 'REFUND_ADVANCE',
        old_state: { outstanding_balance: currentOutstanding },
        new_state: { outstanding_balance: newOutstanding, refundAmt },
        user_id: userId,
      });

      await client.query('COMMIT');
      return allocation;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async reverseAdvance(data, userId) {
    const { advance_id, reason } = data;
    if (!advance_id || !reason) throw new Error('Advance ID and Reversal Reason are required.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const advRes = await client.query(`SELECT * FROM advances WHERE id = $1 FOR UPDATE`, [advance_id]);
      if (advRes.rows.length === 0) throw new Error('Advance record not found.');

      const advance = advRes.rows[0];
      if (advance.status === 'Reversed') throw new Error('Advance is already reversed.');

      // Update status to Reversed
      await client.query(`
        UPDATE advances SET status = 'Reversed', updated_at = CURRENT_TIMESTAMP WHERE id = $1
      `, [advance_id]);

      // Fetch original transaction
      const origTxnRes = await client.query(`
        SELECT * FROM financial_transactions WHERE advance_id = $1 AND transaction_type = 'ADVANCE_DISBURSED' LIMIT 1
      `, [advance_id]);

      const origTxn = origTxnRes.rows[0];

      // Write Reversal Transaction to Ledger
      const revTxnNum = `TXN-REV-${Date.now()}`;
      const revTxnRes = await client.query(`
        INSERT INTO financial_transactions
          (transaction_number, transaction_date, party_id, transaction_type, debit_amount, credit_amount, advance_id, is_reversal, reverses_transaction_id, reversal_reason, created_by)
        VALUES ($1, CURRENT_TIMESTAMP, $2, 'REVERSAL', 0, $3, $4, TRUE, $5, $6, $7)
        RETURNING *
      `, [
        revTxnNum,
        advance.party_id,
        advance.amount,
        advance_id,
        origTxn ? origTxn.id : null,
        reason,
        userId || null,
      ]);

      await FinancialLedgerModel.writeAuditLog(client, {
        transaction_id: revTxnRes.rows[0].id,
        entity_name: 'advances',
        entity_id: advance_id,
        action: 'REVERSE_ADVANCE',
        old_state: advance,
        new_state: { status: 'Reversed', reason },
        user_id: userId,
      });

      await client.query('COMMIT');
      return { success: true, message: 'Advance successfully reversed.' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
