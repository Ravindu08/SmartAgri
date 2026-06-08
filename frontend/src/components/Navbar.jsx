import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';

const NAV_T = {
  en: { cropRec: 'Crop AI', guidance: 'Guidance', weather: 'Weather', yield: 'Yield & Price', marketplace: 'Marketplace', about: 'About' },
  si: { cropRec: 'බෝග AI',  guidance: 'මාර්ගෝපදේශය', weather: 'කාලගුණය', yield: 'අස්වැන්න',  marketplace: 'වෙළඳසැල', about: 'අප ගැන' },
  ta: { cropRec: 'பயிர் AI', guidance: 'வழிகாட்டி', weather: 'வானிலை',  yield: 'மகசூல்',     marketplace: 'சந்தை',   about: 'எங்களை பற்றி' },
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
      {/* Brand */}
      <Link className="navbar__brand" to="/" onClick={close}>
        <span className="navbar__logo">🌾</span>
        Smart<span>Agri</span>
      </Link>

      {/* Controls always visible: theme toggle + hamburger */}
      <div className="navbar__controls">
        <button
          className="navbar__theme-toggle"
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          className="nav-hamburger"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Nav links — hidden on mobile until hamburger clicked */}
      <nav className={`navbar__links${menuOpen ? ' open' : ''}`} aria-label="Primary navigation">
        <Link to="/crop-recommendation" onClick={close}>{t.cropRec}</Link>
        <Link to="/crop-guidance"       onClick={close}>{t.guidance}</Link>
        <Link to="/weather"             onClick={close}>{t.weather}</Link>
        <Link to="/yield-price"         onClick={close}>{t.yield}</Link>
        <Link to="/marketplace"         onClick={close}>{t.marketplace}</Link>
        <Link to="/about"               onClick={close}>{t.about}</Link>

        {isSignedIn && user.role === 'Land Owner' && (
          <Link className="navbar__farm-link" to="/landowner/farms" onClick={close}>
            🌱 My Farms
          </Link>
        )}

        {/* Language switcher */}
        <div className="navbar__lang">
          {['en', 'si', 'ta'].map((code) => (
            <button
              key={code}
              className={`lang-btn${lang === code ? ' on' : ''}`}
              type="button"
              aria-label={`Switch to ${code === 'en' ? 'English' : code === 'si' ? 'Sinhala' : 'Tamil'}`}
              onClick={() => { setLang(code); close(); }}
            >
              {code === 'en' ? 'EN' : code === 'si' ? 'සිං' : 'தமி'}
            </button>
          ))}
        </div>

        {/* Auth */}
        {isSignedIn ? (
          <>
            <span className="navbar__session">
              <span className="navbar__role">{user.role}</span>
              <span className="navbar__user">{user.full_name}</span>
            </span>
            <button className="navbar__logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="navbar__login"    to="/login"    onClick={close}>Login</Link>
            <Link className="navbar__register" to="/register" onClick={close}>Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
