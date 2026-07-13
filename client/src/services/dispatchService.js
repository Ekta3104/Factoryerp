import api from './api';

export const listDispatches = async (params) => {
  try {
    const response = await api.get('/dispatches', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch dispatches');
  }
};

export const getDispatch = async (id) => {
  try {
    const response = await api.get(`/dispatches/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch dispatch details');
  }
};

export const createDispatch = async (data) => {
  try {
    const response = await api.post('/dispatches', data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create dispatch');
  }
};

export const updateDispatch = async (id, data) => {
  try {
    const response = await api.put(`/dispatches/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update dispatch');
  }
};

export const deleteDispatch = async (id) => {
  try {
    const response = await api.delete(`/dispatches/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete dispatch');
  }
};
