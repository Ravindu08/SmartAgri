import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronDown, LayoutDashboard, LayoutGrid, Leaf, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { clearAuthSession, getAuthSession, getActiveRole, ACTIVE_ROLE_EVENT } from '../services/api';
import { useApp } from '../context/AppContext';
import { TOOLS, toolText } from '../data/tools';

const NAV_T = {
  en: {
    home: 'Home',
    tools: 'AI Tools',
    aboutUs: 'About',
    contactUs: 'Contact',
    marketplace: 'Marketplace',
    myDashboard: 'My Dashboard',
    more: 'More',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    menu: 'Toggle menu',
  },
  si: {
    home: 'මුල් පිටුව',
    tools: 'AI මෙවලම්',
    aboutUs: 'අප ගැන',
    contactUs: 'සම්බන්ධ කරගන්න',
    marketplace: 'වෙළඳසැල',
    myDashboard: 'මගේ උපකරණ පුවරුව',
    more: 'තවත්',
    logout: 'ලොග් අවුට්',
    login: 'ලොගින්',
    register: 'ලියාපදිංචිය',
    toLight: 'ආලෝක ප්‍රකාරයට මාරු වන්න',
    toDark: 'අඳුරු ප්‍රකාරයට මාරු වන්න',
    menu: 'මෙනුව',
  },
  ta: {
    home: 'முகப்பு',
    tools: 'AI கருவிகள்',
    aboutUs: 'எங்களை பற்றி',
    contactUs: 'தொடர்பு',
    marketplace: 'சந்தை',
    myDashboard: 'என் டாஷ்போர்டு',
    more: 'மேலும்',
    logout: 'வெளியேறு',
    login: 'உள்நுழை',
    register: 'பதிவு செய்',
    toLight: 'ஒளி பயன்முறைக்கு மாறு',
    toDark: 'இருள் பயன்முறைக்கு மாறு',
    menu: 'பட்டி',
  },
};

