import { pool } from '../config/db.js';
import { ExpenseModel } from '../models/expense.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const createExpense = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(ExpenseModel.create, [
      data.category, data.amount, data.description || null, data.expense_date,
      data.payment_type || 'Cash', data.reference_number || null, data.remarks || null,
      data.entity_type || null, data.entity_id || null
    ]);
    const expense = result.rows[0];

    await logActivity(client, userId, 'CREATE', 'EXPENSE', expense.id, { expense });

    await client.query('COMMIT');
    return expense;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateExpense = async (id, data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Expense not found');
    const oldExpense = existing.rows[0];

    const result = await client.query(ExpenseModel.update, [
      data.category, data.amount, data.description || null, data.expense_date,
      data.payment_type || 'Cash', data.reference_number || null, data.remarks || null,
      id
    ]);
    const expense = result.rows[0];

    await logActivity(client, userId, 'UPDATE', 'EXPENSE', expense.id, { before: oldExpense, after: expense });

    await client.query('COMMIT');
    return expense;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteExpense = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Expense not found');
    const expense = existing.rows[0];

    await client.query(ExpenseModel.delete, [id]);

    await logActivity(client, userId, 'DELETE', 'EXPENSE', id, { deletedRecord: expense });

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getExpenseById = async (id) => {
  const result = await pool.query(ExpenseModel.findById, [id]);
  if (result.rowCount === 0) throw new Error('Expense not found');
  return result.rows[0];
};

export const getMonthlySummary = async () => {
  const result = await pool.query(ExpenseModel.getMonthlySummary);
  return result.rows;
};

export const getYearlySummary = async () => {
  const result = await pool.query(ExpenseModel.getYearlySummary);
  return result.rows;
};

export const getExpensesList = async (queryParams) => {
  const { page = 1, limit = 10, search, category, start_date, end_date } = queryParams;
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM expenses WHERE 1=1`;
  const values = [];
  let paramCount = 1;

  if (search) {
    query += ` AND (description ILIKE $${paramCount} OR reference_number ILIKE $${paramCount})`;
    values.push(`%${search}%`);
    paramCount++;
  }
  if (category) {
    query += ` AND category = $${paramCount}`;
    values.push(category);
    paramCount++;
  }
  if (start_date && end_date) {
    query += ` AND expense_date BETWEEN $${paramCount} AND $${paramCount+1}`;
    values.push(start_date, end_date);
    paramCount += 2;
  } else if (start_date) {
    query += ` AND expense_date >= $${paramCount}`;
    values.push(start_date);
    paramCount++;
  } else if (end_date) {
    query += ` AND expense_date <= $${paramCount}`;
    values.push(end_date);
    paramCount++;
  }

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_table`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count);

  // Add pagination
  query += ` ORDER BY expense_date DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount+1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return {
    data: result.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};
