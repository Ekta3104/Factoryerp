import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salaryService';
import StatusBadge from '../../components/common/StatusBadge';
import AddSalaryModal from './AddSalaryModal';
import RecordPaymentModal from './RecordPaymentModal';
import { toast } from 'react-hot-toast';
import { 
  RiSearchLine, 
  RiAddLine, 
  RiFileExcelLine
} from 'react-icons/ri';

const SalaryRegister = () => {
  const [salaries, setSalaries] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [selectedSalaryForPayment, setSelectedSalaryForPayment] = useState(null);

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [search, cycleFilter, statusFilter]);

  const fetchCycles = async () => {
    try {
      const res = await salaryService.getSalaryCycles();
      setCycles(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await salaryService.getSalaries({
        search,
        salary_cycle_id: cycleFilter,
        status: statusFilter,
        limit: 100,
      });
      setSalaries(res.data?.salaries || []);
    } catch (err) {
      toast.error('Failed to load salary register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salary Register</h1>
          <p className="text-sm text-slate-500">Comprehensive payroll records, partial payments, and balance tracking</p>
        </div>
        <button
          onClick={() => setIsAddSalaryOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
        >
          <RiAddLine className="w-5 h-5" />
          + Add Salary Record
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by employee name or salary cycle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={cycleFilter}
          onChange={(e) => setCycleFilter(e.target.value)}
          className="w-full md:w-48 px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Salary Cycles</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.cycle_name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Salary Register Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-3">Employee Name</th>
                <th className="py-3 px-3">Salary Cycle</th>
                <th className="py-3 px-3">Gross Salary</th>
                <th className="py-3 px-3">Advance Deduction</th>
                <th className="py-3 px-3">Net Salary</th>
                <th className="py-3 px-3">Paid Amount</th>
                <th className="py-3 px-3">Pending Balance</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaries.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-slate-900">
                    {s.party_name}
                    <span className="block text-[11px] font-normal text-slate-400">{s.party_type}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">{s.cycle_name}</td>
                  <td className="py-3.5 px-3 font-medium text-slate-800">₹{parseFloat(s.gross_salary).toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-purple-700 font-medium">₹{parseFloat(s.adjusted_advance_amount || 0).toLocaleString()}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">₹{parseFloat(s.net_salary).toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-bold">₹{parseFloat(s.paid_amount).toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-rose-600 font-bold">₹{parseFloat(s.pending_balance).toLocaleString()}</td>
                  <td className="py-3.5 px-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3.5 px-3 text-right">
                    {parseFloat(s.pending_balance) > 0 && (
                      <button
                        onClick={() => setSelectedSalaryForPayment(s)}
                        className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm"
                      >
                        + Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddSalaryModal
        isOpen={isAddSalaryOpen}
        onClose={() => setIsAddSalaryOpen(false)}
        onSuccess={fetchSalaries}
      />

      <RecordPaymentModal
        isOpen={!!selectedSalaryForPayment}
        onClose={() => setSelectedSalaryForPayment(null)}
        salary={selectedSalaryForPayment}
        onSuccess={fetchSalaries}
      />
    </div>
  );
};

export default SalaryRegister;
