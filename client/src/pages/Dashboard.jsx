import { useState, useEffect } from 'react';
import { 
  RiStockLine, 
  RiTruckLine, 
  RiSettings4Line, 
  RiSendPlaneLine, 
  RiMoneyDollarCircleLine,
  RiAlertLine
} from 'react-icons/ri';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { fetchDashboardData } from '../services/dashboardService';
import StatCard from '../components/dashboard/StatCard';
import '../components/dashboard/Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'var(--color-error)', padding: '2rem', textAlign: 'center' }}>
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, trends } = data;

  // Format numbers nicely
  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
      </div>

      <div className="dashboard-grid">
        <StatCard 
          title="Raw Material Stock"
          value={formatNumber(kpis.current_raw_material_stock)}
          unit="kg"
          icon={<RiStockLine />}
        />
        <StatCard 
          title="Ready Material Stock"
          value={formatNumber(kpis.current_ready_material_stock)}
          unit="kg"
          icon={<RiStockLine />}
        />
        <StatCard 
          title="Today's Production"
          value={formatNumber(kpis.today_production_quantity)}
          unit="kg"
          icon={<RiSettings4Line />}
        />
        <StatCard 
          title="Today's Dispatches"
          value={formatNumber(kpis.today_dispatch_quantity)}
          unit="kg"
          icon={<RiSendPlaneLine />}
        />
        <StatCard 
          title="Today's Inwards"
          value={formatNumber(kpis.today_raw_material_received)}
          unit="kg"
          icon={<RiTruckLine />}
          trend={`${kpis.today_vehicle_inward_count} vehicles`}
        />
        <StatCard 
          title="Today's Expenses"
          value={`₹${formatNumber(kpis.today_total_expenses)}`}
          icon={<RiMoneyDollarCircleLine />}
          trend={`₹${formatNumber(kpis.current_month_total_expenses)} this month`}
        />
      </div>

      <div className="dashboard-bottom-grid">
        {/* Charts Panel */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">Production & Dispatch (Last 7 Days)</h2>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart
                data={trends.last_7_days_production.map((p, i) => ({
                  date: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                  Production: parseFloat(p.total_produced),
                  Dispatch: parseFloat(trends.last_7_days_dispatch[i]?.total_dispatched || 0)
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Production" fill="var(--color-brand-600)" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Dispatch" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RiAlertLine color="var(--color-warning)" />
              Low Stock Alerts
            </h2>
          </div>
          
          {kpis.low_stock_alerts && kpis.low_stock_alerts.length > 0 ? (
            <div className="low-stock-list">
              {kpis.low_stock_alerts.map(item => (
                <div key={item.raw_material_id} className="low-stock-item">
                  <div className="low-stock-info">
                    <span className="low-stock-name">{item.raw_material_name}</span>
                    <span className="low-stock-numbers">
                      Current: {item.closing_stock} kg (Reorder: {item.reorder_level} kg)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-muted)' }}>
              <RiStockLine size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
              <p>Stock levels are healthy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
