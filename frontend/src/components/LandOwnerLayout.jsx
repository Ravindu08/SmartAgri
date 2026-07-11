import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import CustomSelect from './CustomSelect';
import { useApp } from '../context/AppContext';
import { getAuthSession, clearAuthSession, getActiveRole, isDualRole, submitFeedback, fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
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
    markAllSeen: 'Mark all as seen', markSeen: 'Mark as seen', seenLabel: 'Seen',
    switchRole: 'Switch to Trader', sendFeedback: 'Send Feedback',
    fbTitle: 'Send Feedback', fbType: 'Type', fbSubject: 'Subject',
    fbMessage: 'Message', fbSend: 'Send', fbSending: 'Sending…', fbSent: 'Sent!',
    fbTypes: { feedback: 'Feedback', complaint: 'Complaint', bug: 'Bug Report' },
  },
  si: {
    dashboard: 'ඩැෂ්බෝඩ්', myFarms: 'මගේ ගොවිපළ', myCrops: 'මගේ බෝග',
    myCultivations: 'මගේ වගාවන්', advisories: 'උපදෙස්',
    marketplace: 'වෙළඳසැල', settings: 'සැකසීම්',
    helpSupport: 'උදව් සහ සහාය', landOwner: 'ඉඩම් හිමිකරු',
    profileSettings: 'පැතිකඩ සැකසීම්', logout: 'ලොග් අවුට්',
    notifications: 'දැනුම්දීම්', noNotifications: 'නව දැනුම්දීම් නොමැත.',
    markAllSeen: 'සියල්ල දුටු ලෙස ලකුණු කරන්න', markSeen: 'දුටු ලෙස ලකුණු කරන්න', seenLabel: 'දුටුවා',
    switchRole: 'ව්‍යාපාරිකයාට මාරු වන්න', sendFeedback: 'ප්‍රතිපෝෂණ',
    fbTitle: 'ප්‍රතිපෝෂණ යවන්න', fbType: 'වර්ගය', fbSubject: 'විෂය',
    fbMessage: 'පණිවිඩය', fbSend: 'යවන්න', fbSending: 'යවමින්…', fbSent: 'යැවීය!',
    fbTypes: { feedback: 'ප්‍රතිපෝෂණ', complaint: 'පැමිණිලි', bug: 'දෝෂ වාර්තාව' },
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', myFarms: 'என் பண்ணைகள்', myCrops: 'என் பயிர்கள்',
    myCultivations: 'என் சாகுபடிகள்', advisories: 'ஆலோசனைகள்',
    marketplace: 'சந்தை', settings: 'அமைப்புகள்',
    helpSupport: 'உதவி & ஆதரவு', landOwner: 'நில உரிமையாளர்',
    profileSettings: 'சுயவிவர அமைப்புகள்', logout: 'வெளியேறு',
    notifications: 'அறிவிப்புகள்', noNotifications: 'புதிய அறிவிப்புகள் இல்லை.',
    markAllSeen: 'அனைத்தையும் பார்த்ததாகக் குறி', markSeen: 'பார்த்ததாகக் குறி', seenLabel: 'பார்த்தது',
    switchRole: 'வணிகருக்கு மாறு', sendFeedback: 'கருத்து',
    fbTitle: 'கருத்து அனுப்பு', fbType: 'வகை', fbSubject: 'தலைப்பு',
    fbMessage: 'செய்தி', fbSend: 'அனுப்பு', fbSending: 'அனுப்புகிறது…', fbSent: 'அனுப்பப்பட்டது!',
    fbTypes: { feedback: 'கருத்து', complaint: 'புகார்', bug: 'பிழை அறிக்கை' },
  },
};

