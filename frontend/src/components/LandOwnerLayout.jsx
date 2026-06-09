import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { getAuthSession } from '../services/api';

export default function LandOwnerLayout() {
  const navigate = useNavigate();
  const { user } = getAuthSession();
  const location = useLocation();

  useEffect(() => {
    if (!user || user.role !== 'Land Owner') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  const navItems = [
    { to: '/landowner/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/landowner/farms',      icon: '🌾', label: 'My Farms' },
    { to: '/landowner/crops',      icon: '🌱', label: 'My Crops' },
    { to: '/crop-recommendation',  icon: '🤖', label: 'Advisories' },
    { to: '/marketplace',          icon: '🏪', label: 'Marketplace' },
    { to: '/about',                icon: '⚙️', label: 'Settings' },
    { to: '/about',                icon: '❓', label: 'Help & Support' },
  ];

  return (
    <div className="lo-shell">
      <Navbar />
      <aside className="lo-sidebar">
        <div className="lo-sidebar__brand">
          <span>🌿</span>
          <span><strong>Smart</strong>Agri</span>
        </div>
        <nav className="lo-sidebar__nav">
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={label}
              to={to}
              className={`lo-sidebar__link${location.pathname === to || (location.pathname.startsWith(to + '/') && to !== '/landowner/dashboard') ? ' active' : ''}`}
            >
              <span className="lo-sidebar__link-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="lo-sidebar__user">
          <div className="lo-sidebar__user-avatar">{user?.full_name?.charAt(0) || 'L'}</div>
          <div>
            <div className="lo-sidebar__user-name">{user?.full_name || 'Land Owner'}</div>
            <div className="lo-sidebar__user-id">ID: LO-{String(user?.id || '000').padStart(6, '0')}</div>
          </div>
        </div>
      </aside>
      <div className="lo-main">
        <header className="lo-topbar">
          <div className="lo-topbar__title">
            {navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard'}
          </div>
          <div className="lo-topbar__right">
            <span className="lo-topbar__badge">🔔</span>
            <div className="lo-topbar__user">
              <div className="lo-topbar__avatar">{user?.full_name?.charAt(0) || 'L'}</div>
              <span>Land Owner</span>
              <span className="lo-topbar__id">LO-{String(user?.id || '000').padStart(6, '0')}</span>
            </div>
          </div>
        </header>
        <main className="lo-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
