import api from './api';

export const listProductions = async (params) => {
  try {
    const response = await api.get('/productions', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch productions');
  }
};

export const getProduction = async (id) => {
  try {
    const response = await api.get(`/productions/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch production details');
  }
};

export const createProduction = async (data) => {
  try {
    const response = await api.post('/productions', data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create production batch');
  }
};

export const updateProduction = async (id, data) => {
  try {
    const response = await api.put(`/productions/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update production batch');
  }
};

export const deleteProduction = async (id) => {
  try {
    const response = await api.delete(`/productions/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete production batch');
  }
};
