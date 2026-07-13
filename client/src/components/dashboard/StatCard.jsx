import './Dashboard.css';

const StatCard = ({ title, value, icon, unit, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-icon">
          {icon}
        </div>
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">
          {value}
          {unit && <span className="stat-card-unit">{unit}</span>}
        </div>
        {trend && (
          <div className="stat-card-trend">
            {trend}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
