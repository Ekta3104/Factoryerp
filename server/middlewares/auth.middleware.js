import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Middleware: protect
 *
 * Guards routes that require a valid session.
 * - Reads the JWT from the HTTP-only `jwt` cookie (never from headers).
 * - Verifies signature, expiry, issuer, and audience.
 * - Attaches { id, role } to req.user so downstream handlers and the
 *   `authorize` middleware can use them without an extra DB round-trip.
 */
export const protect = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no session token found',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'factoryerp-api',
      audience: 'factoryerp-client',
    });

    // Attach id and role — role avoids an extra DB query on every request
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired session',
    });
  }
};

/**
 * Middleware factory: authorize(...roles)
 *
 * Must be used AFTER `protect`. Restricts access to users whose role
 * is included in the allowed roles list.
 *
 * Usage:
 *   router.delete('/users/:id', protect, authorize('Owner', 'Admin'), handler);
 *
 * @param {...string} roles - Allowed role strings
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — required role: ${roles.join(' | ')}`,
      });
    }
    next();
  };
};
