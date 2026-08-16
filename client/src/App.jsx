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
import SalaryDashboard from './pages/salary/SalaryDashboard.jsx';
import SalaryRegister from './pages/salary/SalaryRegister.jsx';
import AdvanceDashboard from './pages/advance/AdvanceDashboard.jsx';
import AdvanceRegister from './pages/advance/AdvanceRegister.jsx';
import PartyProfiles from './pages/parties/PartyProfiles.jsx';
import FinancialLedgerAudit from './pages/reports/FinancialLedgerAudit.jsx';

/**
 * App — root router.
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
          <Route path="/salaries" element={<SalaryDashboard />} />
          <Route path="/salaries/register" element={<SalaryRegister />} />
          <Route path="/advances" element={<AdvanceDashboard />} />
          <Route path="/advances/register" element={<AdvanceRegister />} />
          <Route path="/recipients" element={<PartyProfiles />} />
          <Route path="/financial-audit" element={<FinancialLedgerAudit />} />
          <Route path="/vehicle-inwards" element={<VehicleInwardsList />} />
          <Route path="/production" element={<ProductionList />} />
          <Route path="/dispatches" element={<DispatchList />} />
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