const LANGS = [['en', 'EN'], ['si', 'සිං'], ['ta', 'தமி']];
const DASHBOARDS = { 'Land Owner': '/landowner/dashboard', Trader: '/trader/dashboard', Admin: '/admin/dashboard' };

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, theme, toggleTheme } = useApp();
  const { user } = getAuthSession();
  const isSignedIn = Boolean(user);
  const activeRole = getActiveRole();
  const [, setRoleVersion] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef(null);

  // Re-render when the active role is switched elsewhere (e.g. the Marketplace role toggle).
  useEffect(() => {
    const onRoleChange = () => setRoleVersion(v => v + 1);
    window.addEventListener(ACTIVE_ROLE_EVENT, onRoleChange);
    return () => window.removeEventListener(ACTIVE_ROLE_EVENT, onRoleChange);
  }, []);

  // Any navigation closes both menus.
  useEffect(() => { setMenuOpen(false); setToolsOpen(false); }, [location.pathname]);

  // The tools menu also closes on Escape and on a click outside it.
  useEffect(() => {
    if (!toolsOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setToolsOpen(false); };
    const onDown = (e) => { if (!toolsRef.current?.contains(e.target)) setToolsOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [toolsOpen]);

  const t = NAV_T[lang] || NAV_T.en;
  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));
  const onTool = TOOLS.some(tool => isActive(tool.path));
  const dashboard = isSignedIn ? DASHBOARDS[activeRole] : null;
  const inDashboard = ['/landowner', '/trader', '/admin'].some(p => location.pathname.startsWith(p));
  const linkClass = (path) => `snav__link${isActive(path) ? ' snav__link--on' : ''}`;

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true });
    setMenuOpen(false);
  };

  const toolLinks = TOOLS.map(tool => {
    const text = toolText(tool, lang);
    return (
      <Link key={tool.key} to={tool.path} data-tour={tool.tour}
        className={`snav__tool tu-tone-${tool.tone}${isActive(tool.path) ? ' snav__tool--on' : ''}`}>
        <span className="tu-ic"><tool.Icon size={22} /></span>
        <span><b>{text.name}</b><small>{text.desc}</small></span>
      </Link>
    );
  });

  const langSwitch = (
    <div className="snav__lang" data-tour="nav-lang">
      {LANGS.map(([code, label]) => (
        <button key={code} type="button" className={lang === code ? 'on' : ''} onClick={() => setLang(code)}>{label}</button>
      ))}
    </div>
  );

  const themeButton = (
    <button className="snav__icon" type="button" onClick={toggleTheme} data-tour="nav-theme"
      title={theme === 'dark' ? t.toLight : t.toDark} aria-label={theme === 'dark' ? t.toLight : t.toDark}>
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  const session = isSignedIn && (
    <span className="snav__user">
      {user.profile_image
        ? <img src={user.profile_image} alt="" />
        : <span className="snav__avatar">{user.full_name.charAt(0).toUpperCase()}</span>}
      <span>{user.full_name.split(' ')[0]}<small>{activeRole}</small></span>
    </span>
  );

  const authButtons = isSignedIn ? (
    <button className="snav__btn" type="button" onClick={handleLogout}><LogOut size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} />{t.logout}</button>
  ) : (
    <>
      <Link className="snav__btn" to="/login">{t.login}</Link>
      <Link className="snav__btn snav__btn--gold" to="/register" data-tour="nav-register">{t.register}</Link>
    </>
  );

  return (
    <header className="snav">
      <div className="snav__in">
        <Link className="snav__brand" to="/" data-tour="nav-home">
          <span className="snav__mark"><Leaf size={20} /></span>
          <span>Smart<em>Agri</em></span>
        </Link>

        <nav className="snav__links">
          <Link to="/" className={linkClass('/')}>{t.home}</Link>
          <div className="snav__tools" ref={toolsRef} data-open={toolsOpen}
            onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
            <button type="button" className={`snav__link${onTool || toolsOpen ? ' snav__link--tools' : ''}`} data-tour="nav-tools"
              aria-haspopup="true" aria-expanded={toolsOpen} onClick={() => setToolsOpen(o => !o)}>
              <LayoutGrid size={16} />{t.tools}<ChevronDown className="snav__chev" size={14} />
            </button>
            <div className="snav__mega">{toolLinks}</div>
          </div>
          <Link to="/marketplace" className={linkClass('/marketplace')} data-tour="nav-marketplace">{t.marketplace}</Link>
          <Link to="/about" className={linkClass('/about')} data-tour="nav-about">{t.aboutUs}</Link>
          <Link to="/contact" className={linkClass('/contact')} data-tour="nav-contact">{t.contactUs}</Link>
          {dashboard && (
            <Link to={dashboard} className="snav__link snav__link--dash"><LayoutDashboard size={16} />{t.myDashboard}</Link>
          )}
        </nav>

        <span className="snav__sp" />

        <div className="snav__ctl">
          {langSwitch}
          {themeButton}
          {/* Dashboards show the user and logout in their own sidebar. */}
          {!inDashboard && session}
          {!(isSignedIn && inDashboard) && authButtons}
          <button className="snav__icon snav__burger" type="button" aria-label={t.menu} aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Below the collapse width the links, language, theme and account controls
          all move into this panel, so nothing becomes unreachable on a phone. */}
      {menuOpen && (
        <div className="snav__panel">
          <h6>{t.tools}</h6>
          {toolLinks}
          <h6>{t.more}</h6>
          <Link to="/" className={linkClass('/')}>{t.home}</Link>
          <Link to="/marketplace" className={linkClass('/marketplace')}>{t.marketplace}</Link>
          <Link to="/about" className={linkClass('/about')}>{t.aboutUs}</Link>
          <Link to="/contact" className={linkClass('/contact')}>{t.contactUs}</Link>
          {dashboard && (
            <Link to={dashboard} className="snav__link snav__link--dash"><LayoutDashboard size={16} />{t.myDashboard}</Link>
          )}
          <div className="snav__panel-row">{langSwitch}{themeButton}{session}</div>
          <div className="snav__panel-row">{authButtons}</div>
        </div>
      )}
    </header>
  );
}
