import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/Footer.css';

const FOOTER_T = {
  en: {
    tagline: 'AI-powered crop planning for Sri Lankan farmers.',
    quickLinks: 'Quick Links',
    contact: 'Contact',
    emailVal: 'hello@smartagri.lk',
    locationVal: 'Sri Lanka',
    projectVal: 'Serving farmers island-wide',
    copyright: '© 2026 SmartAgri. All rights reserved.',
    madeWith: 'Made with ❤️ for Sri Lankan agriculture',
    openSource: 'SmartAgri Platform',
    home: 'Home', cropRec: 'Crop Recommendation', cropGuide: 'Crop Guidance',
    yieldPrice: 'Yield & Price', weather: 'Weather', aboutUs: 'About Us', contactUs: 'Contact Us',
  },
  si: {
    tagline: 'ශ්‍රී ලාංකික ගොවීන් සඳහා AI-ශක්‍ය බෝග සැලසුම.',
    quickLinks: 'ඉක්මන් සබැඳි',
    contact: 'සම්බන්ධතා',
    emailVal: 'hello@smartagri.lk',
    locationVal: 'ශ්‍රී ලංකාව',
    projectVal: 'දිවයින පුරා ගොවීන්ට සේවය කරයි',
    copyright: '© 2026 SmartAgri. සියලු හිමිකම් ඇවිරිණි.',
    madeWith: 'ශ්‍රී ලාංකික කෘෂිකාර්මය සඳහා ❤️ සමඟ',
    openSource: 'SmartAgri වේදිකාව',
    home: 'මුල් පිටුව', cropRec: 'බෝග නිර්දේශ', cropGuide: 'බෝග මාර්ගෝපදේශ',
    yieldPrice: 'අස්වැන්න සහ මිල', weather: 'කාලගුණය', aboutUs: 'අප ගැන', contactUs: 'සම්බන්ධ කරගන්න',
  },
  ta: {
    tagline: 'இலங்கை விவசாயிகளுக்கான AI-இயக்கப்படும் பயிர் திட்டமிடல்.',
    quickLinks: 'விரைவு இணைப்புகள்',
    contact: 'தொடர்பு',
    emailVal: 'hello@smartagri.lk',
    locationVal: 'இலங்கை',
    projectVal: 'நாடு முழுவதும் விவசாயிகளுக்கு சேவை',
    copyright: '© 2026 SmartAgri. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    madeWith: 'இலங்கை வேளாண்மைக்காக ❤️ உடன்',
    openSource: 'SmartAgri தளம்',
    home: 'முகப்பு', cropRec: 'பயிர் பரிந்துரை', cropGuide: 'பயிர் வழிகாட்டி',
    yieldPrice: 'மகசூல் & விலை', weather: 'வானிலை', aboutUs: 'எங்களை பற்றி', contactUs: 'தொடர்பு',
  },
};

export default function Footer() {
  const { lang } = useApp();
  const t = FOOTER_T[lang] || FOOTER_T.en;

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">🌿</span>
            <span className="footer-logo-text">
              <span className="footer-logo-smart">Smart</span><span className="footer-logo-agri">Agri</span>
            </span>
          </Link>
          <p className="footer-tagline">{t.tagline}</p>
          <div className="footer-socials">
            <a href="https://github.com" className="footer-social-btn" target="_blank" rel="noopener noreferrer" aria-label="GitHub">GH</a>
            <a href="https://linkedin.com" className="footer-social-btn" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LI</a>
            <a href="https://twitter.com" className="footer-social-btn" target="_blank" rel="noopener noreferrer" aria-label="X/Twitter">𝕏</a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">{t.quickLinks}</h4>
          <ul className="footer-nav">
            <li><Link to="/">{t.home}</Link></li>
            <li><Link to="/crop-recommendation">{t.cropRec}</Link></li>
            <li><Link to="/crop-guidance">{t.cropGuide}</Link></li>
            <li><Link to="/yield-price">{t.yieldPrice}</Link></li>
            <li><Link to="/wx">{t.weather}</Link></li>
            <li><Link to="/about">{t.aboutUs}</Link></li>
            <li><Link to="/contact">{t.contactUs}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">{t.contact}</h4>
          <ul className="footer-contact-list">
            <li>
              <span className="footer-contact-icon">📧</span>
              <a href="mailto:hello@smartagri.lk">
                {t.emailVal.split('@').map((part, i, arr) =>
                  i < arr.length - 1 ? <span key={i}>{part}@<wbr /></span> : <span key={i}>{part}</span>
                )}
              </a>
            </li>
            <li>
              <span className="footer-contact-icon">📍</span>
              <span>{t.locationVal}</span>
            </li>
            <li>
              <span className="footer-contact-icon">🌾</span>
              <span>{t.projectVal}</span>
            </li>
            <li>
              <span className="footer-contact-icon">💻</span>
              <span>{t.openSource}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-divider" />
      <div className="footer-bottom">
        <span>{t.copyright}</span>
        <span className="footer-made-with">{t.madeWith}</span>
      </div>
    </footer>
  );
}
