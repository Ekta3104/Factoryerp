import { pool } from '../config/db.js';

export const SalaryModel = {
  async getSalaryCycles() {
    const res = await pool.query(`
      SELECT sc.*,
             u.username AS created_by_username,
             COUNT(es.id) AS total_employee_records,
             COALESCE(SUM(es.gross_salary), 0) AS total_gross_salary,
             COALESCE(SUM(es.paid_amount), 0) AS total_paid_amount,
             COALESCE(SUM(es.pending_balance), 0) AS total_pending_balance
      FROM salary_cycles sc
      LEFT JOIN users u ON sc.created_by = u.id
      LEFT JOIN employee_salaries es ON sc.id = es.salary_cycle_id AND es.status != 'Cancelled'
      GROUP BY sc.id, u.username
      ORDER BY sc.start_date DESC, sc.created_at DESC
    `);
    return res.rows;
  },

  async createSalaryCycle({ cycle_name, cycle_type, start_date, end_date, created_by }) {
    const res = await pool.query(`
      INSERT INTO salary_cycles (cycle_name, cycle_type, start_date, end_date, status, created_by)
      VALUES ($1, $2, $3, $4, 'Open', $5)
      RETURNING *
    `, [cycle_name, cycle_type, start_date, end_date, created_by || null]);
    return res.rows[0];
  },

  async updateSalaryCycleStatus(id, status) {
    const res = await pool.query(`
      UPDATE salary_cycles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *
    `, [status, id]);
    return res.rows[0];
  },

  async getSalaries({ salary_cycle_id = '', party_id = '', status = '', search = '', limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT es.*,
             p.name AS party_name,
             p.party_type,
             p.phone AS party_phone,
             sc.cycle_name
      FROM employee_salaries es
      JOIN advance_parties p ON es.party_id = p.id
      JOIN salary_cycles sc ON es.salary_cycle_id = sc.id
      WHERE 1=1
    `;
    const params = [];

    if (salary_cycle_id) {
      params.push(salary_cycle_id);
      query += ` AND es.salary_cycle_id = $${params.length}`;
    }

    if (party_id) {
      params.push(party_id);
      query += ` AND es.party_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND es.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR sc.cycle_name ILIKE $${params.length})`;
    }

    query += ` ORDER BY es.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const summaryParams = [];
    let summaryQuery = `
      SELECT
        COALESCE(SUM(gross_salary), 0) AS total_gross,
        COALESCE(SUM(adjusted_advance_amount), 0) AS total_advance_deductions,
        COALESCE(SUM(paid_amount), 0) AS total_paid,
        COALESCE(SUM(pending_balance), 0) AS total_pending
      FROM employee_salaries
      WHERE status != 'Cancelled'
    `;

    if (salary_cycle_id) {
      summaryParams.push(salary_cycle_id);
      summaryQuery += ` AND salary_cycle_id = $${summaryParams.length}`;
    }

    const summaryRes = await pool.query(summaryQuery, summaryParams);

    return {
      salaries: result.rows,
      summary: summaryRes.rows[0],
    };
  },

  async getSalaryById(id) {
    const salRes = await pool.query(`
      SELECT es.*,
             p.name AS party_name,
             p.party_type,
             p.phone AS party_phone,
             p.email AS party_email,
             sc.cycle_name,
             sc.start_date AS cycle_start_date,
             sc.end_date AS cycle_end_date
      FROM employee_salaries es
      JOIN advance_parties p ON es.party_id = p.id
      JOIN salary_cycles sc ON es.salary_cycle_id = sc.id
      WHERE es.id = $1
    `, [id]);

    if (salRes.rows.length === 0) return null;

    const salary = salRes.rows[0];

    // Payments breakdown
    const pmtsRes = await pool.query(`
      SELECT sp.*,
             u.username AS created_by_username
      FROM salary_payments sp
      LEFT JOIN users u ON sp.created_by = u.id
      WHERE sp.employee_salary_id = $1
      ORDER BY sp.payment_date DESC, sp.created_at DESC
    `, [id]);

    salary.payments = pmtsRes.rows;

    return salary;
  },

  async getSalaryStructures({ party_id = '' } = {}) {
    let query = `
      SELECT ss.*, p.name AS party_name, p.party_type
      FROM salary_structures ss
      JOIN advance_parties p ON ss.party_id = p.id
      WHERE ss.is_active = TRUE
    `;
    const params = [];
    if (party_id) {
      params.push(party_id);
      query += ` AND ss.party_id = $${params.length}`;
    }
    query += ` ORDER BY p.name ASC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async saveSalaryStructure({ party_id, base_salary, pay_period, allowances, deductions, notes }) {
    // Deactivate previous active structure for party
    await pool.query(
      `UPDATE salary_structures SET is_active = FALSE WHERE party_id = $1`,
      [party_id]
    );

    const res = await pool.query(`
      INSERT INTO salary_structures 
        (party_id, base_salary, pay_period, allowances, deductions, effective_from, is_active, notes)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, TRUE, $6)
      RETURNING *
    `, [
      party_id,
      base_salary,
      pay_period || 'Monthly',
      allowances ? JSON.stringify(allowances) : '[]',
      deductions ? JSON.stringify(deductions) : '[]',
      notes || null,
    ]);
    return res.rows[0];
  },
};
