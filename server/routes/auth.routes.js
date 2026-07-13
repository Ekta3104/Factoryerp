import express from 'express';
import { check } from 'express-validator';
import { login, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { protect } from '../middlewares/auth.middleware.js';

/**
 * Authentication Routes
 *
 * EXPOSED ENDPOINTS (intentionally minimal):
 *   POST /api/auth/login   — Public. Exchange credentials for a JWT cookie.
 *   POST /api/auth/logout  — Private. Clear the JWT cookie.
 *   GET  /api/auth/me      — Private. Return the authenticated user's profile.
 *
 * INTENTIONALLY ABSENT:
 *   There is NO registration / sign-up endpoint.
 *   Users are created exclusively via:
 *     1. Database seed script  (server/scripts/seedAdmin.js)
 *     2. Future Admin user-management module (protected by RBAC)
 */

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty().trim().escape(),
    check('password', 'Password is required').notEmpty(),
  ],
  validate,
  login
);

// POST /api/auth/logout  — requires a valid JWT cookie
router.post('/logout', protect, logout);

// GET /api/auth/me  — requires a valid JWT cookie
router.get('/me', protect, getMe);

export default router;
