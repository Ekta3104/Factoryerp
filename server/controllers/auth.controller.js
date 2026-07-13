import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { config } from '../config/index.js';

/**
 * Generates a signed JWT containing the user's ID and role.
 * Role is embedded to avoid a DB round-trip on every protected request.
 *
 * @param {string} id   - User UUID
 * @param {string} role - User role (e.g. 'Admin', 'Owner', 'Operator')
 * @returns {string} Signed JWT string
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'factoryerp-api',
    audience: 'factoryerp-client',
  });
};

/**
 * Attaches the JWT as an HTTP-only, Secure, SameSite=Strict cookie.
 *
 * @param {Object} res          - Express response object
 * @param {string} token        - Signed JWT string
 * @param {number} maxAgeMs     - Cookie max-age in milliseconds
 */
const setTokenCookie = (res, token, maxAgeMs = 24 * 60 * 60 * 1000) => {
  res.cookie('jwt', token, {
    httpOnly: true,                                  // Not accessible via JS
    secure: config.nodeEnv === 'production',         // HTTPS only in production
    sameSite: 'strict',                              // CSRF protection
    maxAge: maxAgeMs,
  });
};

/**
 * @desc    Authenticate user and issue JWT cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Look up user by username only (avoid timing side-channel on email lookup)
    const result = await pool.query(
      'SELECT id, username, email, role, password_hash, is_active FROM users WHERE username = $1',
      [username]
    );

    // 2. Always run bcrypt compare to prevent timing attacks (constant-time response)
    const DUMMY_HASH = '$2b$10$invalidhashfortimingprotectionXXXXXXXXXXXXXXXXXXXXXX';
    const user = result.rows[0] || null;
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;

    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 3. Check that account is active
    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Contact your administrator.',
      });
    }

    // 4. Issue signed JWT (role embedded — no DB hit required on protected routes)
    const token = generateToken(user.id, user.role);
    setTokenCookie(res, token);

    // 5. Respond with non-sensitive user data
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @desc    Invalidate the JWT cookie to log the user out
 * @route   POST /api/auth/logout
 * @access  Private (requires valid JWT cookie)
 */
export const logout = (req, res) => {
  // Overwrite the cookie with an immediately-expired value
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    expires: new Date(0),    // Epoch 0 — browser drops it immediately
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Return the authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT cookie)
 */
export const getMe = async (req, res) => {
  try {
    // req.user is populated by the protect middleware from the verified JWT
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};
