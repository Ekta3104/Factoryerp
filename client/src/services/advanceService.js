import api from './api';

export const advanceService = {
  getCategories: async () => {
    const response = await api.get('/advances/categories');
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/advances/categories', data);
    return response.data;
  },

  getAdvances: async (params) => {
    const response = await api.get('/advances', { params });
    return response.data;
  },

  getAdvanceDetails: async (id) => {
    const response = await api.get(`/advances/${id}`);
    return response.data;
  },

  disburseAdvance: async (data) => {
    const response = await api.post('/advances', data);
    return response.data;
  },

  allocateAdvance: async (data) => {
    const response = await api.post('/advances/adjust', data);
    return response.data;
  },

  recordRefund: async (data) => {
    const response = await api.post('/advances/refund', data);
    return response.data;
  },

  reverseAdvance: async (id, reason) => {
    const response = await api.post(`/advances/${id}/reverse`, { reason });
    return response.data;
  },
};
