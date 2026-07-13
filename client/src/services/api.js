import axios from 'axios';

/**
 * Axios instance — base API client.
 * withCredentials: true  → sends the HTTP-only JWT cookie on every request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for HTTP-only cookie-based JWT auth
});

// Request interceptor — extend here if needed (e.g. X-Request-ID header)
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — centralised error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
