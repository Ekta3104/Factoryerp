import api from './api';

export const salaryService = {
  getSalaryCycles: async () => {
    const response = await api.get('/salaries/cycles');
    return response.data;
  },

  createSalaryCycle: async (data) => {
    const response = await api.post('/salaries/cycles', data);
    return response.data;
  },

  updateSalaryCycleStatus: async (id, status) => {
    const response = await api.patch(`/salaries/cycles/${id}/status`, { status });
    return response.data;
  },

  getSalaries: async (params) => {
    const response = await api.get('/salaries', { params });
    return response.data;
  },

  getSalaryDetails: async (id) => {
    const response = await api.get(`/salaries/${id}`);
    return response.data;
  },

  addSalaryRecord: async (data) => {
    const response = await api.post('/salaries', data);
    return response.data;
  },

  recordSalaryPayment: async (data) => {
    const response = await api.post('/salaries/payments', data);
    return response.data;
  },

  getSalaryStructures: async (params) => {
    const response = await api.get('/salaries/structures', { params });
    return response.data;
  },

  saveSalaryStructure: async (data) => {
    const response = await api.post('/salaries/structures', data);
    return response.data;
  },
};
