import { getDashboardData } from '../services/dashboard.service.js';

export const getDashboard = async (req, res) => {
  try {
    const data = await getDashboardData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
