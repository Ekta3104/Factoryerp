import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import VehicleInwardsList from './pages/vehicle-inwards/VehicleInwardsList.jsx';
import ProductionList from './pages/production/ProductionList.jsx';
import DispatchList from './pages/dispatch/DispatchList.jsx';
import ExpenseList from './pages/expenses/ExpenseList.jsx';
import Reports from './pages/reports/Reports.jsx';

/**
 * App — root router.
 *
 * Public routes:
 *   /login    → Login page
 *   /         → redirect to /login
 *
 * Protected routes (require valid JWT session):
 *   /dashboard → Dashboard (placeholder)
 *
 * Future protected routes (add inside the ProtectedRoute wrapper):
 *   /vehicle-inwards
 *   /production
 *   /dispatch
 *   /expenses
 *   /reports
 */
function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — all routes inside here require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicle-inwards" element={<VehicleInwardsList />} />
          <Route path="/production" element={<ProductionList />} />
          <Route path="/dispatches" element={<DispatchList />} />
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/reports" element={<Reports />} />
          {/* Add future module routes here */}
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
