import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salaryService';
import StatusBadge from '../../components/common/StatusBadge';
import AddSalaryModal from './AddSalaryModal';
import RecordPaymentModal from './RecordPaymentModal';
import { toast } from 'react-hot-toast';
import { RiSearchLine, RiAddLine } from 'react-icons/ri';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

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
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Register</h1>
          <p className="page-subtitle">Comprehensive payroll records, partial payments, and balance tracking</p>
        </div>
        <button onClick={() => setIsAddSalaryOpen(true)} className="btn btn-primary">
          <RiAddLine size={18} />
          Add Salary Record
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <RiSearchLine />
          <input
            type="text"
            placeholder="Search by employee name or salary cycle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="filter-select">
          <option value="">All Salary Cycles</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>{c.cycle_name}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Salary Register Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading salary register…
        </div>
      ) : salaries.length === 0 ? (
        <div className="table-empty-state">
          <p>No salary records match your filters</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Salary Cycle</th>
                <th>Gross Salary</th>
                <th>Advance Deduction</th>
                <th>Net Salary</th>
                <th>Paid Amount</th>
                <th>Pending Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <td className="font-medium text-slate-800">{fmt(s.gross_salary)}</td>
                  <td className="text-purple-700 font-medium">{fmt(s.adjusted_advance_amount)}</td>
                  <td className="font-bold text-slate-900">{fmt(s.net_salary)}</td>
                  <td className="text-emerald-600 font-bold">{fmt(s.paid_amount)}</td>
                  <td className="text-rose-600 font-bold">{fmt(s.pending_balance)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="table-actions">
                    {parseFloat(s.pending_balance) > 0 && (
                      <button onClick={() => setSelectedSalaryForPayment(s)} className="btn-pill btn-pill-blue">
                        + Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
