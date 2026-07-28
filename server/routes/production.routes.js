import express from 'express';
import { check } from 'express-validator';
import * as productionController from '../controllers/production.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

const productionValidationRules = [
  check('production_date', 'Valid production date is required').isISO8601(),
  check('shift', 'Shift must be Morning, Evening, or Night').isIn(['Morning', 'Evening', 'Night']),
  check('operator_name', 'Operator name is required').notEmpty(),
  check('machine', 'Machine name is required').notEmpty(),
  check('formula_id', 'Valid Formula UUID is required').optional().isUUID(),
  check('raw_material_id', 'Valid Raw Material UUID is required').optional().isUUID(),
  check('ready_material_id', 'Valid Ready Material UUID is required').optional().isUUID(),
  check('quantity_used', 'Quantity used must be a positive number').optional().isFloat({ min: 0.01 }),
  check('quantity_produced', 'Quantity produced must be a positive number').isFloat({ min: 0.01 }),
  check('remarks').optional().isString(),
  check('formula_id').custom((value, { req }) => {
    const hasFormula = Boolean(value);
    const hasSingleMaterial = Boolean(req.body.raw_material_id) && Boolean(req.body.quantity_used);
    if (!hasFormula && !hasSingleMaterial) {
      throw new Error('Either formula_id or (raw_material_id and quantity_used) is required');
    }
    return true;
  })
];

// All routes are protected
router.use(protect);

router.post('/', productionValidationRules, validate, productionController.createProduction);
router.put('/:id', productionValidationRules, validate, productionController.updateProduction);
router.delete('/:id', productionController.deleteProduction);
router.get('/:id', productionController.getProduction);
router.get('/', productionController.listProductions);

export default router;
