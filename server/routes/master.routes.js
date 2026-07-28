import express from 'express';
import { pool } from '../config/db.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// GET /api/master/options - Returns lists for dropdowns
router.get('/options', async (req, res) => {
  try {
    const suppliersRes = await pool.query('SELECT id, name FROM suppliers ORDER BY name');
    const rawMaterialsRes = await pool.query('SELECT r.id, r.name, u.name as unit FROM raw_materials r LEFT JOIN units u ON r.unit_id = u.id ORDER BY r.name');
    const customersRes = await pool.query('SELECT id, name FROM customers ORDER BY name');
    const readyMaterialsRes = await pool.query('SELECT r.id, r.name, u.name as unit FROM ready_materials r LEFT JOIN units u ON r.unit_id = u.id ORDER BY r.name');
    const formulasRes = await pool.query(`
      SELECT pf.id, pf.name, pf.output_quantity, pf.ready_material_id,
        rdm.name as ready_material_name, rdm.pack_size_kg, u.name as ready_material_unit,
        COALESCE(
          json_agg(
            json_build_object('raw_material_id', fi.raw_material_id, 'raw_material_name', rm.name, 'quantity', fi.quantity)
          ) FILTER (WHERE fi.id IS NOT NULL),
          '[]'
        ) as ingredients
      FROM product_formulas pf
      JOIN ready_materials rdm ON pf.ready_material_id = rdm.id
      LEFT JOIN units u ON rdm.unit_id = u.id
      LEFT JOIN formula_ingredients fi ON fi.formula_id = pf.id
      LEFT JOIN raw_materials rm ON fi.raw_material_id = rm.id
      WHERE pf.is_active = true
      GROUP BY pf.id, rdm.name, rdm.pack_size_kg, u.name
      ORDER BY pf.name
    `);

    res.status(200).json({
      success: true,
      data: {
        suppliers: suppliersRes.rows,
        rawMaterials: rawMaterialsRes.rows,
        customers: customersRes.rows,
        readyMaterials: readyMaterialsRes.rows,
        formulas: formulasRes.rows
      }
    });
  } catch (error) {
    console.error('Master Options Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
