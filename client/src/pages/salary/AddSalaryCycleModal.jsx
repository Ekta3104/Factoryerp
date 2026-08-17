import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salaryService';
import { toast } from 'react-hot-toast';
import { RiCalendarLine } from 'react-icons/ri';
import Modal from '../../components/ui/Modal';

const pad = (n) => String(n).padStart(2, '0');
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtLabel = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const deriveCycle = (cycle_type, refDateStr) => {
  const ref = refDateStr ? new Date(refDateStr) : new Date();

  if (cycle_type === 'Daily') {
    return {
      start_date: toISODate(ref),
      end_date: toISODate(ref),
      cycle_name: `Daily - ${fmtLabel(ref)}`,
    };
  }

  if (cycle_type === 'Weekly') {
    const day = ref.getDay(); // 0=Sun
    const diffToMonday = (day + 6) % 7;
    const start = new Date(ref);
    start.setDate(ref.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start_date: toISODate(start),
      end_date: toISODate(end),
      cycle_name: `Week of ${fmtLabel(start)} - ${fmtLabel(end)}`,
    };
  }

  // Monthly
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return {
    start_date: toISODate(start),
    end_date: toISODate(end),
    cycle_name: `${monthNames[ref.getMonth()]} ${ref.getFullYear()}`,
  };
};

const AddSalaryCycleModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [cycleType, setCycleType] = useState('Monthly');
  const [refDate, setRefDate] = useState(toISODate(new Date()));
  const [formData, setFormData] = useState(() => ({ cycle_type: 'Monthly', ...deriveCycle('Monthly', null) }));
  const [nameEdited, setNameEdited] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCycleType('Monthly');
    setRefDate(toISODate(new Date()));
    setNameEdited(false);
    setFormData({ cycle_type: 'Monthly', ...deriveCycle('Monthly', null) });
  }, [isOpen]);

  const applyType = (type, ref) => {
    setCycleType(type);
    const derived = deriveCycle(type, ref);
    setFormData((prev) => ({
      ...prev,
      cycle_type: type,
      start_date: derived.start_date,
      end_date: derived.end_date,
      cycle_name: nameEdited ? prev.cycle_name : derived.cycle_name,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cycle_name || !formData.start_date || !formData.end_date) {
      toast.error('Cycle Name, Start Date, and End Date are required');
      return;
    }
    if (formData.end_date < formData.start_date) {
      toast.error('End Date cannot be before Start Date');
      return;
    }

    setLoading(true);
    try {
      await salaryService.createSalaryCycle(formData);
      toast.success('Salary cycle created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create salary cycle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Salary Cycle" icon={RiCalendarLine} size="md">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-grid-full">
            <label className="input-label">Cycle Type *</label>
            <select
              value={cycleType}
              onChange={(e) => applyType(e.target.value, refDate)}
              className="input-field"
              required
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="form-grid-full">
            <label className="input-label">Reference Date</label>
            <input
              type="date"
              value={refDate}
              onChange={(e) => {
                setRefDate(e.target.value);
                applyType(cycleType, e.target.value);
              }}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Start Date *</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label">End Date *</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="form-grid-full">
            <label className="input-label">Cycle Name *</label>
            <input
              type="text"
              placeholder="e.g. August 2026"
              value={formData.cycle_name}
              onChange={(e) => {
                setNameEdited(true);
                setFormData({ ...formData, cycle_name: e.target.value });
              }}
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
            {loading ? 'Creating…' : 'Create Cycle'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSalaryCycleModal;
