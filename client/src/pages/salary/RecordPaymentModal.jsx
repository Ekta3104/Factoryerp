import React, { useState } from 'react';
import { salaryService } from '../../services/salaryService';
import { toast } from 'react-hot-toast';
import { RiBankCardLine } from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

const RecordPaymentModal = ({ isOpen, onClose, salary, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    reference_number: '',
    notes: '',
  });

  if (!salary) return null;

  const pending = parseFloat(salary.pending_balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid positive payment amount');
      return;
    }
    if (amt > pending) {
      toast.error(`Payment amount cannot exceed pending salary balance of ₹${pending.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    try {
      await salaryService.recordSalaryPayment({
        ...formData,
        employee_salary_id: salary.id,
      });
      toast.success('Salary payment recorded successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Salary Payment"
      subtitle={`${salary.party_name} — ${salary.cycle_name}`}
      icon={RiBankCardLine}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="callout callout-info" style={{ marginBottom: '1.25rem' }}>
          <span className="callout-label">Pending Balance</span>
          <span className="callout-value">₹{pending.toLocaleString('en-IN')}</span>
        </div>

        <div className="form-grid">
          <div>
            <label className="input-label">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={pending}
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Payment Date *</label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
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
              <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="input-label">Reference / UTR Number</label>
            <input
              type="text"
              placeholder="UTR or Cheque number"
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
            {loading ? 'Recording…' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
