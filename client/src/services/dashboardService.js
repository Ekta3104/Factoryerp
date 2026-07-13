import api from './api';

export const fetchDashboardData = async () => {
  try {
    const response = await api.get('/dashboard');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
  }
};
