import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { useApp } from '../context/AppContext';
import { getAuthSession } from '../services/api';

const LO_LAYOUT_T = {
  en: {
    dashboard: 'Dashboard', myFarms: 'My Farms', myCrops: 'My Crops',
    myCultivations: 'My Cultivations', advisories: 'Advisories',
    marketplace: 'Marketplace', settings: 'Settings',
    helpSupport: 'Help & Support', landOwner: 'Land Owner',
  },
  si: {
    dashboard: 'ඩැෂ්බෝඩ්', myFarms: 'මගේ ගොවිපළ', myCrops: 'මගේ බෝග',
    myCultivations: 'මගේ වගාවන්', advisories: 'උපදෙස්',
    marketplace: 'වෙළඳසැල', settings: 'සැකසීම්',
    helpSupport: 'උදව් සහ සහාය', landOwner: 'ඉඩම් හිමිකරු',
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', myFarms: 'என் பண்ணைகள்', myCrops: 'என் பயிர்கள்',
    myCultivations: 'என் சாகுபடிகள்', advisories: 'ஆலோசனைகள்',
    marketplace: 'சந்தை', settings: 'அமைப்புகள்',
    helpSupport: 'உதவி & ஆதரவு', landOwner: 'நில உரிமையாளர்',
  },
};

export default function LandOwnerLayout() {
  const { lang } = useApp();
  const t = LO_LAYOUT_T[lang] || LO_LAYOUT_T.en;
  const { user } = getAuthSession();
  const location = useLocation();

  if (!user || user.role !== 'Land Owner') {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { to: '/landowner/dashboard',     icon: '📊', label: t.dashboard },
    { to: '/landowner/farms',         icon: '🌾', label: t.myFarms },
    { to: '/landowner/crops',         icon: '🌿', label: t.myCrops },
    { to: '/landowner/cultivations',  icon: '📅', label: t.myCultivations },
    { to: '/crop-guidance',            icon: '🤖', label: t.advisories },
    { to: '/marketplace',             icon: '🏪', label: t.marketplace },
    { to: '/landowner/settings',       icon: '⚙️', label: t.settings },
    { to: '/landowner/help',           icon: '❓', label: t.helpSupport },
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
            <div className="lo-sidebar__user-name">{user?.full_name || t.landOwner}</div>
            <div className="lo-sidebar__user-id">ID: LO-{String(user?.id || '000').padStart(6, '0')}</div>
          </div>
        </div>
      </aside>
      <div className="lo-main">
        <header className="lo-topbar">
          <div className="lo-topbar__title">
            {navItems.find(n => location.pathname.startsWith(n.to))?.label || t.dashboard}
          </div>
          <div className="lo-topbar__right">
            <span className="lo-topbar__badge">🔔</span>
            <div className="lo-topbar__user">
              <div className="lo-topbar__avatar">{user?.full_name?.charAt(0) || 'L'}</div>
              <span>{t.landOwner}</span>
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
