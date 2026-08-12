import React, { useState } from 'react';
import { advanceService } from '../../services/advanceService';
import { toast } from 'react-hot-toast';
import { RiCloseLine, RiExchangeDollarLine } from 'react-icons/ri';

const AdjustAdvanceModal = ({ isOpen, onClose, advance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    allocation_type: 'Salary Deduction',
    amount: '',
    allocation_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  if (!isOpen || !advance) return null;

  const outstanding = parseFloat(advance.outstanding_balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid positive allocation amount');
      return;
    }
    if (amt > outstanding) {
      toast.error(`Allocation amount cannot exceed outstanding balance of ₹${outstanding}`);
      return;
    }

    setLoading(true);
    try {
      await advanceService.allocateAdvance({
        ...formData,
        advance_id: advance.id,
      });
      toast.success('Advance allocated / adjusted successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust advance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <RiExchangeDollarLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Adjust / Allocate Advance</h3>
              <p className="text-xs text-slate-500">{advance.advance_number} — {advance.party_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60">
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-sm flex justify-between items-center">
            <span>Outstanding Balance:</span>
            <span className="font-bold text-base">₹{outstanding.toLocaleString()}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Adjustment Type *
            </label>
            <select
              value={formData.allocation_type}
              onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Salary Deduction">Salary Deduction</option>
              <option value="Vendor Invoice">Vendor / Supplier Invoice</option>
              <option value="Expense Settlement">Direct Expense Settlement</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Adjustment Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={outstanding}
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Allocation Date *
              </label>
              <input
                type="date"
                value={formData.allocation_date}
                onChange={(e) => setFormData({ ...formData, allocation_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Reference # / Invoice / Note
            </label>
            <input
              type="text"
              placeholder="e.g. INV-2026-089 or Salary Aug 2026"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Adjusting...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustAdvanceModal;
