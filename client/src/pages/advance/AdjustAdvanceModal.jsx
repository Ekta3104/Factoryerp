import React, { useState } from 'react';
import { advanceService } from '../../services/advanceService';
import { toast } from 'react-hot-toast';
import { RiExchangeDollarLine } from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

const AdjustAdvanceModal = ({ isOpen, onClose, advance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    allocation_type: 'Salary Deduction',
    amount: '',
    allocation_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  if (!advance) return null;

  const outstanding = parseFloat(advance.outstanding_balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid positive allocation amount');
      return;
    }
    if (amt > outstanding) {
      toast.error(`Allocation amount cannot exceed outstanding balance of ₹${outstanding.toLocaleString('en-IN')}`);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust / Allocate Advance"
      subtitle={`${advance.advance_number} — ${advance.party_name}`}
      icon={RiExchangeDollarLine}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="callout callout-warning" style={{ marginBottom: '1.25rem' }}>
          <span className="callout-label">Outstanding Balance</span>
          <span className="callout-value">₹{outstanding.toLocaleString('en-IN')}</span>
        </div>

        <div className="form-grid">
          <div className="form-grid-full">
            <label className="input-label">Adjustment Type *</label>
            <select
              value={formData.allocation_type}
              onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value })}
              className="input-field"
            >
              <option value="Salary Deduction">Salary Deduction</option>
              <option value="Vendor Invoice">Vendor / Supplier Invoice</option>
              <option value="Expense Settlement">Direct Expense Settlement</option>
            </select>
          </div>

          <div>
            <label className="input-label">Adjustment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={outstanding}
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Allocation Date *</label>
            <input
              type="date"
              value={formData.allocation_date}
              onChange={(e) => setFormData({ ...formData, allocation_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="form-grid-full">
            <label className="input-label">Reference # / Invoice / Note</label>
            <input
              type="text"
              placeholder="e.g. INV-2026-089 or Salary Aug 2026"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Adjusting…' : 'Confirm Adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustAdvanceModal;
