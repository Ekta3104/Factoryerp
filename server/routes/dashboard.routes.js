import express from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Single optimized endpoint — returns all KPIs + trends in one response
router.get('/', getDashboard);

export default router;
