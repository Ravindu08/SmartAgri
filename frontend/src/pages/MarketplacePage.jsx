import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const MKT_T = {
  en: {
    title: 'SmartAgri Marketplace',
    sub: 'A trusted place to connect, trade, and grow together.\nBuy, sell, and discover the best opportunities in agriculture.',
    btnBack: '← Back to Landing',
    btnLogin: 'Login to Continue →',
    trust: [
      { icon: '🔒', title: 'Secure Transactions', desc: 'All trades are handled safely within the SmartAgri platform.' },
      { icon: '✅', title: 'Fair Prices', desc: 'Market-aligned pricing ensures fair deals for every farmer.' },
      { icon: '🌐', title: 'Wide Reach', desc: 'Connect with buyers and sellers across all regions of Sri Lanka.' },
    ],
  },
  si: {
    title: 'SmartAgri වෙළඳසැල',
    sub: 'සම්බන්ධ වීමට, වෙළඳාම් කිරීමට, සහ එකිනෙකා සමඟ වර්ධනය වීමට විශ්වාසනීය ස්ථානය.\nගොවිතැනෙහි හොඳම අවස්ථා සොයාගන්න.',
    btnBack: '← ආරම්භ පිටුවට',
    btnLogin: 'ලොගින් වී දිගටම →',
    trust: [
      { icon: '🔒', title: 'ආරක්ෂිත ගනු දෙනු', desc: 'සියලු ගනු දෙනු SmartAgri වේදිකාව තුළ ආරක්ෂිතව සිදු කෙරේ.' },
      { icon: '✅', title: 'සාධාරණ මිල', desc: 'වෙළඳපොළ-ගැලපෙන මිළ නිර්ණය සෑම ගොවියෙකුටම සාධාරණ ගනු දෙනු සහතික කරයි.' },
      { icon: '🌐', title: 'පුළුල් ළඟාකමක්', desc: 'ශ්‍රී ලංකාවේ සියලු ප්‍රදේශ හරහා ගැනුම්කරුවන් සහ විකුණුම්කරුවන් සමඟ සම්බන්ධ වන්න.' },
    ],
  },
  ta: {
    title: 'SmartAgri சந்தை',
    sub: 'இணைக்க, வர்த்தகம் செய்ய, மற்றும் ஒன்றாக வளர்வதற்கான நம்பகமான இடம்.\nவேளாண்மையில் சிறந்த வாய்ப்புகளை கண்டறியுங்கள்.',
    btnBack: '← முகப்பு பக்கத்திற்கு',
    btnLogin: 'தொடர உள்நுழைக →',
    trust: [
      { icon: '🔒', title: 'பாதுகாப்பான பரிவர்த்தனைகள்', desc: 'SmartAgri தளத்தில் அனைத்து வர்த்தகங்களும் பாதுகாப்பாக கையாளப்படுகின்றன.' },
      { icon: '✅', title: 'நியாயமான விலைகள்', desc: 'சந்தை-சீரமைந்த விலை நிர்ணயம் ஒவ்வொரு விவசாயிக்கும் நியாயமான ஒப்பந்தங்களை உறுதி செய்கிறது.' },
      { icon: '🌐', title: 'பரந்த வரம்பு', desc: 'இலங்கையின் அனைத்து பகுதிகளிலும் வாங்குபவர்கள் மற்றும் விற்பவர்களுடன் இணைக்கவும்.' },
    ],
  },
};

export default function MarketplacePage() {
  const { lang } = useApp();
  const t = MKT_T[lang] || MKT_T.en;
  return (
    <main className="marketplace-page">
      <div className="marketplace-hero">
        <div className="marketplace-hero__illustration">🛒</div>
        <h1 className="marketplace-hero__title">{t.title}</h1>
        <p className="marketplace-hero__sub">
          {t.sub.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
        </p>
        <div className="marketplace-actions">
          <Link className="button button--outline" to="/">{t.btnBack}</Link>
          <Link className="button button--primary" to="/login">{t.btnLogin}</Link>
        </div>
        <div className="marketplace-trust-strip">
          {t.trust.map(card => (
            <div key={card.title} className="marketplace-trust-card">
              <div className="marketplace-trust-card__icon">{card.icon}</div>
              <div className="marketplace-trust-card__title">{card.title}</div>
              <div className="marketplace-trust-card__desc">{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
