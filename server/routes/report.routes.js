import express from 'express';
import { query } from 'express-validator';
import * as reportController from '../controllers/report.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

const validCategories = [
  'Vehicle Diesel', 'Vehicle Toll', 'Driver Expenses', 'JCB Unloading Charges',
  'JCB Diesel Charges', 'Labour Wages', 'Labour Salary', 'Machine Maintenance',
  'Hydra Expenses', 'Electricity', 'Office Expenses', 'Other Expenses',
];

const commonQueryValidation = [
  query('format').optional().isIn(['json', 'excel', 'pdf']).withMessage('format must be json, excel, or pdf'),
  query('supplier_id').optional().isUUID().withMessage('supplier_id must be a valid UUID'),
  query('customer_id').optional().isUUID().withMessage('customer_id must be a valid UUID'),
  query('raw_material_id').optional().isUUID().withMessage('raw_material_id must be a valid UUID'),
  query('ready_material_id').optional().isUUID().withMessage('ready_material_id must be a valid UUID'),
  query('category').optional().isIn(validCategories).withMessage('Invalid expense category'),
  query('shift').optional().isIn(['Morning', 'Evening', 'Night']).withMessage('shift must be Morning, Evening, or Night'),
  query('operator_name').optional().isString(),
];

const customDateValidation = [
  ...commonQueryValidation,
  query('startDate').notEmpty().isISO8601().withMessage('startDate is required and must be a valid date (YYYY-MM-DD)'),
  query('endDate').notEmpty().isISO8601().withMessage('endDate is required and must be a valid date (YYYY-MM-DD)'),
];

// All routes protected
router.use(protect);

router.get('/daily',   commonQueryValidation, validate, reportController.getDailyReport);
router.get('/weekly',  commonQueryValidation, validate, reportController.getWeeklyReport);
router.get('/monthly', commonQueryValidation, validate, reportController.getMonthlyReport);
router.get('/custom',  customDateValidation,  validate, reportController.getCustomReport);

export default router;
