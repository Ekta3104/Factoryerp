import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salaryService';
import { partyService } from '../../services/partyService';
import { toast } from 'react-hot-toast';
import { RiCloseLine, RiMoneyDollarCircleLine } from 'react-icons/ri';

const AddSalaryModal = ({ isOpen, onClose, onSuccess, defaultCycleId }) => {
  const [cycles, setCycles] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    salary_cycle_id: defaultCycleId || '',
    party_id: '',
    gross_salary: '',
    bonus_allowance: '0',
    advance_deduction: '0',
    other_deductions: '0',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const cycleData = await salaryService.getSalaryCycles();
      const partyData = await partyService.getParties({ party_type: 'Employee', limit: 200 });
      setCycles(cycleData.data || []);
      setParties(partyData.data?.parties || []);
      if (!formData.salary_cycle_id && cycleData.data?.length > 0) {
        setFormData((prev) => ({ ...prev, salary_cycle_id: cycleData.data[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load salary cycles or employees');
    }
  };

  const gross = parseFloat(formData.gross_salary || 0);
  const bonus = parseFloat(formData.bonus_allowance || 0);
  const advDed = parseFloat(formData.advance_deduction || 0);
  const otherDed = parseFloat(formData.other_deductions || 0);
  const netPayable = Math.max(0, gross + bonus - advDed - otherDed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.salary_cycle_id || !formData.party_id || !formData.gross_salary) {
      toast.error('Salary Cycle, Employee, and Gross Salary are required');
      return;
    }

    setLoading(true);
    try {
      await salaryService.addSalaryRecord(formData);
      toast.success('Salary record added successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add salary record');
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
              <RiMoneyDollarCircleLine className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">+ Manual Salary Entry</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60">
            <RiCloseLine className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Salary Cycle *
              </label>
              <select
                value={formData.salary_cycle_id}
                onChange={(e) => setFormData({ ...formData, salary_cycle_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Select Cycle --</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cycle_name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Employee / Worker *
              </label>
              <select
                value={formData.party_id}
                onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Select Employee --</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.party_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Base Gross Salary (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="50000"
                value={formData.gross_salary}
                onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Bonus / Allowances (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={formData.bonus_allowance}
                onChange={(e) => setFormData({ ...formData, bonus_allowance: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Advance Deduction (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={formData.advance_deduction}
                onChange={(e) => setFormData({ ...formData, advance_deduction: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Other Deductions / Tax (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={formData.other_deductions}
                onChange={(e) => setFormData({ ...formData, other_deductions: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-slate-800">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700">Calculated Net Payable</p>
              <p className="text-xs text-slate-500">Gross + Bonus - Deductions</p>
            </div>
            <span className="text-2xl font-black text-blue-900">₹{netPayable.toLocaleString()}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Approved by Admin"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              {loading ? 'Adding...' : 'Save Salary Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSalaryModal;
