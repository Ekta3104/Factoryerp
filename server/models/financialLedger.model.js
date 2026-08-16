import { pool } from '../config/db.js';

export const FinancialLedgerModel = {
  async getLedgerTransactions({ party_id = '', transaction_type = '', start_date = '', end_date = '', limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT ft.*,
             p.name AS party_name,
             p.party_type,
             u.username AS created_by_username
      FROM financial_transactions ft
      JOIN advance_parties p ON ft.party_id = p.id
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (party_id) {
      params.push(party_id);
      query += ` AND ft.party_id = $${params.length}`;
    }

    if (transaction_type) {
      params.push(transaction_type);
      query += ` AND ft.transaction_type = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND ft.transaction_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND ft.transaction_date <= $${params.length}`;
    }

    query += ` ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const summaryRes = await pool.query(`
      SELECT 
        COALESCE(SUM(debit_amount), 0) AS total_debits,
        COALESCE(SUM(credit_amount), 0) AS total_credits
      FROM financial_transactions
    `);

    return {
      transactions: result.rows,
      summary: summaryRes.rows[0],
    };
  },

  async getAuditLogs({ entity_name = '', user_id = '', action = '', limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT fal.*,
             u.username AS user_name
      FROM financial_audit_logs fal
      LEFT JOIN users u ON fal.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (entity_name) {
      params.push(entity_name);
      query += ` AND fal.entity_name = $${params.length}`;
    }

    if (user_id) {
      params.push(user_id);
      query += ` AND fal.user_id = $${params.length}`;
    }

    if (action) {
      params.push(action);
      query += ` AND fal.action = $${params.length}`;
    }

    query += ` ORDER BY fal.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  async writeAuditLog(client, { transaction_id, entity_name, entity_id, action, old_state, new_state, user_id, user_agent, ip_address }) {
    const dbClient = client || pool;
    await dbClient.query(`
      INSERT INTO financial_audit_logs 
        (transaction_id, entity_name, entity_id, action, old_state, new_state, user_id, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      transaction_id || null,
      entity_name,
      entity_id,
      action,
      old_state ? JSON.stringify(old_state) : null,
      new_state ? JSON.stringify(new_state) : null,
      user_id || null,
      user_agent || null,
      ip_address || null,
    ]);
  },
};
