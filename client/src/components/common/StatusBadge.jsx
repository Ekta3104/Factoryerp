import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = (statusStr) => {
    switch (statusStr) {
      case 'Active':
      case 'OPEN':
      case 'Paid':
      case 'FULLY_PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Partially Adjusted':
      case 'PARTIALLY_PAID':
      case 'Processing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Fully Adjusted':
      case 'Closed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Unpaid':
      case 'UNPAID':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Reversed':
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300 line-through';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
