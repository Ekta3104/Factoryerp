import { pool } from '../config/db.js';
import { SalaryModel } from '../models/salary.model.js';
import { AdvanceService } from './advance.service.js';
import { FinancialLedgerModel } from '../models/financialLedger.model.js';

export const SalaryService = {
  async getSalaryCycles() {
    return await SalaryModel.getSalaryCycles();
  },

  async createSalaryCycle(data, userId) {
    if (!data.cycle_name || !data.start_date || !data.end_date) {
      throw new Error('Cycle Name, Start Date, and End Date are required.');
    }
    if (!['Daily', 'Weekly', 'Monthly'].includes(data.cycle_type)) {
      throw new Error('Cycle Type must be one of Daily, Weekly, or Monthly.');
    }
    return await SalaryModel.createSalaryCycle({ ...data, created_by: userId });
  },

  async updateSalaryCycleStatus(id, status) {
    return await SalaryModel.updateSalaryCycleStatus(id, status);
  },

  async getSalaries(params) {
    return await SalaryModel.getSalaries(params);
  },

  async getSalaryDetails(id) {
    const sal = await SalaryModel.getSalaryById(id);
    if (!sal) throw new Error('Salary record not found.');
    return sal;
  },

  async addSalaryRecord(data, userId) {
    const { salary_cycle_id, party_id, gross_salary, bonus_allowance = 0, advance_deduction = 0, other_deductions = 0, notes } = data;

    const gross = parseFloat(gross_salary);
    const bonus = parseFloat(bonus_allowance);
    const advDed = parseFloat(advance_deduction);
    const otherDed = parseFloat(other_deductions);

    if (!salary_cycle_id || !party_id || isNaN(gross) || gross < 0) {
      throw new Error('Salary Cycle, Party, and non-negative Gross Salary are required.');
    }

    const netSalary = gross + bonus - advDed - otherDed;
    if (netSalary < 0) {
      throw new Error(`Net Payable Salary cannot be negative (Calculated: ₹${netSalary}).`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check for duplicate salary in same cycle for same party
      const dupCheck = await client.query(
        `SELECT id FROM employee_salaries WHERE salary_cycle_id = $1 AND party_id = $2 AND status != 'Cancelled'`,
        [salary_cycle_id, party_id]
      );
      if (dupCheck.rows.length > 0) {
        throw new Error('A salary record already exists for this recipient in the selected cycle.');
      }

      // Lock the party's active advances up front and validate the requested deduction
      // against what's actually outstanding, before it gets baked into net_salary below.
      let activeAdvRes = { rows: [] };
      if (advDed > 0) {
        activeAdvRes = await client.query(`
          SELECT id, outstanding_balance FROM advances
          WHERE party_id = $1 AND status IN ('Active', 'Partially Adjusted') AND outstanding_balance > 0
          ORDER BY disbursement_date ASC FOR UPDATE
        `, [party_id]);

        const totalAvailable = activeAdvRes.rows.reduce((sum, row) => sum + parseFloat(row.outstanding_balance), 0);
        if (advDed > totalAvailable) {
          throw new Error(`Advance deduction (₹${advDed}) exceeds this employee's actual outstanding advance balance (₹${totalAvailable}).`);
        }
      }

      // Insert Employee Salary record
      const salInsertRes = await client.query(`
        INSERT INTO employee_salaries
          (salary_cycle_id, party_id, gross_salary, bonus_allowance, total_deductions, paid_amount, adjusted_advance_amount, status, notes)
        VALUES ($1, $2, $3, $4, $5, 0, $6, 'Unpaid', $7)
        RETURNING *
      `, [
        salary_cycle_id,
        party_id,
        gross,
        bonus,
        advDed + otherDed,
        advDed,
        notes || null,
      ]);

      const salaryRecord = salInsertRes.rows[0];

      // Auto-adjust active advances if advance_deduction > 0 (already locked and validated above)
      if (advDed > 0) {
        let remainingDedToAllocate = advDed;
        for (const advRow of activeAdvRes.rows) {
          if (remainingDedToAllocate <= 0) break;
          const advBal = parseFloat(advRow.outstanding_balance);
          const allocAmount = Math.min(remainingDedToAllocate, advBal);

          await AdvanceService.allocateAdvance({
            advance_id: advRow.id,
            allocation_type: 'Salary Deduction',
            amount: allocAmount,
            allocation_date: new Date().toISOString().split('T')[0],
            reference_number: `SAL-${salaryRecord.id.substring(0, 8)}`,
            notes: `Auto deduction in salary cycle`,
          }, userId, client);

          remainingDedToAllocate -= allocAmount;
        }
      }

      // Write to Financial Ledger
      const txnNum = `TXN-SAL-${Date.now()}`;
      const txnRes = await client.query(`
        INSERT INTO financial_transactions
          (transaction_number, transaction_date, party_id, transaction_type, debit_amount, credit_amount, created_by)
        VALUES ($1, CURRENT_TIMESTAMP, $2, 'SALARY_RECORDED', $3, 0, $4)
        RETURNING *
      `, [
        txnNum,
        party_id,
        netSalary,
        userId || null,
      ]);

      // Write Audit Log
      await FinancialLedgerModel.writeAuditLog(client, {
        transaction_id: txnRes.rows[0].id,
        entity_name: 'employee_salaries',
        entity_id: salaryRecord.id,
        action: 'ADD_SALARY',
        new_state: salaryRecord,
        user_id: userId,
      });

      await client.query('COMMIT');
      return salaryRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async recordSalaryPayment(data, userId) {
    const { employee_salary_id, amount, payment_date, payment_method, reference_number, notes } = data;
    const pmtAmt = parseFloat(amount);

    if (!employee_salary_id || !pmtAmt || pmtAmt <= 0 || !payment_date || !payment_method) {
      throw new Error('Salary Record ID, positive Payment Amount, Payment Date, and Payment Method are required.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock row
      const salRes = await client.query(`SELECT * FROM employee_salaries WHERE id = $1 FOR UPDATE`, [employee_salary_id]);
      if (salRes.rows.length === 0) throw new Error('Salary record not found.');

      const salary = salRes.rows[0];
      const pendingBal = parseFloat(salary.pending_balance);

      if (pmtAmt > pendingBal) {
        throw new Error(`Payment amount (₹${pmtAmt}) exceeds pending salary balance (₹${pendingBal}).`);
      }

      const newPaid = parseFloat(salary.paid_amount) + pmtAmt;
      const newPending = pendingBal - pmtAmt;
      const newStatus = newPending < 0.01 ? 'Paid' : 'Partially Paid';

      // Update Salary Record
      await client.query(`
        UPDATE employee_salaries
        SET paid_amount = $1,
            status = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newPaid, newStatus, employee_salary_id]);

      // Insert Payment Entry
      const pmtInsertRes = await client.query(`
        INSERT INTO salary_payments
          (employee_salary_id, payment_date, amount, payment_method, reference_number, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        employee_salary_id,
        payment_date,
        pmtAmt,
        payment_method,
        reference_number || null,
        notes || null,
        userId || null,
      ]);

      const payment = pmtInsertRes.rows[0];

      // Write to Financial Ledger
      const txnNum = `TXN-PMT-${Date.now()}`;
      const txnRes = await client.query(`
        INSERT INTO financial_transactions
          (transaction_number, transaction_date, party_id, transaction_type, debit_amount, credit_amount, payment_method, reference_number, salary_payment_id, created_by)
        VALUES ($1, $2, $3, 'SALARY_PAYMENT', 0, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        txnNum,
        payment_date,
        salary.party_id,
        pmtAmt,
        payment_method,
        reference_number || null,
        payment.id,
        userId || null,
      ]);

      // Audit Log
      await FinancialLedgerModel.writeAuditLog(client, {
        transaction_id: txnRes.rows[0].id,
        entity_name: 'salary_payments',
        entity_id: payment.id,
        action: 'RECORD_SALARY_PAYMENT',
        old_state: { pending_balance: pendingBal },
        new_state: { pending_balance: newPending, payment },
        user_id: userId,
      });

      await client.query('COMMIT');
      return payment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getSalaryStructures(params) {
    return await SalaryModel.getSalaryStructures(params);
  },

  async saveSalaryStructure(data) {
    if (!data.party_id || !data.base_salary) throw new Error('Party and Base Salary are required.');
    return await SalaryModel.saveSalaryStructure(data);
  },
};
