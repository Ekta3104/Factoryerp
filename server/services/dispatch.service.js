import { pool } from '../config/db.js';
import { DispatchModel } from '../models/dispatch.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const createDispatch = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check Ready Material Stock
    const stockRes = await client.query(DispatchModel.checkReadyMaterialStock, [data.ready_material_id]);
    if (stockRes.rowCount === 0) throw new Error('Ready Material not found');
    
    const currentStock = parseFloat(stockRes.rows[0].current_stock);
    const quantityDispatched = parseFloat(data.quantity_dispatched);

    if (currentStock < quantityDispatched) {
      throw new Error(`Insufficient stock for ${stockRes.rows[0].name}. Available: ${currentStock}, Required: ${quantityDispatched}`);
    }

    // 2. Create Dispatch Entry
    const result = await client.query(DispatchModel.create, [
      data.customer_id, data.ready_material_id, data.vehicle_number, data.driver_name,
      data.quantity_dispatched, data.dispatch_date, data.destination, data.remarks || null
    ]);
    const dispatch = result.rows[0];

    // 3. Decrease Ready Material Stock
    await client.query(DispatchModel.updateReadyMaterialStock, [-dispatch.quantity_dispatched, dispatch.ready_material_id]);

    // 4. Log Activity
    await logActivity(client, userId, 'CREATE', 'DISPATCH', dispatch.id, { dispatch });

    await client.query('COMMIT');
    return dispatch;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateDispatch = async (id, data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get existing record to find the differences
    const existing = await client.query('SELECT ready_material_id, quantity_dispatched FROM dispatches WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Dispatch Entry not found');
    const oldDispatch = existing.rows[0];

    // Prevent changing material types to maintain integrity easily.
    if (oldDispatch.ready_material_id !== data.ready_material_id) {
      throw new Error('Cannot change ready material type after creation. Please delete and recreate the entry.');
    }

    const readyDiff = parseFloat(data.quantity_dispatched) - parseFloat(oldDispatch.quantity_dispatched);

    // If dispatching MORE ready material, check stock
    if (readyDiff > 0) {
      const stockRes = await client.query(DispatchModel.checkReadyMaterialStock, [data.ready_material_id]);
      const currentStock = parseFloat(stockRes.rows[0].current_stock);
      if (currentStock < readyDiff) {
        throw new Error(`Insufficient stock for ${stockRes.rows[0].name} to update. Additional required: ${readyDiff}, Available: ${currentStock}`);
      }
    }

    // 1. Update Dispatch Entry
    const result = await client.query(DispatchModel.update, [
      data.customer_id, data.ready_material_id, data.vehicle_number, data.driver_name,
      data.quantity_dispatched, data.dispatch_date, data.destination, data.remarks || null, id
    ]);
    const dispatch = result.rows[0];

    // 2. Adjust Stock
    if (readyDiff !== 0) {
      await client.query(DispatchModel.updateReadyMaterialStock, [-readyDiff, dispatch.ready_material_id]);
    }

    // 3. Log Activity
    await logActivity(client, userId, 'UPDATE', 'DISPATCH', dispatch.id, { before: oldDispatch, after: dispatch });

    await client.query('COMMIT');
    return dispatch;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteDispatch = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT ready_material_id, quantity_dispatched FROM dispatches WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Dispatch Entry not found');
    const dispatch = existing.rows[0];

    // 1. Revert Stock (Add back the dispatched material)
    await client.query(DispatchModel.updateReadyMaterialStock, [dispatch.quantity_dispatched, dispatch.ready_material_id]);

    // 2. Delete Entry
    await client.query(DispatchModel.delete, [id]);

    // 3. Log Activity
    await logActivity(client, userId, 'DELETE', 'DISPATCH', id, { deletedRecord: dispatch });

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getDispatchById = async (id) => {
  const result = await pool.query(DispatchModel.findById, [id]);
  if (result.rowCount === 0) throw new Error('Dispatch Entry not found');
  return result.rows[0];
};

export const getDispatchesList = async (queryParams) => {
  const { page = 1, limit = 10, search, customer_id, start_date, end_date } = queryParams;
  const offset = (page - 1) * limit;

  let query = `
    SELECT d.*, c.name as customer_name, rm.name as ready_material_name
    FROM dispatches d
    LEFT JOIN customers c ON d.customer_id = c.id
    LEFT JOIN ready_materials rm ON d.ready_material_id = rm.id
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 1;

  if (search) {
    query += ` AND d.vehicle_number ILIKE $${paramCount}`;
    values.push(`%${search}%`);
    paramCount++;
  }
  if (customer_id) {
    query += ` AND d.customer_id = $${paramCount}`;
    values.push(customer_id);
    paramCount++;
  }
  if (start_date && end_date) {
    query += ` AND d.dispatch_date BETWEEN $${paramCount} AND $${paramCount+1}`;
    values.push(start_date, end_date);
    paramCount += 2;
  } else if (start_date) {
    query += ` AND d.dispatch_date >= $${paramCount}`;
    values.push(start_date);
    paramCount++;
  } else if (end_date) {
    query += ` AND d.dispatch_date <= $${paramCount}`;
    values.push(end_date);
    paramCount++;
  }

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_table`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count);

  // Add pagination
  query += ` ORDER BY d.dispatch_date DESC, d.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount+1}`;
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
