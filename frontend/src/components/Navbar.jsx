import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';

const NAV_T = {
  en: {
    home: 'Home',
    cropRec: 'Crop Recommendation',
    cropGuide: 'Crop Guidance',
    yieldPrice: 'Yield & Price',
    weather: 'Weather',
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    myFarms: '🌱 My Farms',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
  },
  si: {
    home: 'මුල් පිටුව',
    cropRec: 'බෝග නිර්දේශ',
    cropGuide: 'බෝග මාර්ගෝපදේශ',
    yieldPrice: 'අස්වැන්න සහ මිල',
    weather: 'කාලගුණය',
    aboutUs: 'අප ගැන',
    contactUs: 'සම්බන්ධ කරගන්න',
    myFarms: '🌱 මගේ ගොවිපළ',
    logout: 'ලොග් අවුට්',
    login: 'ලොගින්',
    register: 'ලියාපදිංචිය',
  },
  ta: {
    home: 'முகப்பு',
    cropRec: 'பயிர் பரிந்துரை',
    cropGuide: 'பயிர் வழிகாட்டி',
    yieldPrice: 'மகசூல் & விலை',
    weather: 'வானிலை',
    aboutUs: 'எங்களை பற்றி',
    contactUs: 'தொடர்பு',
    myFarms: '🌱 என் பண்ணைகள்',
    logout: 'வெளியேறு',
    login: 'உள்நுழை',
    register: 'பதிவு செய்',
  },
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, theme, toggleTheme } = useApp();
  const { user } = getAuthSession();
  const isSignedIn = Boolean(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = NAV_T[lang] || NAV_T.en;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true });
    close();
  };

  return (
    <header className="navbar">
      <Link className="navbar__brand" to="/" onClick={close}>
        <span className="navbar__logo">🌿</span>
        <div className="navbar__brand-text">
          <span className="navbar__brand-smart">Smart</span><span className="navbar__brand-agri">Agri</span>
        </div>
      </Link>

      <nav className={`navbar__links${menuOpen ? ' open' : ''}`}>
        <Link to="/" className={`nav-link${isActive('/') ? ' nav-link--active' : ''}`} onClick={close}>{t.home}</Link>
        <Link to="/crop-recommendation" className={`nav-link${isActive('/crop-recommendation') ? ' nav-link--active' : ''}`} onClick={close}>{t.cropRec}</Link>
        <Link to="/crop-guidance" className={`nav-link${isActive('/crop-guidance') ? ' nav-link--active' : ''}`} onClick={close}>{t.cropGuide}</Link>
        <Link to="/yield-price" className={`nav-link${isActive('/yield-price') ? ' nav-link--active' : ''}`} onClick={close}>{t.yieldPrice}</Link>
        <Link to="/wx" className={`nav-link${isActive('/wx') ? ' nav-link--active' : ''}`} onClick={close}>{t.weather}</Link>
        <Link to="/about" className={`nav-link${isActive('/about') ? ' nav-link--active' : ''}`} onClick={close}>{t.aboutUs}</Link>
        <Link to="/contact" className={`nav-link${isActive('/contact') ? ' nav-link--active' : ''}`} onClick={close}>{t.contactUs}</Link>

        {isSignedIn && user.role === 'Land Owner' && (
          <Link className="navbar__farm-link" to="/landowner/farms" onClick={close}>{t.myFarms}</Link>
        )}
      </nav>

      <div className="navbar__controls">
        <div className="navbar__lang">
          {['en', 'si', 'ta'].map((code) => (
            <button key={code} className={`lang-btn${lang === code ? ' on' : ''}`} type="button" onClick={() => { setLang(code); close(); }}>
              {code === 'en' ? 'EN' : code === 'si' ? 'සිං' : 'தமி'}
            </button>
          ))}
        </div>
        <button className="navbar__theme-toggle" type="button" onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {isSignedIn ? (
          <>
            {!location.pathname.startsWith('/landowner') && (
              <>
                <span className="navbar__session">
                  <span className="navbar__role">{user.role}</span>
                  <span className="navbar__user">{user.full_name}</span>
                </span>
                <button className="navbar__logout" type="button" onClick={handleLogout}>{t.logout}</button>
              </>
            )}
          </>
        ) : (
          <>
            <Link className="navbar__login" to="/login" onClick={close}>{t.login}</Link>
            <Link className="navbar__register" to="/register" onClick={close}>{t.register}</Link>
          </>
        )}
        <button className="nav-hamburger" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
