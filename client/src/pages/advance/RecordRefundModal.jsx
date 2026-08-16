import React, { useState } from 'react';
import { advanceService } from '../../services/advanceService';
import { toast } from 'react-hot-toast';
import { RiRefund2Line } from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

const RecordRefundModal = ({ isOpen, onClose, advance, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    refund_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    reference_number: '',
    notes: '',
  });

  if (!advance) return null;

  const outstanding = parseFloat(advance.outstanding_balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid positive refund amount');
      return;
    }
    if (amt > outstanding) {
      toast.error(`Refund amount cannot exceed outstanding balance of ₹${outstanding.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    try {
      await advanceService.recordRefund({
        ...formData,
        advance_id: advance.id,
      });
      toast.success('Direct refund recorded successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Cash/Bank Refund"
      subtitle={`${advance.advance_number} — ${advance.party_name}`}
      icon={RiRefund2Line}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="callout callout-success" style={{ marginBottom: '1.25rem' }}>
          <span className="callout-label">Outstanding Advance Balance</span>
          <span className="callout-value">₹{outstanding.toLocaleString('en-IN')}</span>
        </div>

        <div className="form-grid">
          <div>
            <label className="input-label">Refund Amount (₹) *</label>
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
            <label className="input-label">Refund Date *</label>
            <input
              type="date"
              value={formData.refund_date}
              onChange={(e) => setFormData({ ...formData, refund_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Payment Method *</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="input-field"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer / UPI</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="input-label">Reference / Receipt #</label>
            <input
              type="text"
              placeholder="Receipt or UTR number"
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
            {loading ? 'Recording…' : 'Confirm Refund'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordRefundModal;
