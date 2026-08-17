import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salaryService';
import { partyService } from '../../services/partyService';
import { toast } from 'react-hot-toast';
import { RiMoneyDollarCircleLine } from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Salary Entry" icon={RiMoneyDollarCircleLine} size="md">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label className="input-label">Salary Cycle *</label>
            <select
              value={formData.salary_cycle_id}
              onChange={(e) => setFormData({ ...formData, salary_cycle_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">-- Select Cycle --</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.cycle_name} · {c.cycle_type} ({c.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Employee / Worker *</label>
            <select
              value={formData.party_id}
              onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">-- Select Employee --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.party_type})</option>
              ))}
            </select>
            {parties.length === 0 && (
              <p className="input-error-msg" style={{ color: 'var(--color-muted)' }}>
                No employee recipients found — create one under Recipient Profiles first.
              </p>
            )}
          </div>

          <div>
            <label className="input-label">Base Gross Salary (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="50000"
              value={formData.gross_salary}
              onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Bonus / Allowances (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={formData.bonus_allowance}
              onChange={(e) => setFormData({ ...formData, bonus_allowance: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Advance Deduction (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={formData.advance_deduction}
              onChange={(e) => setFormData({ ...formData, advance_deduction: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Other Deductions / Tax (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={formData.other_deductions}
              onChange={(e) => setFormData({ ...formData, other_deductions: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="form-grid-full">
            <div className="callout callout-info">
              <div>
                <div className="callout-label">Calculated Net Payable</div>
                <div className="callout-label" style={{ fontSize: '0.7rem' }}>Gross + Bonus − Deductions</div>
              </div>
              <span className="callout-value">₹{netPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="form-grid-full">
            <label className="input-label">Notes</label>
            <input
              type="text"
              placeholder="e.g. Approved by Admin"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Adding…' : 'Save Salary Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSalaryModal;
