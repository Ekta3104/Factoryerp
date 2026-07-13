import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiLogoutBoxRLine } from 'react-icons/ri';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Basic breadcrumb generation based on path
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    // Capitalize first letter and replace hyphens with spaces
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="app-header">
      <h2 className="header-title">{getPageTitle()}</h2>
      
      <div className="header-actions">
        <div className="user-profile">
          <div className="user-info" style={{ textAlign: 'right' }}>
            <span className="user-name">{user?.username || 'User'}</span>
            <span className="user-role">{user?.role || 'Guest'}</span>
          </div>
          <div className="user-avatar">
            {getInitials(user?.username)}
          </div>
        </div>
        
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>
        
        <button className="btn-logout" onClick={handleLogout} title="Sign Out">
          <RiLogoutBoxRLine size={20} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
