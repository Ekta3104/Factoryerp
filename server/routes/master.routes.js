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

    res.status(200).json({
      success: true,
      data: {
        suppliers: suppliersRes.rows,
        rawMaterials: rawMaterialsRes.rows,
        customers: customersRes.rows,
        readyMaterials: readyMaterialsRes.rows
      }
    });
  } catch (error) {
    console.error('Master Options Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