function FeedbackModal({ t, onClose }) {
  const [fbData, setFbData] = useState({ type: 'feedback', subject: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await submitFeedback(fbData);
      setStatus('sent');
      setTimeout(onClose, 1500);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card)', borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text)' }}>{t.fbTitle}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px' }}>✕</button>
        </div>
        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--green-primary)', fontSize: '18px' }}>✓ {t.fbSent}</div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: 'var(--muted)' }}>
              {t.fbType}
              <CustomSelect name="type" value={fbData.type} onChange={e => setFbData(d => ({ ...d, type: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' }}>
                <option value="feedback">{t.fbTypes.feedback}</option>
                <option value="complaint">{t.fbTypes.complaint}</option>
                <option value="bug">{t.fbTypes.bug}</option>
              </CustomSelect>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: 'var(--muted)' }}>
              {t.fbSubject}
              <input required value={fbData.subject} onChange={e => setFbData(d => ({ ...d, subject: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: 'var(--muted)' }}>
              {t.fbMessage}
              <textarea required rows={4} value={fbData.message} onChange={e => setFbData(d => ({ ...d, message: e.target.value }))}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px', resize: 'vertical' }} />
            </label>
            <button type="submit" disabled={status === 'sending'}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--green-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              {status === 'sending' ? t.fbSending : t.fbSend}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LandOwnerLayout() {
  const { lang } = useApp();
  const t = LO_LAYOUT_T[lang] || LO_LAYOUT_T.en;
  const { user } = getAuthSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [notifs,       setNotifs]       = useState([]);
  const [apiNotifs,    setApiNotifs]    = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sa_dismissed_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const dualRole   = isDualRole();

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll backend notifications every 30 s
  useEffect(() => {
    if (!user?.id) return;
    const loadApiNotifs = () => {
      fetchNotifications().then(data => {
        setApiNotifs(
          (data || [])
            .map(n => ({
              id: `api-${n.id}`,
              _apiId: n.id,
              seen: !!n.is_read,
              type: n.type.includes('danger') || n.type === 'order_rejected' ? 'danger' : 'task',
              icon: n.type === 'order_created' ? '🛒' : n.type === 'order_confirmed' ? '✅' : n.type === 'order_rejected' ? '❌' : n.type === 'order_delivered' ? '🚚' : n.type === 'order_completed' ? '🎉' : n.type === 'rating_received' ? '⭐' : '🔔',
              title: n.title,
              detail: n.body || '',
              href: n.link || null,
            }))
            // unseen first; keep seen history but cap it so the panel stays scannable
            .sort((a, b) => a.seen - b.seen)
            .slice(0, 25)
        );
      }).catch(() => {});
    };
    loadApiNotifs();
    const interval = setInterval(loadApiNotifs, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = String(user.id);

    const loadCultNotifs = () => {
      const lt    = LAND_T[lang] || LAND_T.en;
      const today = new Date().toISOString().slice(0, 10);
      const in7   = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const in3   = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

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
              id: `overdue-${session.id}`, type: 'danger', icon: '🚨',
              title: lt.overdueTasks(overdue.length, cropLabel),
              detail: overdue.slice(0, 3).map(tk => tk.title).join(', ') + (overdue.length > 3 ? ` +${overdue.length - 3}` : ''),
              href: '/landowner/cultivations',
            });
          }

          const upcoming = tasks.filter(tk =>
            tk.status === 'pending' && tk.scheduled_date >= today && tk.scheduled_date <= in7
          );
          if (upcoming.length > 0) {
            const next     = upcoming.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
            const daysLeft = Math.floor((new Date(next.scheduled_date) - new Date(today)) / 86400000);
            allNotifs.push({
              id: `upcoming-${session.id}-${next.id}`, type: 'task', icon: '📅',
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
              id: `harvest-${cr.id}`, type: 'warning', icon: '🧺',
              title: d === 0 ? lt.harvestTodayMsg(cropLabel) : lt.harvestInDaysMsg(d, cropLabel),
              detail: lt.harvestDetailMsg(new Date(cr.expected_harvest_date).toLocaleDateString()),
            });
          });

        setNotifs(allNotifs);
        setNotifLoading(false);
        // Prune dismissed IDs whose notifications have naturally resolved
        setDismissed(prev => {
          const activeIds = new Set(allNotifs.map(n => n.id));
          const cleaned   = new Set([...prev].filter(id => activeIds.has(id)));
          if (cleaned.size === prev.size) return prev;
          localStorage.setItem('sa_dismissed_notifs', JSON.stringify([...cleaned]));
          return cleaned;
        });
      });
    };

    setNotifLoading(true);
    loadCultNotifs();
    const id = setInterval(loadCultNotifs, 30_000);
    return () => clearInterval(id);
  }, [user?.id, lang]);

  const dismissNotif = id => {
    // Backend notifications: mark seen (kept in the list, dimmed) rather than removed
    const apiNotif = apiNotifs.find(n => n.id === id);
    if (apiNotif) {
      markNotificationRead(apiNotif._apiId).catch(() => {});
      setApiNotifs(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
      return;
    }
    // Cultivation-derived notifications: local dismiss (they self-clear once resolved)
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('sa_dismissed_notifs', JSON.stringify([...next]));
      return next;
    });
  };

  const markAllSeen = () => {
    markAllNotificationsRead().catch(() => {});
    setApiNotifs(prev => prev.map(n => ({ ...n, seen: true })));
  };

  // Shake the bell whenever the unseen count goes up (new notification arrived)
  const [bellShaking, setBellShaking] = useState(false);
  const prevUnseenRef = useRef(0);
  useEffect(() => {
    const unseen = [...notifs.filter(n => !dismissed.has(n.id)), ...apiNotifs].filter(n => !n.seen).length;
    if (unseen > prevUnseenRef.current) {
      setBellShaking(true);
      const id = setTimeout(() => setBellShaking(false), 600);
      prevUnseenRef.current = unseen;
      return () => clearTimeout(id);
    }
    prevUnseenRef.current = unseen;
  }, [notifs, dismissed, apiNotifs]);

  if (!user) return <Navigate to="/login" replace />;
  const activeRole = getActiveRole();
  if (activeRole && activeRole !== 'Land Owner') return <Navigate to="/login" replace />;
  const userRoles = user.roles || [user.role];
  if (!userRoles.includes('Land Owner')) return <Navigate to="/login" replace />;

  const handleLogout = () => { clearAuthSession(); navigate('/login'); };

  const handleSwitchRole = () => {
    localStorage.setItem('sa-active-role', 'Trader');
    navigate('/trader/dashboard', { replace: true });
  };

  const navItems = [
    { to: '/landowner/dashboard',    icon: '📊', label: t.dashboard },
    { to: '/landowner/farms',        icon: '🌾', label: t.myFarms },
    { to: '/landowner/crops',        icon: '🌿', label: t.myCrops },
    { to: '/landowner/cultivations', icon: '📅', label: t.myCultivations },
    { to: '/crop-guidance',          icon: '🤖', label: t.advisories },
    ...(import.meta.env.VITE_SHOW_MARKETPLACE !== 'false' ? [{ to: '/marketplace', icon: '🏪', label: t.marketplace }] : []),
    { to: '/landowner/settings',     icon: '⚙️', label: t.settings },
    { to: '/landowner/help',         icon: '❓', label: t.helpSupport },
  ];

  const initials     = user?.full_name ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'LO';
  const visibleNotifs = [...notifs.filter(n => !dismissed.has(n.id)), ...apiNotifs];
  const unseenCount   = visibleNotifs.filter(n => !n.seen).length;

  return (
    <div className="lo-shell">
      <Navbar />
      {sidebarOpen && <div className="lo-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`lo-sidebar${sidebarOpen ? ' lo-sidebar--open' : ''}`}>
        <nav className="lo-sidebar__nav">
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={label} to={to}
              onClick={() => setSidebarOpen(false)}
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

        {/* Feedback + Switch Role buttons */}
        <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => setFeedbackOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
              borderRadius: '8px', border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '13px', width: '100%',
            }}
          >
            💬 {t.sendFeedback}
          </button>
          {dualRole && (
            <button
              onClick={handleSwitchRole}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.14)',
                color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%',
              }}
            >
              🔄 {t.switchRole}
            </button>
          )}
        </div>

        <div className="lo-sidebar__user">
          <div className="lo-sidebar__user-avatar lo-sidebar__user-avatar--large">
            {user?.profile_image ? <img src={user.profile_image} alt={user.full_name || 'avatar'} /> : initials}
          </div>
          <div className="lo-sidebar__user-info">
            <div className="lo-sidebar__user-name">{user?.full_name || t.landOwner}</div>
            <div className="lo-sidebar__user-role">{t.landOwner}</div>
          </div>
        </div>
      </aside>

      <div className="lo-main">
        <header className="lo-topbar">
          <button className="lo-hamburger" type="button" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">☰</button>
          <div className="lo-topbar__title">
            {navItems.find(n => location.pathname.startsWith(n.to))?.label || t.dashboard}
          </div>
          <div className="lo-topbar__right">
            <div className="lo-topbar__notif-wrap" ref={notifRef}>
              <button className="lo-topbar__notif-btn" type="button"
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                aria-label={t.notifications}>
                <span className={bellShaking ? 'bell-shake' : undefined}>🔔</span>
                {unseenCount > 0
                  ? <span className="lo-topbar__notif-badge">{unseenCount}</span>
                  : <span className="lo-topbar__notif-dot" />}
              </button>
              {notifOpen && (
                <div className="lo-topbar__notif-panel">
                  <div className="lo-topbar__notif-panel-header">
                    <span>{t.notifications}</span>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      {apiNotifs.some(n => !n.seen) && (
                        <button type="button" className="lo-notif-mark-all" onClick={markAllSeen}>
                          ✓ {t.markAllSeen}
                        </button>
                      )}
                      <button type="button" onClick={() => setNotifOpen(false)}
                        style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'14px'}}>✕</button>
                    </div>
                  </div>
                  <div className="lo-topbar__notif-panel-body">
                    {notifLoading ? <p className="lo-topbar__notif-empty">…</p>
                      : visibleNotifs.length === 0 ? <p className="lo-topbar__notif-empty">{t.noNotifications}</p>
                      : visibleNotifs.map(n => (
                        <div key={n.id}
                          className={`dash-notif-card dash-notif-card--${n.type}${n.href ? ' dash-notif-card--clickable' : ''}${n.seen ? ' dash-notif-card--seen' : ''}`}
                          onClick={() => { if (n.href) { navigate(n.href); setNotifOpen(false); } }}>
                          <span className="dash-notif-icon">{n.icon}</span>
                          <div className="dash-notif-body">
                            <strong className="dash-notif-strong">{n.title}</strong>
                            <p>{n.detail}</p>
                          </div>
                          {n.seen
                            ? <span className="dash-notif-seen-tag">{t.seenLabel}</span>
                            : <button className="dash-notif-dismiss" type="button"
                                onClick={e => { e.stopPropagation(); dismissNotif(n.id); }}
                                title={n._apiId ? t.markSeen : 'Dismiss'}>{n._apiId ? '✓' : '✕'}</button>}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lo-topbar__profile-wrap" ref={profileRef}>
              <button className="lo-topbar__profile-btn" type="button"
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }} aria-label="Profile">
                <div className="lo-topbar__profile-avatar">
                  {user?.profile_image ? <img src={user.profile_image} alt={user.full_name || 'avatar'} /> : initials}
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
                      {user?.profile_image ? <img src={user.profile_image} alt={user.full_name || 'avatar'} /> : initials}
                    </div>
                    <div>
                      <div className="lo-topbar__profile-panel-name">{user?.full_name || t.landOwner}</div>
                      <div className="lo-topbar__profile-panel-role">{t.landOwner}</div>
                    </div>
                  </div>
                  <div className="lo-topbar__profile-panel-divider" />
                  <Link to="/landowner/settings" className="lo-topbar__profile-panel-item" onClick={() => setProfileOpen(false)}>
                    ⚙️ {t.profileSettings}
                  </Link>
                  <Link to="/landowner/help" className="lo-topbar__profile-panel-item" onClick={() => setProfileOpen(false)}>
                    ❓ {t.helpSupport}
                  </Link>
                  <div className="lo-topbar__profile-panel-divider" />
                  {dualRole && (
                    <button className="lo-topbar__profile-panel-item" type="button" onClick={handleSwitchRole}>
                      🔄 {t.switchRole}
                    </button>
                  )}
                  <button className="lo-topbar__profile-panel-item lo-topbar__profile-panel-item--danger"
                    type="button" onClick={handleLogout}>
                    🚪 {t.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="lo-content">
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      {feedbackOpen && <FeedbackModal t={t} onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
