import express from 'express';
import { check } from 'express-validator';
import * as inwardController from '../controllers/vehicleInward.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

const inwardValidationRules = [
  check('vehicle_number', 'Vehicle number is required').notEmpty(),
  check('supplier_id', 'Valid Supplier UUID is required').isUUID(),
  check('raw_material_id', 'Valid Raw Material UUID is required').isUUID(),
  check('quantity_received', 'Quantity received must be a positive number').isFloat({ min: 0.01 }),
  check('diesel_expense', 'Diesel expense cannot be negative').optional().isFloat({ min: 0 }),
  check('toll_expense', 'Toll expense cannot be negative').optional().isFloat({ min: 0 }),
  check('driver_expense', 'Driver expense cannot be negative').optional().isFloat({ min: 0 }),
  check('jcb_unloading_charges', 'JCB unloading charges cannot be negative').optional().isFloat({ min: 0 }),
  check('jcb_diesel_charges', 'JCB diesel charges cannot be negative').optional().isFloat({ min: 0 }),
];

// All routes are protected
router.use(protect);

router.post('/', inwardValidationRules, validate, inwardController.createInward);
router.put('/:id', inwardValidationRules, validate, inwardController.updateInward);
router.delete('/:id', inwardController.deleteInward);
router.get('/:id', inwardController.getInward);
router.get('/', inwardController.listInwards);

export default router;
