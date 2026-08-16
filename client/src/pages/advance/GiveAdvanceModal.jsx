import React, { useState, useEffect } from 'react';
import { partyService } from '../../services/partyService';
import { advanceService } from '../../services/advanceService';
import { toast } from 'react-hot-toast';
import { RiHandHeartLine } from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Give Universal Advance" icon={RiHandHeartLine} size="md">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-grid-full">
            <label className="input-label">Recipient Party *</label>
            <select
              value={formData.party_id}
              onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">-- Select Recipient (Employee, Worker, Contractor, Vendor, Driver) --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.party_type}) {p.phone ? `- ${p.phone}` : ''}</option>
              ))}
            </select>
            {parties.length === 0 && (
              <p className="input-error-msg" style={{ color: 'var(--color-muted)' }}>
                No recipients found — create one under Recipient Profiles first.
              </p>
            )}
          </div>

          <div>
            <label className="input-label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="20000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Disbursement Date *</label>
            <input
              type="date"
              value={formData.disbursement_date}
              onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="input-field"
            >
              <option value="">-- Select Purpose Category --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="input-label">Reference / UTR Number</label>
            <input
              type="text"
              placeholder="UTR9876543210"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Project / Work Order Name</label>
            <input
              type="text"
              placeholder="Phase 2 Maintenance Work"
              value={formData.project_work_name}
              onChange={(e) => setFormData({ ...formData, project_work_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="form-grid-full">
            <label className="input-label">Reason / Purpose *</label>
            <input
              type="text"
              placeholder="Advance for plant machinery repair"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Disbursing…' : 'Disburse Advance'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GiveAdvanceModal;
