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
  RiFileList3Line
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

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
    <div className="p-6 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Universal Advance Management</h1>
          <p className="text-sm text-slate-500">Track advances given to Employees, Labour, Contractors, Suppliers, Drivers, and Technicians</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsGiveAdvanceOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
          >
            <RiAddLine className="w-5 h-5" />
            + Give Advance
          </button>
          <Link
            to="/advances/register"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
          >
            <RiFileList3Line className="w-5 h-5" />
            Advance Register
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinancialMetricCard
          title="Total Advances Disbursed"
          value={`₹${parseFloat(summary.total_disbursed || 0).toLocaleString()}`}
          icon={RiHandHeartLine}
          color="blue"
        />
        <FinancialMetricCard
          title="Total Adjusted (Salary/Invoice)"
          value={`₹${parseFloat(summary.total_adjusted || 0).toLocaleString()}`}
          icon={RiExchangeDollarLine}
          color="amber"
        />
        <FinancialMetricCard
          title="Total Direct Refunded"
          value={`₹${parseFloat(summary.total_refunded || 0).toLocaleString()}`}
          icon={RiRefund2Line}
          color="purple"
        />
        <FinancialMetricCard
          title="Net Outstanding Balance"
          value={`₹${parseFloat(summary.total_outstanding || 0).toLocaleString()}`}
          icon={RiTimeLine}
          color="rose"
        />
      </div>

      {/* Recent Advances Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Active Advance Register Summary</h3>
            <p className="text-xs text-slate-500">Universal advance ledger records across all entity types</p>
          </div>
          <Link to="/advances/register" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View Full Advance Register ➔
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Advance #</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Category / Purpose</th>
                <th className="py-2.5 px-3">Disbursed</th>
                <th className="py-2.5 px-3">Adjusted</th>
                <th className="py-2.5 px-3">Outstanding</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">{a.advance_number}</td>
                  <td className="py-3 px-3 text-slate-500">{new Date(a.disbursement_date).toLocaleDateString()}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {a.party_name}
                    <span className="block text-[11px] font-normal text-slate-400">{a.party_type}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{a.category_name || a.reason}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{parseFloat(a.amount).toLocaleString()}</td>
                  <td className="py-3 px-3 text-amber-600">₹{parseFloat(a.adjusted_amount).toLocaleString()}</td>
                  <td className="py-3 px-3 text-rose-600 font-bold">₹{parseFloat(a.outstanding_balance).toLocaleString()}</td>
                  <td className="py-3 px-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    {parseFloat(a.outstanding_balance) > 0 && a.status !== 'Reversed' && (
                      <>
                        <button
                          onClick={() => setSelectedAdvanceForAdjust(a)}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-all"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => setSelectedAdvanceForRefund(a)}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                        >
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
      </div>

      {/* Modals */}
      <GiveAdvanceModal
        isOpen={isGiveAdvanceOpen}
        onClose={() => setIsGiveAdvanceOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <AdjustAdvanceModal
        isOpen={!!selectedAdvanceForAdjust}
        onClose={() => setSelectedAdvanceForAdjust(null)}
        advance={selectedAdvanceForAdjust}
        onSuccess={fetchDashboardData}
      />

      <RecordRefundModal
        isOpen={!!selectedAdvanceForRefund}
        onClose={() => setSelectedAdvanceForRefund(null)}
        advance={selectedAdvanceForRefund}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};

export default AdvanceDashboard;
