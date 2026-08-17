import React from 'react';
import '../ui/ui.css';

const STATUS_VARIANTS = {
  Active: 'success',
  OPEN: 'success',
  Paid: 'success',
  FULLY_PAID: 'success',
  'Partially Adjusted': 'warning',
  'Partially Paid': 'warning',
  PARTIALLY_PAID: 'warning',
  Processing: 'warning',
  'Fully Adjusted': 'neutral',
  Closed: 'neutral',
  Unpaid: 'danger',
  UNPAID: 'danger',
  Reversed: 'cancelled',
  Cancelled: 'cancelled',
};

const StatusBadge = ({ status }) => {
  const variant = STATUS_VARIANTS[status] || 'info';

  return (
    <span className={`status-badge status-badge-${variant}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
