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
  RiBankCardLine
} from 'react-icons/ri';
import { Link } from 'react-router-dom';

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
    <div className="p-6 space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salary Management</h1>
          <p className="text-sm text-slate-500">Track salary cycles, manual payouts, advance deductions, and pending balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddSalaryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
          >
            <RiAddLine className="w-5 h-5" />
            + Add Salary Record
          </button>
          <Link
            to="/salaries/register"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
          >
            <RiFileList3Line className="w-5 h-5" />
            Salary Register
          </Link>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FinancialMetricCard
          title="Total Gross Salary Accrued"
          value={`₹${parseFloat(summary.total_gross || 0).toLocaleString()}`}
          icon={RiMoneyDollarCircleLine}
          color="blue"
        />
        <FinancialMetricCard
          title="Total Salary Paid"
          value={`₹${parseFloat(summary.total_paid || 0).toLocaleString()}`}
          icon={RiCheckDoubleLine}
          color="green"
        />
        <FinancialMetricCard
          title="Total Pending Balance"
          value={`₹${parseFloat(summary.total_pending || 0).toLocaleString()}`}
          icon={RiTimeLine}
          color="rose"
        />
        <FinancialMetricCard
          title="Advance Deductions"
          value={`₹${parseFloat(summary.total_advance_deductions || 0).toLocaleString()}`}
          icon={RiBankCardLine}
          color="purple"
        />
      </div>

      {/* Salary Cycles & Recent Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary Cycles Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg">Salary Cycles</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {cycles.length} Cycles
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {cycles.map((c) => (
              <div key={c.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition-all border border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-900 text-sm">{c.cycle_name}</h4>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-2 text-xs text-slate-500 flex justify-between">
                  <span>Gross: ₹{parseFloat(c.total_gross_salary || 0).toLocaleString()}</span>
                  <span>Paid: ₹{parseFloat(c.total_paid_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Salary Payouts Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg">Recent Salary Records</h3>
            <Link to="/salaries/register" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All Register ➔
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Cycle</th>
                  <th className="py-2.5 px-3">Net Salary</th>
                  <th className="py-2.5 px-3">Paid</th>
                  <th className="py-2.5 px-3">Pending</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {s.party_name}
                      <span className="block text-[11px] font-normal text-slate-400">{s.party_type}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{s.cycle_name}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{parseFloat(s.net_salary).toLocaleString()}</td>
                    <td className="py-3 px-3 text-emerald-600 font-medium">₹{parseFloat(s.paid_amount).toLocaleString()}</td>
                    <td className="py-3 px-3 text-rose-600 font-medium">₹{parseFloat(s.pending_balance).toLocaleString()}</td>
                    <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                    <td className="py-3 px-3 text-right">
                      {parseFloat(s.pending_balance) > 0 && (
                        <button
                          onClick={() => setSelectedSalaryForPayment(s)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                        >
                          + Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
