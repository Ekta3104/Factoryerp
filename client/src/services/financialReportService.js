import api from './api';

export const financialReportService = {
  getDashboardSummary: async () => {
    const response = await api.get('/financial-reports/dashboard-summary');
    return response.data;
  },

  getLedger: async (params) => {
    const response = await api.get('/financial-reports/ledger', { params });
    return response.data;
  },

  getAuditLogs: async (params) => {
    const response = await api.get('/financial-reports/audit-logs', { params });
    return response.data;
  },

  getAdvanceExportExcelUrl: () => {
    return `${api.defaults.baseURL}/financial-reports/exports/advances/excel`;
  },

  getSalaryExportExcelUrl: () => {
    return `${api.defaults.baseURL}/financial-reports/exports/salaries/excel`;
  },

  getAdvanceExportPDFUrl: () => {
    return `${api.defaults.baseURL}/financial-reports/exports/advances/pdf`;
  },
};
