import { pool } from '../config/db.js';
import { ProductionModel } from '../models/production.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const createProduction = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check Raw Material Stock
    const stockRes = await client.query(ProductionModel.checkRawMaterialStock, [data.raw_material_id]);
    if (stockRes.rowCount === 0) throw new Error('Raw Material not found');
    
    const currentStock = parseFloat(stockRes.rows[0].current_stock);
    const quantityUsed = parseFloat(data.quantity_used);

    if (currentStock < quantityUsed) {
      throw new Error(`Insufficient stock for ${stockRes.rows[0].name}. Available: ${currentStock}, Required: ${quantityUsed}`);
    }

    // 2. Create Production Entry
    const batchNumber = `PRD-${Date.now()}`;
    const result = await client.query(ProductionModel.create, [
      batchNumber, data.production_date, data.shift, data.operator_name, data.machine,
      data.raw_material_id, data.ready_material_id, data.quantity_used, 
      data.quantity_produced, data.remarks || null
    ]);
    const production = result.rows[0];

    // 3. Decrease Raw Material Stock
    await client.query(ProductionModel.updateRawMaterialStock, [-production.quantity_used, production.raw_material_id]);

    // 4. Increase Ready Material Stock
    await client.query(ProductionModel.updateReadyMaterialStock, [production.quantity_produced, production.ready_material_id]);

    // 5. Log Activity
    await logActivity(client, userId, 'CREATE', 'PRODUCTION', production.id, { production });

    await client.query('COMMIT');
    return production;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateProduction = async (id, data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get existing record to find the differences
    const existing = await client.query('SELECT raw_material_id, ready_material_id, quantity_used, quantity_produced FROM production_batches WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Production Entry not found');
    const oldProd = existing.rows[0];

    // For simplicity and data integrity, prevent changing material types. 
    // If they must change it, they should delete and recreate.
    if (oldProd.raw_material_id !== data.raw_material_id || oldProd.ready_material_id !== data.ready_material_id) {
      throw new Error('Cannot change raw or ready material types after creation. Please delete and recreate the entry.');
    }

    const rawDiff = parseFloat(data.quantity_used) - parseFloat(oldProd.quantity_used);
    const readyDiff = parseFloat(data.quantity_produced) - parseFloat(oldProd.quantity_produced);

    // If using MORE raw material, check stock
    if (rawDiff > 0) {
      const stockRes = await client.query(ProductionModel.checkRawMaterialStock, [data.raw_material_id]);
      const currentStock = parseFloat(stockRes.rows[0].current_stock);
      if (currentStock < rawDiff) {
        throw new Error(`Insufficient stock for ${stockRes.rows[0].name} to update. Additional required: ${rawDiff}, Available: ${currentStock}`);
      }
    }

    // 1. Update Production Entry
    const result = await client.query(ProductionModel.update, [
      data.production_date, data.shift, data.operator_name, data.machine,
      data.raw_material_id, data.ready_material_id, data.quantity_used, 
      data.quantity_produced, data.remarks || null, id
    ]);
    const production = result.rows[0];

    // 2. Adjust Stocks
    if (rawDiff !== 0) {
      await client.query(ProductionModel.updateRawMaterialStock, [-rawDiff, production.raw_material_id]);
    }
    if (readyDiff !== 0) {
      await client.query(ProductionModel.updateReadyMaterialStock, [readyDiff, production.ready_material_id]);
    }

    // 3. Log Activity
    await logActivity(client, userId, 'UPDATE', 'PRODUCTION', production.id, { before: oldProd, after: production });

    await client.query('COMMIT');
    return production;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteProduction = async (id, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT raw_material_id, ready_material_id, quantity_used, quantity_produced FROM production_batches WHERE id = $1', [id]);
    if (existing.rowCount === 0) throw new Error('Production Entry not found');
    const production = existing.rows[0];

    // 1. Revert Stocks
    // Add back the used raw material
    await client.query(ProductionModel.updateRawMaterialStock, [production.quantity_used, production.raw_material_id]);
    
    // Remove the produced ready material
    await client.query(ProductionModel.updateReadyMaterialStock, [-production.quantity_produced, production.ready_material_id]);

    // 2. Delete Entry
    await client.query(ProductionModel.delete, [id]);

    // 3. Log Activity
    await logActivity(client, userId, 'DELETE', 'PRODUCTION', id, { deletedRecord: production });

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getProductionById = async (id) => {
  const result = await pool.query(ProductionModel.findById, [id]);
  if (result.rowCount === 0) throw new Error('Production Entry not found');
  return result.rows[0];
};

export const getProductionsList = async (queryParams) => {
  const { page = 1, limit = 10, search, start_date, end_date, shift, operator_name } = queryParams;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, rm.name as raw_material_name, rdm.name as ready_material_name
    FROM production_batches p
    LEFT JOIN raw_materials rm ON p.raw_material_id = rm.id
    LEFT JOIN ready_materials rdm ON p.ready_material_id = rdm.id
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 1;

  if (search) {
    query += ` AND (p.operator_name ILIKE $${paramCount} OR p.machine ILIKE $${paramCount})`;
    values.push(`%${search}%`);
    paramCount++;
  }
  if (shift) {
    query += ` AND p.shift = $${paramCount}`;
    values.push(shift);
    paramCount++;
  }
  if (operator_name) {
    query += ` AND p.operator_name ILIKE $${paramCount}`;
    values.push(`%${operator_name}%`);
    paramCount++;
  }
  if (start_date && end_date) {
    query += ` AND p.production_date BETWEEN $${paramCount} AND $${paramCount+1}`;
    values.push(start_date, end_date);
    paramCount += 2;
  } else if (start_date) {
    query += ` AND p.production_date >= $${paramCount}`;
    values.push(start_date);
    paramCount++;
  } else if (end_date) {
    query += ` AND p.production_date <= $${paramCount}`;
    values.push(end_date);
    paramCount++;
  }

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_table`;
  const totalRes = await pool.query(countQuery, values);
  const total = parseInt(totalRes.rows[0].count);

  // Add pagination
  query += ` ORDER BY p.production_date DESC, p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount+1}`;
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
