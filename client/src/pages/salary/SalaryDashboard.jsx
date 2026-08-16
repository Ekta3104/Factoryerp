import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salaryService';
import FinancialMetricCard from '../../components/common/FinancialMetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import AddSalaryModal from './AddSalaryModal';
import RecordPaymentModal from './RecordPaymentModal';
import { toast } from 'react-hot-toast';
import {
  RiMoneyDollarCircleLine,
  RiCheckDoubleLine,
  RiTimeLine,
  RiAddLine,
  RiFileList3Line,
  RiBankCardLine,
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

const SalaryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [summary, setSummary] = useState({});
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [selectedSalaryForPayment, setSelectedSalaryForPayment] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const cycleRes = await salaryService.getSalaryCycles();
      const salaryRes = await salaryService.getSalaries({ limit: 10 });
      setCycles(cycleRes.data || []);
      setSalaries(salaryRes.data?.salaries || []);
      setSummary(salaryRes.data?.summary || {});
    } catch (err) {
      toast.error('Failed to load salary dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Management</h1>
          <p className="page-subtitle">Track salary cycles, manual payouts, advance deductions, and pending balances</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setIsAddSalaryOpen(true)} className="btn btn-primary">
            <RiAddLine size={18} />
            Add Salary Record
          </button>
          <Link to="/salaries/register" className="btn btn-secondary">
            <RiFileList3Line size={18} />
            Salary Register
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading salary dashboard…
        </div>
      ) : (
        <>
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FinancialMetricCard title="Total Gross Salary Accrued" value={fmt(summary.total_gross)} icon={RiMoneyDollarCircleLine} color="blue" />
            <FinancialMetricCard title="Total Salary Paid" value={fmt(summary.total_paid)} icon={RiCheckDoubleLine} color="green" />
            <FinancialMetricCard title="Total Pending Balance" value={fmt(summary.total_pending)} icon={RiTimeLine} color="rose" />
            <FinancialMetricCard title="Advance Deductions" value={fmt(summary.total_advance_deductions)} icon={RiBankCardLine} color="purple" />
          </div>

          {/* Salary Cycles & Recent Records Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Salary Cycles Widget */}
            <div className="content-card">
              <div className="content-card-header">
                <h3>Salary Cycles</h3>
                <span className="unit-badge">{cycles.length} Cycles</span>
              </div>

              {cycles.length === 0 ? (
                <div className="table-empty-state">
                  <p>No salary cycles yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {cycles.map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all border border-slate-100">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-slate-900 text-sm">{c.cycle_name}</h4>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-2 text-xs text-slate-500 flex justify-between">
                        <span>Gross: {fmt(c.total_gross_salary)}</span>
                        <span>Paid: {fmt(c.total_paid_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Salary Payouts Table */}
            <div className="lg:col-span-2 content-card">
              <div className="content-card-header">
                <h3>Recent Salary Records</h3>
                <Link to="/salaries/register" className="text-xs font-semibold" style={{ color: 'var(--color-brand-600)' }}>
                  View All Register ➔
                </Link>
              </div>

              {salaries.length === 0 ? (
                <div className="table-empty-state">
                  <p>No salary records yet</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Cycle</th>
                        <th>Net Salary</th>
                        <th>Paid</th>
                        <th>Pending</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <span className="font-semibold text-slate-900">{s.party_name}</span>
                            <span className="block text-[11px] font-normal text-slate-400">{s.party_type}</span>
                          </td>
                          <td>{s.cycle_name}</td>
                          <td className="font-bold text-slate-900">{fmt(s.net_salary)}</td>
                          <td className="text-emerald-600 font-medium">{fmt(s.paid_amount)}</td>
                          <td className="text-rose-600 font-medium">{fmt(s.pending_balance)}</td>
                          <td><StatusBadge status={s.status} /></td>
                          <td className="table-actions">
                            {parseFloat(s.pending_balance) > 0 && (
                              <button onClick={() => setSelectedSalaryForPayment(s)} className="btn-pill btn-pill-blue">
                                + Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <AddSalaryModal
        isOpen={isAddSalaryOpen}
        onClose={() => setIsAddSalaryOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <RecordPaymentModal
        isOpen={!!selectedSalaryForPayment}
        onClose={() => setSelectedSalaryForPayment(null)}
        salary={selectedSalaryForPayment}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default SalaryDashboard;
