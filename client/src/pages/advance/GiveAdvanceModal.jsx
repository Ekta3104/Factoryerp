import React, { useState, useEffect } from 'react';
import { partyService } from '../../services/partyService';
import { advanceService } from '../../services/advanceService';
import { toast } from 'react-hot-toast';
import { RiCloseLine, RiHandHeartLine } from 'react-icons/ri';

const GiveAdvanceModal = ({ isOpen, onClose, onSuccess }) => {
  const [parties, setParties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    party_id: '',
    category_id: '',
    amount: '',
    disbursement_date: new Date().toISOString().split('T')[0],
    reason: '',
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    project_work_name: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const partiesData = await partyService.getParties({ limit: 200 });
      const catsData = await advanceService.getCategories();
      setParties(partiesData.data?.parties || []);
      setCategories(catsData.data || []);
    } catch (err) {
      toast.error('Failed to load recipient or category list');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party_id || !formData.amount || !formData.reason) {
      toast.error('Recipient, Amount, and Reason are required');
      return;
    }

    setLoading(true);
    try {
      await advanceService.disburseAdvance(formData);
      toast.success('Advance disbursed successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disburse advance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <RiHandHeartLine className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">+ Give Universal Advance</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60">
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Recipient Party *
            </label>
            <select
              value={formData.party_id}
              onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Select Recipient (Employee, Worker, Contractor, Vendor, Driver) --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.party_type}) {p.phone ? `- ${p.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="20000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Disbursement Date *
              </label>
              <input
                type="date"
                value={formData.disbursement_date}
                onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Select Purpose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Payment Method *
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Reference / UTR Number
              </label>
              <input
                type="text"
                placeholder="UTR9876543210"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Project / Work Order Name
              </label>
              <input
                type="text"
                placeholder="Phase 2 Maintenance Work"
                value={formData.project_work_name}
                onChange={(e) => setFormData({ ...formData, project_work_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Reason / Purpose *
            </label>
            <input
              type="text"
              placeholder="Advance for plant machinery repair"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
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
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Disbursing...' : 'Disburse Advance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GiveAdvanceModal;
