import { pool } from '../config/db.js';

export const PartyModel = {
  async getAllParties({ search = '', party_type = '', is_active = true, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT p.*,
             COALESCE(SUM(a.outstanding_balance), 0) AS total_outstanding_advance
      FROM advance_parties p
      LEFT JOIN advances a ON p.id = a.party_id AND a.status IN ('Active', 'Partially Adjusted')
      WHERE 1=1
    `;
    const params = [];

    if (party_type) {
      params.push(party_type);
      query += ` AND p.party_type = $${params.length}`;
    }

    if (typeof is_active === 'boolean') {
      params.push(is_active);
      query += ` AND p.is_active = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.phone ILIKE $${params.length} OR p.email ILIKE $${params.length} OR p.tax_id ILIKE $${params.length})`;
    }

    query += ` GROUP BY p.id ORDER BY p.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countParams = [];
    let countQuery = `SELECT COUNT(*) AS total FROM advance_parties WHERE 1=1`;

    if (party_type) {
      countParams.push(party_type);
      countQuery += ` AND party_type = $${countParams.length}`;
    }

    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (name ILIKE $${countParams.length} OR phone ILIKE $${countParams.length})`;
    }

    const countRes = await pool.query(countQuery, countParams);

    return {
      parties: result.rows,
      total: parseInt(countRes.rows[0]?.total || 0, 10),
    };
  },

  async getPartyById(id) {
    const query = `
      SELECT p.*,
        COALESCE((SELECT SUM(amount) FROM advances WHERE party_id = p.id AND status != 'Reversed'), 0) as total_advances_given,
        COALESCE((SELECT SUM(outstanding_balance) FROM advances WHERE party_id = p.id AND status IN ('Active', 'Partially Adjusted')), 0) as total_outstanding_advance,
        COALESCE((SELECT SUM(gross_salary) FROM employee_salaries WHERE party_id = p.id AND status != 'Cancelled'), 0) as total_salary_accrued,
        COALESCE((SELECT SUM(paid_amount) FROM employee_salaries WHERE party_id = p.id AND status != 'Cancelled'), 0) as total_salary_paid
      FROM advance_parties p
      WHERE p.id = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  },

  async createParty({ party_type, name, phone, email, tax_id, bank_details, supplier_id, customer_id, labour_id, user_id }) {
    const query = `
      INSERT INTO advance_parties 
        (party_type, name, phone, email, tax_id, bank_details, supplier_id, customer_id, labour_id, user_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
      RETURNING *
    `;
    const res = await pool.query(query, [
      party_type,
      name,
      phone || null,
      email || null,
      tax_id || null,
      bank_details ? JSON.stringify(bank_details) : null,
      supplier_id || null,
      customer_id || null,
      labour_id || null,
      user_id || null,
    ]);
    return res.rows[0];
  },

  async updateParty(id, { name, phone, email, tax_id, bank_details, is_active }) {
    const query = `
      UPDATE advance_parties
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          tax_id = COALESCE($4, tax_id),
          bank_details = COALESCE($5, bank_details),
          is_active = COALESCE($6, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const res = await pool.query(query, [
      name,
      phone,
      email,
      tax_id,
      bank_details ? JSON.stringify(bank_details) : null,
      is_active,
      id,
    ]);
    return res.rows[0];
  },

  async syncPartiesFromMaster() {
    // 1. Sync Employees/Users
    await pool.query(`
      INSERT INTO advance_parties (party_type, name, email, user_id, is_active)
      SELECT 'Employee', u.username, u.email, u.id, u.is_active
      FROM users u
      LEFT JOIN advance_parties p ON p.user_id = u.id
      WHERE p.id IS NULL
      ON CONFLICT DO NOTHING;
    `);

    // 2. Sync Suppliers
    await pool.query(`
      INSERT INTO advance_parties (party_type, name, phone, email, supplier_id, is_active)
      SELECT 'Supplier', s.name, s.phone, s.email, s.id, TRUE
      FROM suppliers s
      LEFT JOIN advance_parties p ON p.supplier_id = s.id
      WHERE p.id IS NULL
      ON CONFLICT DO NOTHING;
    `);

    // 3. Sync Customers
    await pool.query(`
      INSERT INTO advance_parties (party_type, name, phone, email, customer_id, is_active)
      SELECT 'Customer', c.name, c.phone, c.email, c.id, TRUE
      FROM customers c
      LEFT JOIN advance_parties p ON p.customer_id = c.id
      WHERE p.id IS NULL
      ON CONFLICT DO NOTHING;
    `);

    // 4. Sync Labour
    await pool.query(`
      INSERT INTO advance_parties (party_type, name, phone, labour_id, is_active)
      SELECT 'Worker/Labour', l.name, l.contact_number, l.id, TRUE
      FROM labour l
      LEFT JOIN advance_parties p ON p.labour_id = l.id
      WHERE p.id IS NULL
      ON CONFLICT DO NOTHING;
    `);
  },
};
