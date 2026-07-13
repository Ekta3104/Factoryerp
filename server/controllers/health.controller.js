/**
 * Health check controller.
 * Used to verify the API is up and running.
 */
export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
