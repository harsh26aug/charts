import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header = () => {
  const { displayName, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-brand">
          <img src="/images/logo.png" alt="Logo" className="brand-logo" />
        </div>
        <div className="header-welcome">
          <span className="welcome-text">Welcome, {displayName}</span>
          {isAdmin && <span className="badge badge-admin">Admin</span>}
        </div>
      </div>
      <div className="header-actions">
        <button className="btn-logout" onClick={onLogout} type="button">
          Logout
        </button>
      </div>
    </header>
  );
};
