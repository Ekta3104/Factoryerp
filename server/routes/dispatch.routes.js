import express from 'express';
import { check } from 'express-validator';
import * as dispatchController from '../controllers/dispatch.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

const dispatchValidationRules = [
  check('dispatch_date', 'Valid dispatch date is required').isISO8601(),
  check('customer_id', 'Valid Customer UUID is required').isUUID(),
  check('ready_material_id', 'Valid Ready Material UUID is required').isUUID(),
  check('vehicle_number', 'Vehicle number is required').notEmpty(),
  check('driver_name', 'Driver name is required').notEmpty(),
  check('quantity_dispatched', 'Quantity dispatched must be a positive number').isFloat({ min: 0.01 }),
  check('destination', 'Destination is required').notEmpty(),
  check('remarks').optional().isString()
];

// All routes are protected
router.use(protect);

router.post('/', dispatchValidationRules, validate, dispatchController.createDispatch);
router.put('/:id', dispatchValidationRules, validate, dispatchController.updateDispatch);
router.delete('/:id', dispatchController.deleteDispatch);
router.get('/:id', dispatchController.getDispatch);
router.get('/', dispatchController.listDispatches);

export default router;
