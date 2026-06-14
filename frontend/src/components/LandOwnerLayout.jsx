import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useApp } from '../context/AppContext';
import { getAuthSession, clearAuthSession } from '../services/api';

const LO_LAYOUT_T = {
  en: {
    dashboard: 'Dashboard', myFarms: 'My Farms', myCrops: 'My Crops',
    myCultivations: 'My Cultivations', advisories: 'Advisories',
    marketplace: 'Marketplace', settings: 'Settings',
    helpSupport: 'Help & Support', landOwner: 'Land Owner',
    profileSettings: 'Profile Settings', logout: 'Log Out',
    notifications: 'Notifications', viewDashboard: 'Check your dashboard',
    viewDashboardSub: 'View all cultivation tasks and farming alerts.',
  },
  si: {
    dashboard: 'ඩැෂ්බෝඩ්', myFarms: 'මගේ ගොවිපළ', myCrops: 'මගේ බෝග',
    myCultivations: 'මගේ වගාවන්', advisories: 'උපදෙස්',
    marketplace: 'වෙළඳසැල', settings: 'සැකසීම්',
    helpSupport: 'උදව් සහ සහාය', landOwner: 'ඉඩම් හිමිකරු',
    profileSettings: 'පැතිකඩ සැකසීම්', logout: 'ලොග් අවුට්',
    notifications: 'දැනුම්දීම්', viewDashboard: 'ඩැෂ්බෝඩ් බලන්න',
    viewDashboardSub: 'සියලු ගොවිතැන් කාර්යයන් සහ අනතුරු ඇඟවීම් බලන්න.',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', myFarms: 'என் பண்ணைகள்', myCrops: 'என் பயிர்கள்',
    myCultivations: 'என் சாகுபடிகள்', advisories: 'ஆலோசனைகள்',
    marketplace: 'சந்தை', settings: 'அமைப்புகள்',
    helpSupport: 'உதவி & ஆதரவு', landOwner: 'நில உரிமையாளர்',
    profileSettings: 'சுயவிவர அமைப்புகள்', logout: 'வெளியேறு',
    notifications: 'அறிவிப்புகள்', viewDashboard: 'டாஷ்போர்டை பார்க்கவும்',
    viewDashboardSub: 'அனைத்து சாகுபடி பணிகள் மற்றும் விவசாய எச்சரிக்கைகளை பார்க்கவும்.',
  },
};

export default function LandOwnerLayout() {
  const { lang } = useApp();
  const t = LO_LAYOUT_T[lang] || LO_LAYOUT_T.en;
  const { user } = getAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user || user.role !== 'Land Owner') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const navItems = [
    { to: '/landowner/dashboard',    icon: '📊', label: t.dashboard },
    { to: '/landowner/farms',        icon: '🌾', label: t.myFarms },
    { to: '/landowner/crops',        icon: '🌿', label: t.myCrops },
    { to: '/landowner/cultivations', icon: '📅', label: t.myCultivations },
    { to: '/crop-guidance',          icon: '🤖', label: t.advisories },
    { to: '/marketplace',            icon: '🏪', label: t.marketplace },
    { to: '/landowner/settings',     icon: '⚙️', label: t.settings },
    { to: '/landowner/help',         icon: '❓', label: t.helpSupport },
  ];

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'LO';

  return (
    <div className="lo-shell">
      <Navbar />
      <aside className="lo-sidebar">
        <nav className="lo-sidebar__nav">
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={label}
              to={to}
              className={`lo-sidebar__link${
                location.pathname === to ||
                (location.pathname.startsWith(to + '/') && to !== '/landowner/dashboard')
                  ? ' active' : ''
              }`}
            >
              <span className="lo-sidebar__link-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar bottom — avatar + name (no ID) */}
        <div className="lo-sidebar__user">
          <div className="lo-sidebar__user-avatar lo-sidebar__user-avatar--large">
            {initials}
          </div>
          <div className="lo-sidebar__user-info">
            <div className="lo-sidebar__user-name">{user?.full_name || t.landOwner}</div>
            <div className="lo-sidebar__user-role">{t.landOwner}</div>
          </div>
        </div>
      </aside>

      <div className="lo-main">
        <header className="lo-topbar">
          <div className="lo-topbar__title">
            {navItems.find(n => location.pathname.startsWith(n.to))?.label || t.dashboard}
          </div>
          <div className="lo-topbar__right">

            {/* Notification bell */}
            <div className="lo-topbar__notif-wrap">
              <button
                className="lo-topbar__notif-btn"
                type="button"
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                aria-label={t.notifications}
              >
                🔔
                <span className="lo-topbar__notif-dot" />
              </button>
              {notifOpen && (
                <div className="lo-topbar__notif-panel">
                  <div className="lo-topbar__notif-panel-header">
                    <span>{t.notifications}</span>
                    <button type="button" onClick={() => setNotifOpen(false)}
                      style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'14px'}}>✕</button>
                  </div>
                  <div className="lo-topbar__notif-panel-body">
                    <Link to="/landowner/dashboard" onClick={() => setNotifOpen(false)} style={{textDecoration:'none'}}>
                      <div className="dash-notif-card dash-notif-card--info" style={{cursor:'pointer'}}>
                        <span className="dash-notif-icon">ℹ️</span>
                        <div className="dash-notif-body">
                          <strong className="dash-notif-strong">{t.viewDashboard}</strong>
                          <p>{t.viewDashboardSub}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile avatar + dropdown */}
            <div className="lo-topbar__profile-wrap" ref={profileRef}>
              <button
                className="lo-topbar__profile-btn"
                type="button"
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                aria-label="Profile"
              >
                <div className="lo-topbar__profile-avatar">{initials}</div>
                <div className="lo-topbar__profile-info">
                  <span className="lo-topbar__profile-name">{user?.full_name?.split(' ')[0] || t.landOwner}</span>
                  <span className="lo-topbar__profile-role">{t.landOwner}</span>
                </div>
                <span className="lo-topbar__profile-chevron">{profileOpen ? '▲' : '▼'}</span>
              </button>
              {profileOpen && (
                <div className="lo-topbar__profile-panel">
                  <div className="lo-topbar__profile-panel-header">
                    <div className="lo-topbar__profile-panel-avatar">{initials}</div>
                    <div>
                      <div className="lo-topbar__profile-panel-name">{user?.full_name || t.landOwner}</div>
                      <div className="lo-topbar__profile-panel-role">{t.landOwner}</div>
                    </div>
                  </div>
                  <div className="lo-topbar__profile-panel-divider" />
                  <Link
                    to="/landowner/settings"
                    className="lo-topbar__profile-panel-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    ⚙️ {t.profileSettings}
                  </Link>
                  <Link
                    to="/landowner/help"
                    className="lo-topbar__profile-panel-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    ❓ {t.helpSupport}
                  </Link>
                  <div className="lo-topbar__profile-panel-divider" />
                  <button
                    className="lo-topbar__profile-panel-item lo-topbar__profile-panel-item--danger"
                    type="button"
                    onClick={handleLogout}
                  >
                    🚪 {t.logout}
                  </button>
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
