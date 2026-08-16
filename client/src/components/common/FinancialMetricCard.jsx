import React from 'react';
import '../ui/ui.css';

const FinancialMetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-text">
        <p className="metric-card-title">{title}</p>
        <h3 className="metric-card-value">{value}</h3>
        {subtitle && <p className="metric-card-subtitle">{subtitle}</p>}
        {trend && <div className="metric-card-trend">{trend}</div>}
      </div>
      {Icon && (
        <div className={`metric-card-icon metric-card-icon-${color}`}>
          <Icon />
        </div>
      )}
    </div>
  );
};

export default FinancialMetricCard;
