import { NavLink } from 'react-router-dom';
import { 
  RiDashboardLine, 
  RiTruckLine, 
  RiSettings4Line, 
  RiSendPlaneLine, 
  RiMoneyDollarCircleLine, 
  RiFileList3Line,
  RiBankCardLine,
  RiHandHeartLine,
  RiUser3Line,
  RiShieldCheckLine
} from 'react-icons/ri';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <RiDashboardLine className="sidebar-link-icon" /> },
  { path: '/salaries', label: 'Salary Module', icon: <RiBankCardLine className="sidebar-link-icon" /> },
  { path: '/advances', label: 'Universal Advance', icon: <RiHandHeartLine className="sidebar-link-icon" /> },
  { path: '/recipients', label: 'Recipient Profiles', icon: <RiUser3Line className="sidebar-link-icon" /> },
  { path: '/financial-audit', label: 'Financial Audit', icon: <RiShieldCheckLine className="sidebar-link-icon" /> },
  { path: '/vehicle-inwards', label: 'Vehicle Inwards', icon: <RiTruckLine className="sidebar-link-icon" /> },
  { path: '/production', label: 'Production', icon: <RiSettings4Line className="sidebar-link-icon" /> },
  { path: '/dispatches', label: 'Dispatches', icon: <RiSendPlaneLine className="sidebar-link-icon" /> },
  { path: '/expenses', label: 'Expenses', icon: <RiMoneyDollarCircleLine className="sidebar-link-icon" /> },
  { path: '/reports', label: 'Reports', icon: <RiFileList3Line className="sidebar-link-icon" /> },
];

const Sidebar = () => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        FactoryERP
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
          v1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
