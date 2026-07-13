import api from './api';

export const listExpenses = async (params) => {
  try {
    const response = await api.get('/expenses', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch expenses');
  }
};

export const getExpense = async (id) => {
  try {
    const response = await api.get(`/expenses/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch expense details');
  }
};

export const createExpense = async (data) => {
  try {
    const response = await api.post('/expenses', data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create expense');
  }
};

export const updateExpense = async (id, data) => {
  try {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update expense');
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete expense');
  }
};
