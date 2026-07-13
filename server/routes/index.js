import express from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import vehicleInwardRoutes from './vehicleInward.routes.js';
import productionRoutes from './production.routes.js';
import dispatchRoutes from './dispatch.routes.js';
import expenseRoutes from './expense.routes.js';
import reportRoutes from './report.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import masterRoutes from './master.routes.js';

const router = express.Router();

// Mount all API routes here
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/vehicle-inwards', vehicleInwardRoutes);
router.use('/productions', productionRoutes);
router.use('/dispatches', dispatchRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/master', masterRoutes);

export default router;

