import { pool } from '../config/db.js';
import { VehicleInwardModel } from '../models/vehicleInward.model.js';
import { ExpenseModel } from '../models/expense.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const createVehicleInward = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start Transaction

    // 1. Insert inward record
    const result = await client.query(VehicleInwardModel.create, [
      data.vehicle_number, data.driver_name || null, data.supplier_id, data.raw_material_id,
      data.quantity_received, data.entry_time || new Date(), 
      data.remarks || null
    ]);
    const inward = result.rows[0];

    // 1.5 Insert expenses
    const expensesMap = {
      'Vehicle Diesel': data.diesel_expense,
      'Vehicle Toll': data.toll_expense,
      'Driver Expenses': data.driver_expense,
      'JCB Unloading Charges': data.jcb_unloading_charges,
      'JCB Diesel Charges': data.jcb_diesel_charges
    };
    for (const [category, amount] of Object.entries(expensesMap)) {
      if (amount && parseFloat(amount) > 0) {
        await client.query(ExpenseModel.create, [
          category, amount, `Auto-generated for Inward ${inward.vehicle_number}`, inward.entry_time,
          'Cash', null, null, 'VEHICLE_INWARD', inward.id
        ]);
      }
    }

    // 2. Increment Raw Material Stock
    await client.query(VehicleInwardModel.updateRawMaterialStock, [inward.quantity_received, inward.raw_material_id]);

    // 3. Log Activity
    await logActivity(client, userId, 'CREATE', 'VEHICLE_INWARD', inward.id, { inward });

    await client.query('COMMIT'); // Commit Transaction
    return inward;
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback Transaction on Error
    throw error;
  } finally {
    client.release();
  }
};

export const updateVehicleInward = async (id, data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start Transaction

    // Get existing record to find the weight difference
    const existing = await client.query('SELECT quantity_received, raw_material_id FROM vehicle_inwards WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Vehicle Inward not found');
    const oldInward = existing.rows[0];

    // Prevent changing the raw material type for simplicity
    if (oldInward.raw_material_id !== data.raw_material_id) {
      throw new Error('Cannot change raw material type after creation. Delete and recreate instead.');
    }

    const weightDifference = parseFloat(data.quantity_received) - parseFloat(oldInward.quantity_received);

    // 1. Update Inward
    const result = await client.query(VehicleInwardModel.update, [
      data.vehicle_number, data.driver_name || null, data.supplier_id, data.raw_material_id,
      data.quantity_received, data.entry_time, 
      data.remarks || null,
      id
    ]);
    const inward = result.rows[0];

    // 1.5 Update expenses (Delete and Recreate)
    await client.query(ExpenseModel.deleteByEntity, ['VEHICLE_INWARD', id]);
    const expensesMap = {
      'Vehicle Diesel': data.diesel_expense,
      'Vehicle Toll': data.toll_expense,
      'Driver Expenses': data.driver_expense,
      'JCB Unloading Charges': data.jcb_unloading_charges,
      'JCB Diesel Charges': data.jcb_diesel_charges
    };
    for (const [category, amount] of Object.entries(expensesMap)) {
      if (amount && parseFloat(amount) > 0) {
        await client.query(ExpenseModel.create, [
          category, amount, `Auto-generated for Inward ${inward.vehicle_number}`, inward.entry_time,
          'Cash', null, null, 'VEHICLE_INWARD', inward.id
        ]);
      }
    }

    // 2. Update Stock if weight changed
    if (weightDifference !== 0) {
      await client.query(VehicleInwardModel.updateRawMaterialStock, [weightDifference, inward.raw_material_id]);
    }

    // 3. Log Activity
    await logActivity(client, userId, 'UPDATE', 'VEHICLE_INWARD', inward.id, { before: oldInward, after: inward });

    await client.query('COMMIT');
    return inward;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteVehicleInward = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT quantity_received, raw_material_id FROM vehicle_inwards WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Vehicle Inward not found');
    const inward = existing.rows[0];

    // 0. Delete expenses associated with this inward
    await client.query(ExpenseModel.deleteByEntity, ['VEHICLE_INWARD', id]);

    // 1. Revert Stock
    await client.query(VehicleInwardModel.updateRawMaterialStock, [-inward.quantity_received, inward.raw_material_id]);

    // 2. Delete Inward
    await client.query(VehicleInwardModel.delete, [id]);

    // 3. Log Activity
    await logActivity(client, userId, 'DELETE', 'VEHICLE_INWARD', id, { deletedRecord: inward });

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getVehicleInwardById = async (id) => {
  const result = await pool.query(VehicleInwardModel.findById, [id]);
  if (result.rowCount === 0) throw new Error('Vehicle Inward not found');
  const row = result.rows[0];

  const expensesRes = await pool.query(`SELECT category, amount FROM expenses WHERE entity_type = 'VEHICLE_INWARD' AND entity_id = $1`, [id]);
  const exps = {};
  expensesRes.rows.forEach(e => exps[e.category] = e.amount);
  
  return {
    ...row,
    diesel_expense: exps['Vehicle Diesel'] || 0,
    toll_expense: exps['Vehicle Toll'] || 0,
    driver_expense: exps['Driver Expenses'] || 0,
    jcb_unloading_charges: exps['JCB Unloading Charges'] || 0,
    jcb_diesel_charges: exps['JCB Diesel Charges'] || 0
  };
};

export const getVehicleInwardsList = async (queryParams) => {
  const { page = 1, limit = 10, search, supplier_id, start_date, end_date } = queryParams;
  const offset = (page - 1) * limit;

  let query = `
    SELECT v.*, s.name as supplier_name, r.name as raw_material_name
    FROM vehicle_inwards v
    LEFT JOIN suppliers s ON v.supplier_id = s.id
    LEFT JOIN raw_materials r ON v.raw_material_id = r.id
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 1;

  if (search) {
    query += ` AND v.vehicle_number ILIKE $${paramCount}`;
    values.push(`%${search}%`);
    paramCount++;
  }
  if (supplier_id) {
    query += ` AND v.supplier_id = $${paramCount}`;
    values.push(supplier_id);
    paramCount++;
  }
  if (start_date && end_date) {
    query += ` AND v.entry_time BETWEEN $${paramCount} AND $${paramCount+1}`;
    values.push(start_date, end_date);
    paramCount += 2;
  }

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_table`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count);

  // Add pagination
  query += ` ORDER BY v.entry_time DESC LIMIT $${paramCount} OFFSET $${paramCount+1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  
  // Fetch expenses for all returned inwards
  const inwardIds = result.rows.map(r => r.id);
  if (inwardIds.length > 0) {
    const expensesRes = await pool.query(`SELECT entity_id, category, amount FROM expenses WHERE entity_type = 'VEHICLE_INWARD' AND entity_id = ANY($1)`, [inwardIds]);
    const expensesByInward = {};
    expensesRes.rows.forEach(e => {
      if (!expensesByInward[e.entity_id]) expensesByInward[e.entity_id] = {};
      expensesByInward[e.entity_id][e.category] = e.amount;
    });

    result.rows = result.rows.map(row => {
      const exps = expensesByInward[row.id] || {};
      return {
        ...row,
        diesel_expense: exps['Vehicle Diesel'] || 0,
        toll_expense: exps['Vehicle Toll'] || 0,
        driver_expense: exps['Driver Expenses'] || 0,
        jcb_unloading_charges: exps['JCB Unloading Charges'] || 0,
        jcb_diesel_charges: exps['JCB Diesel Charges'] || 0
      };
    });
  }

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
