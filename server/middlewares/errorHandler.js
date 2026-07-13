import { config } from '../config/index.js';

/**
 * Centralized error handling middleware.
 * Captures all errors thrown in the application and returns a formatted JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[Error] ${err.message}`);
  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: config.nodeEnv === 'production' ? null : err.stack,
  });
};
