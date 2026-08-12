import express from 'express';
import { financialReportController } from '../controllers/financialReport.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard-summary', financialReportController.getDashboardSummary);
router.get('/ledger', financialReportController.getLedger);
router.get('/audit-logs', financialReportController.getAuditLogs);

router.get('/exports/advances/excel', financialReportController.exportAdvanceRegisterExcel);
router.get('/exports/salaries/excel', financialReportController.exportSalaryRegisterExcel);
router.get('/exports/advances/pdf', financialReportController.exportAdvanceRegisterPDF);

export default router;
