import { pool } from '../config/db.js';

export const AdvanceModel = {
  async getCategories() {
    const res = await pool.query(
      `SELECT * FROM advance_categories WHERE is_active = TRUE ORDER BY name ASC`
    );
    return res.rows;
  },

  async createCategory({ name, description }) {
    const res = await pool.query(
      `INSERT INTO advance_categories (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description || null]
    );
    return res.rows[0];
  },

  async getAllAdvances({ search = '', party_id = '', status = '', category_id = '', start_date = '', end_date = '', limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT a.*,
             p.name AS party_name,
             p.party_type,
             p.phone AS party_phone,
             c.name AS category_name,
             u.username AS created_by_username
      FROM advances a
      JOIN advance_parties p ON a.party_id = p.id
      LEFT JOIN advance_categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (party_id) {
      params.push(party_id);
      query += ` AND a.party_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }

    if (category_id) {
      params.push(category_id);
      query += ` AND a.category_id = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND a.disbursement_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND a.disbursement_date <= $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        a.advance_number ILIKE $${params.length} OR 
        p.name ILIKE $${params.length} OR 
        a.reason ILIKE $${params.length} OR 
        a.project_work_name ILIKE $${params.length} OR 
        a.reference_number ILIKE $${params.length}
      )`;
    }

    query += ` ORDER BY a.disbursement_date DESC, a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Aggregate totals for header cards
    const summaryRes = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_disbursed,
        COALESCE(SUM(adjusted_amount), 0) AS total_adjusted,
        COALESCE(SUM(refunded_amount), 0) AS total_refunded,
        COALESCE(SUM(outstanding_balance), 0) AS total_outstanding
      FROM advances
      WHERE status != 'Reversed'
    `);

    return {
      advances: result.rows,
      summary: summaryRes.rows[0],
    };
  },

  async getAdvanceById(id) {
    const advRes = await pool.query(`
      SELECT a.*,
             p.name AS party_name,
             p.party_type,
             p.phone AS party_phone,
             p.email AS party_email,
             c.name AS category_name,
             u.username AS created_by_username
      FROM advances a
      JOIN advance_parties p ON a.party_id = p.id
      LEFT JOIN advance_categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `, [id]);

    if (advRes.rows.length === 0) return null;

    const advance = advRes.rows[0];

    // Allocations history
    const allocRes = await pool.query(`
      SELECT al.*,
             u.username AS created_by_username
      FROM advance_allocations al
      LEFT JOIN users u ON al.created_by = u.id
      WHERE al.advance_id = $1
      ORDER BY al.allocation_date DESC, al.created_at DESC
    `, [id]);

    advance.allocations = allocRes.rows;

    // Financial transaction trail
    const txnRes = await pool.query(`
      SELECT ft.*,
             u.username AS created_by_username
      FROM financial_transactions ft
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE ft.advance_id = $1
      ORDER BY ft.transaction_date DESC
    `, [id]);

    advance.transactions = txnRes.rows;

    return advance;
  },

  async generateAdvanceNumber() {
    const seqRes = await pool.query(`SELECT nextval('advance_number_seq') AS seq`);
    const nextSeq = parseInt(seqRes.rows[0].seq, 10);
    const year = new Date().getFullYear();
    return `ADV-${year}-${String(nextSeq).padStart(5, '0')}`;
  },
};
