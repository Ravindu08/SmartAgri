import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAuthSession, clearAuthSession } from '../services/api';

const ADMIN_T = {
  en: {
    dashboard: 'Dashboard', users: 'Users', marketplace: 'Marketplace',
    farms: 'All Farms', activity: 'Activity Log', feedback: 'Feedback',
    reports: 'Reports', harvestForecast: 'Harvest Forecast', admin: 'Admin', profileSettings: 'Profile Settings',
    logout: 'Log Out', systemAdmin: 'System Administrator',
  },
  si: {
    dashboard: 'ඩැෂ්බෝඩ්', users: 'පරිශීලකයන්', marketplace: 'වෙළඳසැල',
    farms: 'සියලු ගොවිපළ', activity: 'ක්‍රියාකාරකම් ලොග', feedback: 'ප්‍රතිපෝෂණ',
    reports: 'වාර්තා', harvestForecast: 'අස්වනු පෙරනිමිය', admin: 'පරිපාලක', profileSettings: 'පැතිකඩ සැකසීම්',
    logout: 'ලොග් අවුට්', systemAdmin: 'පද්ධති පරිපාලක',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', users: 'பயனர்கள்', marketplace: 'சந்தை',
    farms: 'அனைத்து பண்ணைகள்', activity: 'செயல்பாட்டு பதிவு', feedback: 'கருத்து',
    reports: 'அறிக்கைகள்', harvestForecast: 'அறுவடை முன்னறிவிப்பு', admin: 'நிர்வாகி', profileSettings: 'சுயவிவர அமைப்புகள்',
    logout: 'வெளியேறு', systemAdmin: 'கணினி நிர்வாகி',
  },
};

export default function AdminLayout() {
  const { lang } = useApp();
  const t = ADMIN_T[lang] || ADMIN_T.en;
  const { user } = getAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = e => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  if (!user || user.role !== 'Admin') return <Navigate to="/login" replace />;

  const handleLogout = () => { clearAuthSession(); navigate('/login'); };

  const navItems = [
    { to: '/admin/dashboard',   icon: '📊', label: t.dashboard },
    { to: '/admin/users',       icon: '👥', label: t.users },
    { to: '/admin/marketplace', icon: '🏪', label: t.marketplace },
    { to: '/admin/farms',       icon: '🌾', label: t.farms },
    { to: '/admin/activity',    icon: '📋', label: t.activity },
    { to: '/admin/feedback',    icon: '💬', label: t.feedback },
    { to: '/admin/reports',           icon: '📈', label: t.reports },
    { to: '/admin/harvest-forecast',  icon: '🗓️', label: t.harvestForecast },
  ];

  const initials = user?.full_name ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'AD';
  const currentLabel = navItems.find(n => location.pathname.startsWith(n.to))?.label || t.dashboard;

  return (
    <div className="lo-shell">
      {sidebarOpen && <div className="lo-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      {/* Admin sidebar — reuses lo-sidebar CSS but with admin accent color */}
      <aside className={`lo-sidebar${sidebarOpen ? ' lo-sidebar--open' : ''}`} style={{ '--sidebar-accent': '#7c3aed' }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', background: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>SmartAgri</div>
            <div style={{ fontSize: '11px', color: 'rgba(200,170,255,0.9)', fontWeight: 600 }}>Admin Panel</div>
          </div>
        </div>

        <nav className="lo-sidebar__nav">
          {navItems.map(({ to, icon, label }) => (
            <Link key={label} to={to}
              onClick={() => setSidebarOpen(false)}
              className={`lo-sidebar__link${location.pathname.startsWith(to) ? ' active' : ''}`}
              style={location.pathname.startsWith(to) ? { '--link-active-bg': '#7c3aed22', '--link-active-color': '#7c3aed' } : {}}>
              <span className="lo-sidebar__link-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="lo-sidebar__user">
          <div className="lo-sidebar__user-avatar lo-sidebar__user-avatar--large"
            style={{ background: '#7c3aed', color: '#fff' }}>
            {user?.profile_image ? <img src={user.profile_image} alt="avatar" /> : initials}
          </div>
          <div className="lo-sidebar__user-info">
            <div className="lo-sidebar__user-name">{user?.full_name || t.admin}</div>
            <div className="lo-sidebar__user-role" style={{ color: '#7c3aed' }}>{t.admin}</div>
          </div>
        </div>
      </aside>

      <div className="lo-main">
        <header className="lo-topbar">
          <button className="lo-hamburger" type="button" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">☰</button>
          <div className="lo-topbar__title">{currentLabel}</div>
          <div className="lo-topbar__right">
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button className="lo-topbar__profile-btn" type="button"
                onClick={() => setProfileOpen(o => !o)} aria-label="Profile">
                <div className="lo-topbar__profile-avatar"
                  style={{ background: '#7c3aed', color: '#fff' }}>
                  {user?.profile_image ? <img src={user.profile_image} alt="avatar" /> : initials}
                </div>
                <div className="lo-topbar__profile-info">
                  <span className="lo-topbar__profile-name">{user?.full_name?.split(' ')[0] || t.admin}</span>
                  <span className="lo-topbar__profile-role" style={{ color: '#7c3aed' }}>{t.admin}</span>
                </div>
                <span className="lo-topbar__profile-chevron">{profileOpen ? '▲' : '▼'}</span>
              </button>
              {profileOpen && (
                <div className="lo-topbar__profile-panel">
                  <div className="lo-topbar__profile-panel-header">
                    <div className="lo-topbar__profile-panel-avatar" style={{ background: '#7c3aed', color: '#fff' }}>
                      {initials}
                    </div>
                    <div>
                      <div className="lo-topbar__profile-panel-name">{user?.full_name || t.admin}</div>
                      <div className="lo-topbar__profile-panel-role" style={{ color: '#7c3aed' }}>{t.systemAdmin}</div>
                    </div>
                  </div>
                  <div className="lo-topbar__profile-panel-divider" />
                  <button className="lo-topbar__profile-panel-item lo-topbar__profile-panel-item--danger"
                    type="button" onClick={handleLogout}>🚪 {t.logout}</button>
                </div>
              )}
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
