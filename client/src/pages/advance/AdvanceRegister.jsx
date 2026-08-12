import React, { useState, useEffect } from 'react';
import { advanceService } from '../../services/advanceService';
import StatusBadge from '../../components/common/StatusBadge';
import GiveAdvanceModal from './GiveAdvanceModal';
import AdjustAdvanceModal from './AdjustAdvanceModal';
import RecordRefundModal from './RecordRefundModal';
import { toast } from 'react-hot-toast';
import { 
  RiSearchLine, 
  RiAddLine, 
  RiFileExcelLine,
  RiRefund2Line,
  RiExchangeDollarLine,
  RiArrowGoBackLine
} from 'react-icons/ri';

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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Universal Advance Register</h1>
          <p className="text-sm text-slate-500">Instant lookup of who received advances, how much, why, adjusted, and outstanding balance</p>
        </div>
        <button
          onClick={() => setIsGiveAdvanceOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
        >
          <RiAddLine className="w-5 h-5" />
          + Give Advance
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <RiSearchLine className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search advance #, recipient name, reason, or reference UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:w-48 px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Partially Adjusted">Partially Adjusted</option>
          <option value="Fully Adjusted">Fully Adjusted</option>
          <option value="Reversed">Reversed</option>
        </select>
      </div>

      {/* Advance Register Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-3">Advance #</th>
                <th className="py-3 px-3">Disbursed Date</th>
                <th className="py-3 px-3">Recipient Party</th>
                <th className="py-3 px-3">Purpose / Reason</th>
                <th className="py-3 px-3">Disbursed Amount</th>
                <th className="py-3 px-3">Adjusted</th>
                <th className="py-3 px-3">Refunded</th>
                <th className="py-3 px-3">Outstanding Balance</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-slate-900">{a.advance_number}</td>
                  <td className="py-3.5 px-3 text-slate-500">{new Date(a.disbursement_date).toLocaleDateString()}</td>
                  <td className="py-3.5 px-3 font-medium text-slate-900">
                    {a.party_name}
                    <span className="block text-[11px] font-normal text-slate-400">{a.party_type}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 max-w-xs truncate">{a.reason}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">₹{parseFloat(a.amount).toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-amber-600 font-medium">₹{parseFloat(a.adjusted_amount).toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-purple-600 font-medium">₹{parseFloat(a.refunded_amount).toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-rose-600 font-bold">₹{parseFloat(a.outstanding_balance).toLocaleString()}</td>
                  <td className="py-3.5 px-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3.5 px-3 text-right space-x-1">
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
                    {a.status !== 'Reversed' && (
                      <button
                        onClick={() => handleReverse(a)}
                        className="px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Reverse advance"
                      >
                        <RiArrowGoBackLine className="w-3.5 h-3.5 inline" />
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
      <GiveAdvanceModal
        isOpen={isGiveAdvanceOpen}
        onClose={() => setIsGiveAdvanceOpen(false)}
        onSuccess={fetchAdvances}
      />

      <AdjustAdvanceModal
        isOpen={!!selectedAdvanceForAdjust}
        onClose={() => setSelectedAdvanceForAdjust(null)}
        advance={selectedAdvanceForAdjust}
        onSuccess={fetchAdvances}
      />

      <RecordRefundModal
        isOpen={!!selectedAdvanceForRefund}
        onClose={() => setSelectedAdvanceForRefund(null)}
        advance={selectedAdvanceForRefund}
        onSuccess={fetchAdvances}
      />
    </div>
  );
};

export default AdvanceRegister;
