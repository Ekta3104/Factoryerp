import React, { useState, useEffect } from 'react';
import { advanceService } from '../../services/advanceService';
import FinancialMetricCard from '../../components/common/FinancialMetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import GiveAdvanceModal from './GiveAdvanceModal';
import AdjustAdvanceModal from './AdjustAdvanceModal';
import RecordRefundModal from './RecordRefundModal';
import { toast } from 'react-hot-toast';
import {
  RiHandHeartLine,
  RiExchangeDollarLine,
  RiRefund2Line,
  RiTimeLine,
  RiAddLine,
  RiFileList3Line,
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

const AdvanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [advances, setAdvances] = useState([]);
  const [summary, setSummary] = useState({});
  const [isGiveAdvanceOpen, setIsGiveAdvanceOpen] = useState(false);
  const [selectedAdvanceForAdjust, setSelectedAdvanceForAdjust] = useState(null);
  const [selectedAdvanceForRefund, setSelectedAdvanceForRefund] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await advanceService.getAdvances({ limit: 10 });
      setAdvances(res.data?.advances || []);
      setSummary(res.data?.summary || {});
    } catch (err) {
      toast.error('Failed to load advance dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Universal Advance Management</h1>
          <p className="page-subtitle">Track advances given to Employees, Labour, Contractors, Suppliers, Drivers, and Technicians</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setIsGiveAdvanceOpen(true)} className="btn btn-primary">
            <RiAddLine size={18} />
            Give Advance
          </button>
          <Link to="/advances/register" className="btn btn-secondary">
            <RiFileList3Line size={18} />
            Advance Register
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading advance dashboard…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FinancialMetricCard title="Total Advances Disbursed" value={fmt(summary.total_disbursed)} icon={RiHandHeartLine} color="blue" />
            <FinancialMetricCard title="Total Adjusted (Salary/Invoice)" value={fmt(summary.total_adjusted)} icon={RiExchangeDollarLine} color="amber" />
            <FinancialMetricCard title="Total Direct Refunded" value={fmt(summary.total_refunded)} icon={RiRefund2Line} color="purple" />
            <FinancialMetricCard title="Net Outstanding Balance" value={fmt(summary.total_outstanding)} icon={RiTimeLine} color="rose" />
          </div>

          <div className="content-card">
            <div className="content-card-header">
              <div>
                <h3>Active Advance Register Summary</h3>
                <p>Universal advance ledger records across all entity types</p>
              </div>
              <Link to="/advances/register" className="text-xs font-semibold" style={{ color: 'var(--color-brand-600)' }}>
                View Full Advance Register ➔
              </Link>
            </div>

            {advances.length === 0 ? (
              <div className="table-empty-state">
                <p>No advances have been given yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Advance #</th>
                      <th>Date</th>
                      <th>Recipient</th>
                      <th>Category / Purpose</th>
                      <th>Disbursed</th>
                      <th>Adjusted</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map((a) => (
                      <tr key={a.id}>
                        <td className="font-semibold text-slate-900">{a.advance_number}</td>
                        <td className="text-slate-500">{new Date(a.disbursement_date).toLocaleDateString()}</td>
                        <td className="font-medium text-slate-900">
                          {a.party_name}
                          <span className="block text-[11px] font-normal text-slate-400">{a.party_type}</span>
                        </td>
                        <td>{a.category_name || a.reason}</td>
                        <td className="font-bold text-slate-900">{fmt(a.amount)}</td>
                        <td className="text-amber-600">{fmt(a.adjusted_amount)}</td>
                        <td className="text-rose-600 font-bold">{fmt(a.outstanding_balance)}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td className="table-actions">
                          {parseFloat(a.outstanding_balance) > 0 && a.status !== 'Reversed' && (
                            <>
                              <button onClick={() => setSelectedAdvanceForAdjust(a)} className="btn-pill btn-pill-amber">
                                Adjust
                              </button>
                              <button onClick={() => setSelectedAdvanceForRefund(a)} className="btn-pill btn-pill-emerald">
                                Refund
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <GiveAdvanceModal isOpen={isGiveAdvanceOpen} onClose={() => setIsGiveAdvanceOpen(false)} onSuccess={fetchDashboardData} />
      <AdjustAdvanceModal isOpen={!!selectedAdvanceForAdjust} onClose={() => setSelectedAdvanceForAdjust(null)} advance={selectedAdvanceForAdjust} onSuccess={fetchDashboardData} />
      <RecordRefundModal isOpen={!!selectedAdvanceForRefund} onClose={() => setSelectedAdvanceForRefund(null)} advance={selectedAdvanceForRefund} onSuccess={fetchDashboardData} />
    </div>
  );
};

export default AdvanceDashboard;
