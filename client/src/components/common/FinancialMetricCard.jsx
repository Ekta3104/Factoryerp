import React from 'react';

const FinancialMetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const iconBgStyles = {
    blue: 'bg-blue-600 text-white',
    green: 'bg-emerald-600 text-white',
    amber: 'bg-amber-600 text-white',
    purple: 'bg-purple-600 text-white',
    rose: 'bg-rose-600 text-white',
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-200 bg-white hover:shadow-md overflow-hidden ${colorStyles[color] || colorStyles.blue}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 break-words">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 ${iconBgStyles[color] || iconBgStyles.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default FinancialMetricCard;
