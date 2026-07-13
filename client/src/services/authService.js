import api from './api';

/**
 * authService — wraps all /api/auth endpoints.
 * Credentials travel via HTTP-only cookie; no token handling in JS.
 */

/**
 * Authenticate with username + password.
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<{ id, username, email, role }>}
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data; // { id, username, email, role }
};

/**
 * Clear the server-side JWT cookie (user signs out).
 */
export const logoutUser = async () => {
  await api.post('/auth/logout');
};

/**
 * Fetch the currently authenticated user's profile.
 * Returns null if not authenticated (401).
 * @returns {Promise<{ id, username, email, role, created_at } | null>}
 */
export const fetchCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch {
    return null;
  }
};
