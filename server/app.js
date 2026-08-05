import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

// Initialize Express app
const app = express();

const formattedCorsOrigin = config.corsOrigin 
  ? new URL(config.corsOrigin).origin 
  : 'https://jape-enterprises.vercel.app';

// Global Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors({ origin: formattedCorsOrigin, credentials: true })); // Enable CORS
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Request Logging Middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Factory ERP API is running' });
});
// API Routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

export default app;
