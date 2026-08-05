import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine,
  RiTruckLine,
  RiSettings4Line,
  RiSendPlaneLine,
  RiMoneyDollarCircleLine,
  RiFileList3Line,
  RiCloseLine,
} from 'react-icons/ri';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <RiDashboardLine className="sidebar-link-icon" /> },
  { path: '/vehicle-inwards', label: 'Vehicle Inwards', icon: <RiTruckLine className="sidebar-link-icon" /> },
  { path: '/production', label: 'Production', icon: <RiSettings4Line className="sidebar-link-icon" /> },
  { path: '/dispatches', label: 'Dispatches', icon: <RiSendPlaneLine className="sidebar-link-icon" /> },
  { path: '/expenses', label: 'Expenses', icon: <RiMoneyDollarCircleLine className="sidebar-link-icon" /> },
  { path: '/reports', label: 'Reports', icon: <RiFileList3Line className="sidebar-link-icon" /> },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  return (
    <>
      {/* Mobile backdrop — click to close the drawer */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-header-icon" aria-hidden="true">
            <RiSettings4Line />
          </span>
          FactoryERP
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-version">v1.0.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
