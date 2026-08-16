import { FinancialReportService } from '../services/financialReport.service.js';

export const financialReportController = {
  async getDashboardSummary(req, res, next) {
    try {
      const data = await FinancialReportService.getDashboardSummary();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getLedger(req, res, next) {
    try {
      const data = await FinancialReportService.getLedger(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const data = await FinancialReportService.getAuditLogs(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async exportAdvanceRegisterExcel(req, res, next) {
    try {
      await FinancialReportService.exportAdvanceRegisterExcel(res);
    } catch (err) {
      next(err);
    }
  },

  async exportSalaryRegisterExcel(req, res, next) {
    try {
      await FinancialReportService.exportSalaryRegisterExcel(res);
    } catch (err) {
      next(err);
    }
  },

  async exportAdvanceRegisterPDF(req, res, next) {
    try {
      await FinancialReportService.exportAdvanceRegisterPDF(res);
    } catch (err) {
      next(err);
    }
  },
};
