import express from 'express';
import { check } from 'express-validator';
import * as expenseController from '../controllers/expense.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

const validCategories = [
  'Vehicle Diesel', 'Vehicle Toll', 'Driver Expenses', 'JCB Unloading Charges', 
  'JCB Diesel Charges', 'Labour Wages', 'Labour Salary', 'Machine Maintenance', 
  'Hydra Expenses', 'Electricity', 'Office Expenses', 'Other Expenses'
];

const expenseValidationRules = [
  check('expense_date', 'Valid expense date is required').isISO8601(),
  check('category', 'Valid category is required').isIn(validCategories),
  check('amount', 'Amount must be greater than zero').isFloat({ gt: 0 }),
  check('payment_type', 'Payment type must be Cash, Bank, or UPI').optional().isIn(['Cash', 'Bank', 'UPI']),
  check('reference_number').optional().isString(),
  check('description').optional().isString(),
  check('remarks').optional().isString()
];

// All routes are protected
router.use(protect);

router.get('/summary/monthly', expenseController.getMonthlySummary);
router.get('/summary/yearly', expenseController.getYearlySummary);

router.post('/', expenseValidationRules, validate, expenseController.createExpense);
router.put('/:id', expenseValidationRules, validate, expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);
router.get('/:id', expenseController.getExpense);
router.get('/', expenseController.listExpenses);

export default router;
