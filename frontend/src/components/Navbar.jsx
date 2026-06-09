import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';

const NAV_T = {
  en: { home: 'Home', about: 'Contact', features: 'Features', marketplace: 'Marketplace', howItWorks: 'How It Works', contact: 'About', cropRec: 'Crop AI', guidance: 'Guidance', weather: 'Weather', yield: 'Yield & Price' },
  si: { home: 'මුල් පිටුව', about: 'සම්බන්ධය', features: 'විශේෂාංග', marketplace: 'වෙළඳසැල', howItWorks: 'ක්‍රමය', contact: 'අප ගැන', cropRec: 'බෝග AI', guidance: 'මාර්ගෝපදේශය', weather: 'කාලගුණය', yield: 'අස්වැන්න' },
  ta: { home: 'முகப்பு', about: 'தொடர்பு', features: 'அம்சங்கள்', marketplace: 'சந்தை', howItWorks: 'எப்படி', contact: 'எங்களை பற்றி', cropRec: 'பயிர் AI', guidance: 'வழிகாட்டி', weather: 'வானிலை', yield: 'மகசூல்' },
};

export default function Navbar() {
  const navigate = useNavigate();
  const { lang, setLang, theme, toggleTheme } = useApp();
  const { user } = getAuthSession();
  const isSignedIn = Boolean(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = NAV_T[lang] || NAV_T.en;

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
        <Link to="/" className="nav-link" onClick={close}>{t.home}</Link>
        <Link to="/about" className="nav-link" onClick={close}>{t.contact}</Link>
        <Link to="/crop-recommendation" className="nav-link" onClick={close}>{t.features}</Link>
        <Link to="/marketplace" className="nav-link" onClick={close}>{t.marketplace}</Link>
        <Link to="/crop-guidance" className="nav-link" onClick={close}>{t.howItWorks}</Link>
        <Link to="/wx" className="nav-link" onClick={close}>{t.weather}</Link>
        <Link to="/about" className="nav-link" onClick={close}>{t.about}</Link>

        {isSignedIn && user.role === 'Land Owner' && (
          <Link className="navbar__farm-link" to="/landowner/farms" onClick={close}>🌱 My Farms</Link>
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
        <button className="navbar__theme-toggle" type="button" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {isSignedIn ? (
          <>
            <span className="navbar__session">
              <span className="navbar__role">{user.role}</span>
              <span className="navbar__user">{user.full_name}</span>
            </span>
            <button className="navbar__logout" type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link className="navbar__login" to="/login" onClick={close}>Login</Link>
            <Link className="navbar__register" to="/register" onClick={close}>Register</Link>
          </>
        )}
        <button className="nav-hamburger" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
