import express from 'express';
import { salaryController } from '../controllers/salary.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/cycles', salaryController.getSalaryCycles);
router.post('/cycles', authorize('Owner', 'Admin'), salaryController.createSalaryCycle);
router.patch('/cycles/:id/status', authorize('Owner', 'Admin'), salaryController.updateSalaryCycleStatus);

router.get('/', salaryController.getSalaries);
router.get('/:id', salaryController.getSalaryDetails);
router.post('/', authorize('Owner', 'Admin'), salaryController.addSalaryRecord);
router.post('/payments', authorize('Owner', 'Admin'), salaryController.recordSalaryPayment);

router.get('/structures', salaryController.getSalaryStructures);
router.post('/structures', authorize('Owner', 'Admin'), salaryController.saveSalaryStructure);

export default router;
