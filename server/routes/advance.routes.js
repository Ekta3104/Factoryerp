import express from 'express';
import { advanceController } from '../controllers/advance.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/categories', advanceController.getCategories);
router.post('/categories', authorize('Owner', 'Admin'), advanceController.createCategory);

router.get('/', advanceController.getAdvances);
router.get('/:id', advanceController.getAdvanceDetails);
router.post('/', authorize('Owner', 'Admin'), advanceController.disburseAdvance);
router.post('/adjust', authorize('Owner', 'Admin'), advanceController.allocateAdvance);
router.post('/refund', authorize('Owner', 'Admin'), advanceController.recordRefund);
router.post('/:id/reverse', authorize('Owner', 'Admin'), advanceController.reverseAdvance);

export default router;
