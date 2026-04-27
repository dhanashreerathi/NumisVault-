import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationBell from '../shared/NotificationBell';

export default function Navbar() {
  const navigate  = useNavigate();
  const { user, role, signOut } = useAuth();
  const { showToast } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authOpen, setAuthOpen]         = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleProfileClick = () => {
    if (user) {
      setDropdownOpen(prev => !prev);
    } else {
      // Fire custom event to open auth modal
      window.dispatchEvent(new CustomEvent('nv:openAuth', { detail: { tab: 'login' } }));
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/');
  };

  const goTo = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const btnLabel = user
    ? role === 'admin' ? 'Admin Controls ▼' : 'My Profile ▼'
    : 'Member Login';

  return (
    <nav className="navbar">
      <div className="nav-title" onClick={() => navigate('/')}>NumisVault</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && <NotificationBell />}

        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="profile-btn"
            style={user ? { background: 'var(--glass-bg)' } : {}}
            onClick={handleProfileClick}
          >
            {btnLabel}
          </button>

          <div className={`profile-dropdown${dropdownOpen ? ' active' : ''}`}>
            {role === 'admin' && (
              <div
                className="profile-dropdown-item"
                onClick={() => goTo('/admin')}
                style={{ borderBottom: '2px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
              >
                🛡️ Admin Dashboard
              </div>
            )}
            <div className="profile-dropdown-item" onClick={() => goTo('/profile')}>👤 Personal Details</div>
            <div className="profile-dropdown-item" onClick={() => goTo('/wishlist')}>❤️ My Wishlist</div>
            <div className="profile-dropdown-item" onClick={() => goTo('/settings')}>⚙️ Settings</div>
            <div className="profile-dropdown-item" style={{ color: '#ef4444' }} onClick={handleLogout}>
              🚪 Log Out
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
