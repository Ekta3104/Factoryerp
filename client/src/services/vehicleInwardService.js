import api from './api';

export const listInwards = async (params) => {
  try {
    const response = await api.get('/vehicle-inwards', { params });
    // Assuming backend returns { success: true, data: [...], pagination: {...} }
    // If not, we return the whole object, but let's just return the response data
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch vehicle inwards');
  }
};

export const getInward = async (id) => {
  try {
    const response = await api.get(`/vehicle-inwards/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch inward');
  }
};

export const createInward = async (data) => {
  try {
    const response = await api.post('/vehicle-inwards', data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create inward');
  }
};

export const updateInward = async (id, data) => {
  try {
    const response = await api.put(`/vehicle-inwards/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update inward');
  }
};

export const deleteInward = async (id) => {
  try {
    const response = await api.delete(`/vehicle-inwards/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete inward');
  }
};
