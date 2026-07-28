import { pool } from '../config/db.js';
import { ProductionModel } from '../models/production.model.js';
import { logActivity } from '../utils/activityLogger.js';

// quantityProducedBags is a bag count (finished-goods unit); each formula's
// raw-material ratios are defined per ton, so convert bags -> tons via the
// ready material's pack size before scaling.
const scaleFormulaIngredients = (formula, quantityProducedBags) => {
  const producedTons = (parseFloat(quantityProducedBags) * parseFloat(formula.pack_size_kg)) / 1000;
  const scale = producedTons / parseFloat(formula.output_quantity);
  return formula.ingredients.map((ing) => ({
    raw_material_id: ing.raw_material_id,
    raw_material_name: ing.raw_material_name,
    quantity: parseFloat(ing.quantity) * scale
  }));
};

export const createProduction = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let production;
    const batchNumber = `PRD-${Date.now()}`;

    if (data.formula_id) {
      // Formula (BOM) path: one batch consumes several raw materials
      const formulaRes = await client.query(ProductionModel.findFormulaWithIngredients, [data.formula_id]);
      if (formulaRes.rowCount === 0) throw new Error('Formula not found or inactive');
      const formula = formulaRes.rows[0];
      const quantityProduced = parseFloat(data.quantity_produced);
      const ingredients = scaleFormulaIngredients(formula, quantityProduced);

      const shortfalls = [];
      for (const ing of ingredients) {
        const stockRes = await client.query(ProductionModel.checkRawMaterialStock, [ing.raw_material_id]);
        if (stockRes.rowCount === 0) throw new Error('Raw Material not found');
        const currentStock = parseFloat(stockRes.rows[0].current_stock);
        if (currentStock < ing.quantity) {
          shortfalls.push(`${stockRes.rows[0].name} (Available: ${currentStock}, Required: ${ing.quantity.toFixed(2)})`);
        }
      }
      if (shortfalls.length > 0) {
        throw new Error(`Insufficient stock: ${shortfalls.join('; ')}`);
      }

      const result = await client.query(ProductionModel.create, [
        batchNumber, data.production_date, data.shift, data.operator_name, data.machine,
        null, formula.ready_material_id, null, quantityProduced, data.remarks || null, data.formula_id
      ]);
      production = result.rows[0];

      for (const ing of ingredients) {
        await client.query(ProductionModel.insertBatchMaterial, [production.id, ing.raw_material_id, ing.quantity]);
        await client.query(ProductionModel.updateRawMaterialStock, [-ing.quantity, ing.raw_material_id]);
      }

      await client.query(ProductionModel.updateReadyMaterialStock, [quantityProduced, formula.ready_material_id]);
    } else {
      // Legacy single-material path
      const stockRes = await client.query(ProductionModel.checkRawMaterialStock, [data.raw_material_id]);
      if (stockRes.rowCount === 0) throw new Error('Raw Material not found');

      const currentStock = parseFloat(stockRes.rows[0].current_stock);
      const quantityUsed = parseFloat(data.quantity_used);

      if (currentStock < quantityUsed) {
        throw new Error(`Insufficient stock for ${stockRes.rows[0].name}. Available: ${currentStock}, Required: ${quantityUsed}`);
      }

      const result = await client.query(ProductionModel.create, [
        batchNumber, data.production_date, data.shift, data.operator_name, data.machine,
        data.raw_material_id, data.ready_material_id, data.quantity_used,
        data.quantity_produced, data.remarks || null, null
      ]);
      production = result.rows[0];

      await client.query(ProductionModel.updateRawMaterialStock, [-production.quantity_used, production.raw_material_id]);
      await client.query(ProductionModel.updateReadyMaterialStock, [production.quantity_produced, production.ready_material_id]);
    }

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

    const existing = await client.query(
      'SELECT raw_material_id, ready_material_id, quantity_used, quantity_produced, formula_id FROM production_batches WHERE id = $1',
      [id]
    );
    if (existing.rowCount === 0) throw new Error('Production Entry not found');
    const oldProd = existing.rows[0];

    let production;

    if (oldProd.formula_id) {
      if (data.formula_id && data.formula_id !== oldProd.formula_id) {
        throw new Error('Cannot change formula after creation. Please delete and recreate the entry.');
      }

      const formulaRes = await client.query(ProductionModel.findFormulaWithIngredients, [oldProd.formula_id]);
      if (formulaRes.rowCount === 0) throw new Error('Formula not found or inactive');
      const formula = formulaRes.rows[0];
      const newQuantityProduced = parseFloat(data.quantity_produced);
      const newIngredients = scaleFormulaIngredients(formula, newQuantityProduced);

      const oldMaterialsRes = await client.query(ProductionModel.findBatchMaterialsByBatchId, [id]);
      const oldMaterialsMap = new Map(oldMaterialsRes.rows.map((m) => [m.raw_material_id, parseFloat(m.quantity_used)]));

      const shortfalls = [];
      for (const ing of newIngredients) {
        const diff = ing.quantity - (oldMaterialsMap.get(ing.raw_material_id) || 0);
        if (diff > 0) {
          const stockRes = await client.query(ProductionModel.checkRawMaterialStock, [ing.raw_material_id]);
          const currentStock = parseFloat(stockRes.rows[0].current_stock);
          if (currentStock < diff) {
            shortfalls.push(`${stockRes.rows[0].name} (Available: ${currentStock}, Additional Required: ${diff.toFixed(2)})`);
          }
        }
      }
      if (shortfalls.length > 0) {
        throw new Error(`Insufficient stock to update: ${shortfalls.join('; ')}`);
      }

      for (const ing of newIngredients) {
        const diff = ing.quantity - (oldMaterialsMap.get(ing.raw_material_id) || 0);
        if (diff !== 0) {
          await client.query(ProductionModel.updateRawMaterialStock, [-diff, ing.raw_material_id]);
        }
      }

      await client.query(ProductionModel.deleteBatchMaterialsByBatchId, [id]);
      for (const ing of newIngredients) {
        await client.query(ProductionModel.insertBatchMaterial, [id, ing.raw_material_id, ing.quantity]);
      }

      const readyDiff = newQuantityProduced - parseFloat(oldProd.quantity_produced);
      if (readyDiff !== 0) {
        await client.query(ProductionModel.updateReadyMaterialStock, [readyDiff, oldProd.ready_material_id]);
      }

      const result = await client.query(ProductionModel.update, [
        data.production_date, data.shift, data.operator_name, data.machine,
        oldProd.raw_material_id, oldProd.ready_material_id, oldProd.quantity_used,
        newQuantityProduced, data.remarks || null, id
      ]);
      production = result.rows[0];
    } else {
      // For simplicity and data integrity, prevent changing material types.
      // If they must change it, they should delete and recreate.
      if (oldProd.raw_material_id !== data.raw_material_id || oldProd.ready_material_id !== data.ready_material_id) {
        throw new Error('Cannot change raw or ready material types after creation. Please delete and recreate the entry.');
      }

      const rawDiff = parseFloat(data.quantity_used) - parseFloat(oldProd.quantity_used);
      const readyDiff = parseFloat(data.quantity_produced) - parseFloat(oldProd.quantity_produced);

      if (rawDiff > 0) {
        const stockRes = await client.query(ProductionModel.checkRawMaterialStock, [data.raw_material_id]);
        const currentStock = parseFloat(stockRes.rows[0].current_stock);
        if (currentStock < rawDiff) {
          throw new Error(`Insufficient stock for ${stockRes.rows[0].name} to update. Additional required: ${rawDiff}, Available: ${currentStock}`);
        }
      }

      const result = await client.query(ProductionModel.update, [
        data.production_date, data.shift, data.operator_name, data.machine,
        data.raw_material_id, data.ready_material_id, data.quantity_used,
        data.quantity_produced, data.remarks || null, id
      ]);
      production = result.rows[0];

      if (rawDiff !== 0) {
        await client.query(ProductionModel.updateRawMaterialStock, [-rawDiff, production.raw_material_id]);
      }
      if (readyDiff !== 0) {
        await client.query(ProductionModel.updateReadyMaterialStock, [readyDiff, production.ready_material_id]);
      }
    }

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

    const existing = await client.query(
      'SELECT raw_material_id, ready_material_id, quantity_used, quantity_produced, formula_id FROM production_batches WHERE id = $1',
      [id]
    );
    if (existing.rowCount === 0) throw new Error('Production Entry not found');
    const production = existing.rows[0];

    if (production.formula_id) {
      const materialsRes = await client.query(ProductionModel.findBatchMaterialsByBatchId, [id]);
      for (const m of materialsRes.rows) {
        await client.query(ProductionModel.updateRawMaterialStock, [m.quantity_used, m.raw_material_id]);
      }
    } else {
      await client.query(ProductionModel.updateRawMaterialStock, [production.quantity_used, production.raw_material_id]);
    }

    // Remove the produced ready material (production_batch_materials rows cascade-delete with the batch)
    await client.query(ProductionModel.updateReadyMaterialStock, [-production.quantity_produced, production.ready_material_id]);

    await client.query(ProductionModel.delete, [id]);

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
  const production = result.rows[0];

  if (production.formula_id) {
    const materialsRes = await pool.query(ProductionModel.findBatchMaterialsByBatchId, [id]);
    production.materials = materialsRes.rows;
  }

  return production;
};

export const getProductionsList = async (queryParams) => {
  const { page = 1, limit = 10, search, start_date, end_date, shift, operator_name } = queryParams;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, rm.name as raw_material_name, rdm.name as ready_material_name, pf.name as formula_name
    FROM production_batches p
    LEFT JOIN raw_materials rm ON p.raw_material_id = rm.id
    LEFT JOIN ready_materials rdm ON p.ready_material_id = rdm.id
    LEFT JOIN product_formulas pf ON p.formula_id = pf.id
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
