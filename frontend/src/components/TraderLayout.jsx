import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import CustomSelect from './CustomSelect';
import { useApp } from '../context/AppContext';
import { getAuthSession, clearAuthSession, getActiveRole, isDualRole, submitFeedback, fetchNotifications, markNotificationRead } from '../services/api';

const TR_LAYOUT_T = {
  en: {
    dashboard: 'Dashboard', marketplace: 'Marketplace',
    myRequests: 'My Requests', myOrders: 'My Orders',
    history: 'Transaction History', settings: 'Settings',
    helpSupport: 'Help & Support', trader: 'Trader',
    profileSettings: 'Profile Settings', logout: 'Log Out',
    notifications: 'Notifications', noNotifications: 'No new notifications.',
    switchRole: 'Switch to Land Owner', sendFeedback: 'Send Feedback',
    fbTitle: 'Send Feedback', fbType: 'Type', fbSubject: 'Subject',
    fbMessage: 'Message', fbSend: 'Send', fbSending: 'Sending…', fbSent: 'Sent!',
    fbTypes: { feedback: 'Feedback', complaint: 'Complaint', bug: 'Bug Report' },
  },
  si: {
    dashboard: 'ඩැෂ්බෝඩ්', marketplace: 'වෙළඳසැල',
    myRequests: 'මගේ ඉල්ලීම්', myOrders: 'මගේ ඇණවුම්',
    history: 'ගනුදෙනු ඉතිහාසය', settings: 'සැකසීම්',
    helpSupport: 'උදව් සහ සහාය', trader: 'වෙළෙන්ද',
    profileSettings: 'පැතිකඩ සැකසීම්', logout: 'ලොග් අවුට්',
    notifications: 'දැනුම්දීම්', noNotifications: 'නව දැනුම්දීම් නොමැත.',
    switchRole: 'ඉඩම් හිමිකරුට මාරු වන්න', sendFeedback: 'ප්‍රතිපෝෂණ',
    fbTitle: 'ප්‍රතිපෝෂණ යවන්න', fbType: 'වර්ගය', fbSubject: 'විෂය',
    fbMessage: 'පණිවිඩය', fbSend: 'යවන්න', fbSending: 'යවමින්…', fbSent: 'යැවීය!',
    fbTypes: { feedback: 'ප්‍රතිපෝෂණ', complaint: 'පැමිණිලි', bug: 'දෝෂ වාර්තාව' },
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', marketplace: 'சந்தை',
    myRequests: 'என் கோரிக்கைகள்', myOrders: 'என் ஆர்டர்கள்',
    history: 'பரிவர்த்தனை வரலாறு', settings: 'அமைப்புகள்',
    helpSupport: 'உதவி & ஆதரவு', trader: 'கடைவர்',
    profileSettings: 'சுயவிவர அமைப்புகள்', logout: 'வெளியேறு',
    notifications: 'அறிவிப்புகள்', noNotifications: 'புதிய அறிவிப்புகள் இல்லை.',
    switchRole: 'நில உரிமையாளருக்கு மாறு', sendFeedback: 'கருத்து',
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
              style={{ padding: '10px', borderRadius: '8px', border: 'none', background: '#1565c0', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
              {status === 'sending' ? t.fbSending : t.fbSend}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function TraderLayout() {
  const { lang }   = useApp();
  const t          = TR_LAYOUT_T[lang] || TR_LAYOUT_T.en;
  const { user }   = getAuthSession();
  const location   = useLocation();
  const navigate   = useNavigate();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [apiNotifs,    setApiNotifs]    = useState([]);
  const profileRef = useRef(null);
  const notifRef   = useRef(null);
  const dualRole   = isDualRole();

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const load = () => {
      fetchNotifications().then(data => {
        setApiNotifs(
          (data || []).filter(n => !n.is_read).map(n => ({
            id: n.id,
            icon: n.type === 'order_confirmed' ? '✅' : n.type === 'order_rejected' ? '❌' : n.type === 'order_delivered' ? '🚚' : n.type === 'order_completed' ? '🎉' : '🔔',
            title: n.title,
            body: n.body || '',
            link: n.link || null,
          }))
        );
      }).catch(() => {});
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [user?.id]);

  const dismissTraderNotif = id => {
    markNotificationRead(id).catch(() => {});
    setApiNotifs(prev => prev.filter(n => n.id !== id));
  };

  if (!user) return <Navigate to="/login" replace />;
  const activeRole = getActiveRole();
  if (activeRole && activeRole !== 'Trader') return <Navigate to="/login" replace />;
  const userRoles = user.roles || [user.role];
  if (!userRoles.includes('Trader')) return <Navigate to="/login" replace />;

  const handleLogout = () => { clearAuthSession(); navigate('/login'); };

  const handleSwitchRole = () => {
    localStorage.setItem('sa-active-role', 'Land Owner');
    navigate('/landowner/dashboard', { replace: true });
  };

  const navItems = [
    { to: '/trader/dashboard', icon: '📊', label: t.dashboard },
    { to: '/marketplace',      icon: '🏪', label: t.marketplace },
    { to: '/trader/requests',  icon: '📋', label: t.myRequests },
    { to: '/trader/orders',    icon: '📦', label: t.myOrders },
    { to: '/trader/history',   icon: '📜', label: t.history },
    { to: '/trader/settings',  icon: '⚙️', label: t.settings },
    { to: '/trader/help',      icon: '❓', label: t.helpSupport },
  ];

  const initials     = user?.full_name ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'TR';
  const currentLabel = navItems.find(n =>
    location.pathname === n.to ||
    (location.pathname.startsWith(n.to + '/') && n.to !== '/trader/dashboard')
  )?.label || t.dashboard;

  return (
    <div className="lo-shell">
      <Navbar />
      {sidebarOpen && <div className="lo-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`lo-sidebar${sidebarOpen ? ' lo-sidebar--open' : ''}`}>
        <nav className="lo-sidebar__nav">
          {navItems.map(({ to, icon, label }) => (
            <Link key={label} to={to}
              onClick={() => setSidebarOpen(false)}
              className={`lo-sidebar__link${
                location.pathname === to ||
                (location.pathname.startsWith(to + '/') && to !== '/trader/dashboard')
                  ? ' active' : ''
              }`}>
              <span className="lo-sidebar__link-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Feedback + Switch Role buttons */}
        <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button onClick={() => setFeedbackOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
              borderRadius: '8px', border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '13px', width: '100%',
            }}>
            💬 {t.sendFeedback}
          </button>
          {dualRole && (
            <button onClick={handleSwitchRole}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.14)',
                color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%',
              }}>
              🔄 {t.switchRole}
            </button>
          )}
        </div>

        <div className="lo-sidebar__user">
          <div className="lo-sidebar__user-avatar lo-sidebar__user-avatar--large">
            {user?.profile_image ? <img src={user.profile_image} alt={user.full_name || 'avatar'} /> : initials}
          </div>
          <div className="lo-sidebar__user-info">
            <div className="lo-sidebar__user-name">{user?.full_name || t.trader}</div>
            <div className="lo-sidebar__user-role">{t.trader}</div>
          </div>
        </div>
      </aside>

      <div className="lo-main">
        <header className="lo-topbar">
          <button className="lo-hamburger" type="button" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">☰</button>
          <div className="lo-topbar__title">{currentLabel}</div>
          <div className="lo-topbar__right">
            <div className="lo-topbar__notif-wrap" ref={notifRef}>
              <button className="lo-topbar__notif-btn" type="button"
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                aria-label={t.notifications}>
                🔔
                {apiNotifs.length > 0
                  ? <span className="lo-topbar__notif-badge">{apiNotifs.length}</span>
                  : <span className="lo-topbar__notif-dot" />}
              </button>
              {notifOpen && (
                <div className="lo-topbar__notif-panel">
                  <div className="lo-topbar__notif-panel-header">
                    <span>{t.notifications}</span>
                    <button type="button" onClick={() => setNotifOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px' }}>✕</button>
                  </div>
                  <div className="lo-topbar__notif-panel-body">
                    {apiNotifs.length === 0
                      ? <p className="lo-topbar__notif-empty">{t.noNotifications}</p>
                      : apiNotifs.map(n => (
                        <div key={n.id}
                          className={`dash-notif-card dash-notif-card--task${n.link ? ' dash-notif-card--clickable' : ''}`}
                          onClick={() => { if (n.link) { navigate(n.link); setNotifOpen(false); } }}>
                          <span className="dash-notif-icon">{n.icon}</span>
                          <div className="dash-notif-body">
                            <strong className="dash-notif-strong">{n.title}</strong>
                            {n.body && <p>{n.body}</p>}
                          </div>
                          <button className="dash-notif-dismiss" type="button"
                            onClick={e => { e.stopPropagation(); dismissTraderNotif(n.id); }} title="Dismiss">✕</button>
                        </div>
                      ))
                    }
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
                  <span className="lo-topbar__profile-name">{user?.full_name?.split(' ')[0] || t.trader}</span>
                  <span className="lo-topbar__profile-role">{t.trader}</span>
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
                      <div className="lo-topbar__profile-panel-name">{user?.full_name || t.trader}</div>
                      <div className="lo-topbar__profile-panel-role">{t.trader}</div>
                    </div>
                  </div>
                  <div className="lo-topbar__profile-panel-divider" />
                  <Link to="/trader/settings" className="lo-topbar__profile-panel-item" onClick={() => setProfileOpen(false)}>
                    ⚙️ {t.profileSettings}
                  </Link>
                  <Link to="/trader/help" className="lo-topbar__profile-panel-item" onClick={() => setProfileOpen(false)}>
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
          <Outlet />
        </main>
      </div>

      {feedbackOpen && <FeedbackModal t={t} onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
