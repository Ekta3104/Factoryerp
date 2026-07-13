import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Behaviour:
 *   • While the session check is still running → renders nothing (avoids flash).
 *   • Unauthenticated user → redirects to /login (replaces history entry).
 *   • Authenticated user   → renders the child route via <Outlet />.
 *
 * Usage (in App.jsx):
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Session check still in progress — render nothing to avoid a redirect flash
  if (isLoading) return null;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
