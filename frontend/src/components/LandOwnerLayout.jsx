import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useApp } from '../context/AppContext';
import { getAuthSession, clearAuthSession } from '../services/api';
import { getCrops } from '../services/cropService';
import { listCultivations } from '../utils/cultivationApi';
import { getCropLabel } from '../data/cropData';
import { LAND_T } from '../data/translations';

const LO_LAYOUT_T = {
  en: {
    dashboard: 'Dashboard', myFarms: 'My Farms', myCrops: 'My Crops',
    myCultivations: 'My Cultivations', advisories: 'Advisories',
    marketplace: 'Marketplace', settings: 'Settings',
    helpSupport: 'Help & Support', landOwner: 'Land Owner',
    profileSettings: 'Profile Settings', logout: 'Log Out',
    notifications: 'Notifications', noNotifications: 'No new notifications.',
  },
  si: {
    dashboard: 'ඩැෂ්බෝඩ්', myFarms: 'මගේ ගොවිපළ', myCrops: 'මගේ බෝග',
    myCultivations: 'මගේ වගාවන්', advisories: 'උපදෙස්',
    marketplace: 'වෙළඳසැල', settings: 'සැකසීම්',
    helpSupport: 'උදව් සහ සහාය', landOwner: 'ඉඩම් හිමිකරු',
    profileSettings: 'පැතිකඩ සැකසීම්', logout: 'ලොග් අවුට්',
    notifications: 'දැනුම්දීම්', noNotifications: 'නව දැනුම්දීම් නොමැත.',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', myFarms: 'என் பண்ணைகள்', myCrops: 'என் பயிர்கள்',
    myCultivations: 'என் சாகுபடிகள்', advisories: 'ஆலோசனைகள்',
    marketplace: 'சந்தை', settings: 'அமைப்புகள்',
    helpSupport: 'உதவி & ஆதரவு', landOwner: 'நில உரிமையாளர்',
    profileSettings: 'சுயவிவர அமைப்புகள்', logout: 'வெளியேறு',
    notifications: 'அறிவிப்புகள்', noNotifications: 'புதிய அறிவிப்புகள் இல்லை.',
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
  const [notifs,      setNotifs]      = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sa_dismissed_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const userId = String(user.id);
    const lt     = LAND_T[lang] || LAND_T.en;
    const today  = new Date().toISOString().slice(0, 10);
    const in7    = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const in3    = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

    setNotifLoading(true);
    Promise.all([
      listCultivations(userId).catch(() => ({ sessions: [] })),
      getCrops().catch(() => []),
    ]).then(([cultData, crops]) => {
      const allNotifs = [];
      const sessions  = cultData.sessions || [];

      for (const session of sessions) {
        if (session.status !== 'active') continue;
        const tasks     = Object.values(session.tasks || {});
        const cropLabel = getCropLabel(session.crop, lang);

        const overdue = tasks.filter(tk =>
          tk.status !== 'done' && tk.status !== 'skipped' && tk.scheduled_date < today
        );
        if (overdue.length > 0) {
          allNotifs.push({
            id: `overdue-${session.id}`,
            type: 'danger',
            icon: '🚨',
            title: lt.overdueTasks(overdue.length, cropLabel),
            detail: overdue.slice(0, 3).map(tk => tk.title).join(', ') + (overdue.length > 3 ? ` +${overdue.length - 3}` : ''),
            href: '/landowner/cultivations',
          });
        }

        const upcoming = tasks.filter(tk =>
          tk.status === 'pending' && tk.scheduled_date >= today && tk.scheduled_date <= in7
        );
        if (upcoming.length > 0) {
          const next = upcoming.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
          const daysLeft = Math.floor((new Date(next.scheduled_date) - new Date(today)) / 86400000);
          allNotifs.push({
            id: `upcoming-${session.id}-${next.id}`,
            type: 'task',
            icon: '📅',
            title: daysLeft === 0
              ? lt.upcomingTaskToday(cropLabel, next.title)
              : lt.upcomingTaskInDays(cropLabel, next.title, daysLeft),
            detail: lt.upcomingTaskDetail(upcoming.length),
            href: '/landowner/cultivations',
          });
        }
      }

      crops
        .filter(cr => cr.status === 'Active' && cr.expected_harvest_date >= today && cr.expected_harvest_date <= in3)
        .forEach(cr => {
          const d         = Math.floor((new Date(cr.expected_harvest_date) - new Date(today)) / 86400000);
          const cropLabel = getCropLabel(cr.crop_name, lang);
          allNotifs.push({
            id: `harvest-${cr.id}`,
            type: 'warning',
            icon: '🧺',
            title: d === 0 ? lt.harvestTodayMsg(cropLabel) : lt.harvestInDaysMsg(d, cropLabel),
            detail: lt.harvestDetailMsg(new Date(cr.expected_harvest_date).toLocaleDateString()),
          });
        });

      setNotifs(allNotifs);
      setNotifLoading(false);
    });
  }, [user?.id, lang]);

  const dismissNotif = id => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('sa_dismissed_notifs', JSON.stringify([...next]));
      return next;
    });
  };

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

  const visibleNotifs = notifs.filter(n => !dismissed.has(n.id));

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

        {/* Sidebar bottom — avatar + name */}
        <div className="lo-sidebar__user">
          <div className="lo-sidebar__user-avatar lo-sidebar__user-avatar--large">
            {user?.profile_image
              ? <img src={user.profile_image} alt={user.full_name || 'avatar'} />
              : initials}
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
            <div className="lo-topbar__notif-wrap" ref={notifRef}>
              <button
                className="lo-topbar__notif-btn"
                type="button"
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                aria-label={t.notifications}
              >
                🔔
                {visibleNotifs.length > 0
                  ? <span className="lo-topbar__notif-badge">{visibleNotifs.length}</span>
                  : <span className="lo-topbar__notif-dot" />}
              </button>
              {notifOpen && (
                <div className="lo-topbar__notif-panel">
                  <div className="lo-topbar__notif-panel-header">
                    <span>{t.notifications}</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'14px'}}
                    >✕</button>
                  </div>
                  <div className="lo-topbar__notif-panel-body">
                    {notifLoading ? (
                      <p className="lo-topbar__notif-empty">…</p>
                    ) : visibleNotifs.length === 0 ? (
                      <p className="lo-topbar__notif-empty">{t.noNotifications}</p>
                    ) : (
                      visibleNotifs.map(n => (
                        <div
                          key={n.id}
                          className={`dash-notif-card dash-notif-card--${n.type}${n.href ? ' dash-notif-card--clickable' : ''}`}
                          onClick={() => { if (n.href) { navigate(n.href); setNotifOpen(false); } }}
                        >
                          <span className="dash-notif-icon">{n.icon}</span>
                          <div className="dash-notif-body">
                            <strong className="dash-notif-strong">{n.title}</strong>
                            <p>{n.detail}</p>
                          </div>
                          <button
                            className="dash-notif-dismiss"
                            type="button"
                            onClick={e => { e.stopPropagation(); dismissNotif(n.id); }}
                            title="Dismiss"
                          >✕</button>
                        </div>
                      ))
                    )}
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
                <div className="lo-topbar__profile-avatar">
                  {user?.profile_image
                    ? <img src={user.profile_image} alt={user.full_name || 'avatar'} />
                    : initials}
                </div>
                <div className="lo-topbar__profile-info">
                  <span className="lo-topbar__profile-name">{user?.full_name?.split(' ')[0] || t.landOwner}</span>
                  <span className="lo-topbar__profile-role">{t.landOwner}</span>
                </div>
                <span className="lo-topbar__profile-chevron">{profileOpen ? '▲' : '▼'}</span>
              </button>
              {profileOpen && (
                <div className="lo-topbar__profile-panel">
                  <div className="lo-topbar__profile-panel-header">
                    <div className="lo-topbar__profile-panel-avatar">
                      {user?.profile_image
                        ? <img src={user.profile_image} alt={user.full_name || 'avatar'} />
                        : initials}
                    </div>
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
