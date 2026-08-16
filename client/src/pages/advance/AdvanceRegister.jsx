import React, { useState, useEffect } from 'react';
import { advanceService } from '../../services/advanceService';
import StatusBadge from '../../components/common/StatusBadge';
import GiveAdvanceModal from './GiveAdvanceModal';
import AdjustAdvanceModal from './AdjustAdvanceModal';
import RecordRefundModal from './RecordRefundModal';
import { toast } from 'react-hot-toast';
import { RiSearchLine, RiAddLine, RiArrowGoBackLine } from 'react-icons/ri';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

const AdvanceRegister = () => {
  const [advances, setAdvances] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [isGiveAdvanceOpen, setIsGiveAdvanceOpen] = useState(false);
  const [selectedAdvanceForAdjust, setSelectedAdvanceForAdjust] = useState(null);
  const [selectedAdvanceForRefund, setSelectedAdvanceForRefund] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAdvances();
  }, [search, statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await advanceService.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const res = await advanceService.getAdvances({
        search,
        status: statusFilter,
        category_id: categoryFilter,
        limit: 100,
      });
      setAdvances(res.data?.advances || []);
    } catch (err) {
      toast.error('Failed to load advance register');
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (adv) => {
    const reason = window.prompt(`Enter reason for reversing advance ${adv.advance_number}:`);
    if (!reason) return;
    try {
      await advanceService.reverseAdvance(adv.id, reason);
      toast.success('Advance reversed successfully');
      fetchAdvances();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reverse advance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Universal Advance Register</h1>
          <p className="page-subtitle">Instant lookup of who received advances, how much, why, adjusted, and outstanding balance</p>
        </div>
        <button onClick={() => setIsGiveAdvanceOpen(true)} className="btn btn-primary">
          <RiAddLine size={18} />
          Give Advance
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <RiSearchLine />
          <input
            type="text"
            placeholder="Search advance #, recipient name, reason, or reference UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Partially Adjusted">Partially Adjusted</option>
          <option value="Fully Adjusted">Fully Adjusted</option>
          <option value="Reversed">Reversed</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading advance register…
        </div>
      ) : advances.length === 0 ? (
        <div className="table-empty-state">
          <p>No advances match your filters</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Advance #</th>
                <th>Disbursed Date</th>
                <th>Recipient Party</th>
                <th>Purpose / Reason</th>
                <th>Disbursed Amount</th>
                <th>Adjusted</th>
                <th>Refunded</th>
                <th>Outstanding Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <td className="max-w-xs truncate">{a.reason}</td>
                  <td className="font-bold text-slate-900">{fmt(a.amount)}</td>
                  <td className="text-amber-600 font-medium">{fmt(a.adjusted_amount)}</td>
                  <td className="text-purple-600 font-medium">{fmt(a.refunded_amount)}</td>
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
                    {a.status !== 'Reversed' && (
                      <button
                        onClick={() => handleReverse(a)}
                        className="icon-action-btn icon-action-btn--danger"
                        title="Reverse advance"
                        aria-label="Reverse advance"
                      >
                        <RiArrowGoBackLine size={16} />
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
      <GiveAdvanceModal isOpen={isGiveAdvanceOpen} onClose={() => setIsGiveAdvanceOpen(false)} onSuccess={fetchAdvances} />
      <AdjustAdvanceModal isOpen={!!selectedAdvanceForAdjust} onClose={() => setSelectedAdvanceForAdjust(null)} advance={selectedAdvanceForAdjust} onSuccess={fetchAdvances} />
      <RecordRefundModal isOpen={!!selectedAdvanceForRefund} onClose={() => setSelectedAdvanceForRefund(null)} advance={selectedAdvanceForRefund} onSuccess={fetchAdvances} />
    </div>
  );
};

export default AdvanceRegister;
