import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAuthSession } from '../services/api';

const MKT_T = {
  en: {
    title: 'SmartAgri Marketplace',
    sub: 'A trusted place to connect, trade, and grow together.\nBuy, sell, and discover the best opportunities in agriculture.',
    btnBack: '← Back to Landing',
    btnLogin: 'Login to Continue →',
    comingSoon: 'Coming Soon',
    comingSoonSub: 'The SmartAgri Marketplace is under development. Soon you\'ll be able to buy and sell agricultural products, connect with traders, and access fair market prices across Sri Lanka.',
    notifyLabel: 'You\'re logged in and will be notified when the marketplace launches.',
    trust: [
      { icon: '🔒', title: 'Secure Transactions', desc: 'All trades are handled safely within the SmartAgri platform.' },
      { icon: '✅', title: 'Fair Prices', desc: 'Market-aligned pricing ensures fair deals for every farmer.' },
      { icon: '🌐', title: 'Wide Reach', desc: 'Connect with buyers and sellers across all regions of Sri Lanka.' },
    ],
    previewLabel: 'COMING SOON — SAMPLE LISTINGS',
    loginToView: 'Login to see live listings',
    previewItems: [
      { emoji: '🌾', name: 'Paddy (Samba)', price: 'Rs. 185/kg', loc: 'Anuradhapura' },
      { emoji: '🌽', name: 'Maize', price: 'Rs. 95/kg', loc: 'Polonnaruwa' },
      { emoji: '🧅', name: 'Red Onion', price: 'Rs. 210/kg', loc: 'Matale' },
    ],
  },
  si: {
    title: 'SmartAgri වෙළඳසැල',
    sub: 'සම්බන්ධ වීමට, වෙළඳාම් කිරීමට, සහ එකිනෙකා සමඟ වර්ධනය වීමට විශ්වාසනීය ස්ථානය.\nගොවිතැනෙහි හොඳම අවස්ථා සොයාගන්න.',
    btnBack: '← ආරම්භ පිටුවට',
    btnLogin: 'ලොගින් වී දිගටම →',
    comingSoon: 'ළඟදීම එයි',
    comingSoonSub: 'SmartAgri වෙළඳසැල සංවර්ධනය කෙරෙමින් ඇත. ඉක්මනින් ඔබට කෘෂිකාර්මික නිෂ්පාදන ගැනීමට, විකිණීමට, සහ ශ්‍රී ලංකාව පුරා සාධාරණ වෙළඳ මිල ලබාගත හැක.',
    notifyLabel: 'ඔබ ලොගින් වී ඇති අතර වෙළඳසැල ආරම්භ වූ විට දැනුම් දෙනු ලැබේ.',
    trust: [
      { icon: '🔒', title: 'ආරක්ෂිත ගනු දෙනු', desc: 'සියලු ගනු දෙනු SmartAgri වේදිකාව තුළ ආරක්ෂිතව සිදු කෙරේ.' },
      { icon: '✅', title: 'සාධාරණ මිල', desc: 'වෙළඳපොළ-ගැලපෙන මිළ නිර්ණය සෑම ගොවියෙකුටම සාධාරණ ගනු දෙනු සහතික කරයි.' },
      { icon: '🌐', title: 'පුළුල් ළඟාකමක්', desc: 'ශ්‍රී ලංකාවේ සියලු ප්‍රදේශ හරහා ගැනුම්කරුවන් සහ විකුණුම්කරුවන් සමඟ සම්බන්ධ වන්න.' },
    ],
    previewLabel: 'ළඟදීම — නිදර්ශන ලැයිස්තු',
    loginToView: 'සජීව ලැයිස්තු බැලීමට ලොගින් කරන්න',
    previewItems: [
      { emoji: '🌾', name: 'වී (සම්බා)', price: 'රු. 185/kg', loc: 'අනුරාධපුරය' },
      { emoji: '🌽', name: 'ඉරිඟු', price: 'රු. 95/kg', loc: 'පොළොන්නරුව' },
      { emoji: '🧅', name: 'රතු ළූනු', price: 'රු. 210/kg', loc: 'මාතලේ' },
    ],
  },
  ta: {
    title: 'SmartAgri சந்தை',
    sub: 'இணைக்க, வர்த்தகம் செய்ய, மற்றும் ஒன்றாக வளர்வதற்கான நம்பகமான இடம்.\nவேளாண்மையில் சிறந்த வாய்ப்புகளை கண்டறியுங்கள்.',
    btnBack: '← முகப்பு பக்கத்திற்கு',
    btnLogin: 'தொடர உள்நுழைக →',
    comingSoon: 'விரைவில் வருகிறது',
    comingSoonSub: 'SmartAgri சந்தை உருவாக்கப்படுகிறது. விரைவில் விவசாய பொருட்களை வாங்கவும் விற்கவும், வர்த்தகர்களுடன் இணைக்கவும், இலங்கை முழுவதும் நியாயமான சந்தை விலைகளை அணுகவும் முடியும்.',
    notifyLabel: 'நீங்கள் உள்நுழைந்துள்ளீர்கள், சந்தை தொடங்கும்போது அறிவிக்கப்படுவீர்கள்.',
    trust: [
      { icon: '🔒', title: 'பாதுகாப்பான பரிவர்த்தனைகள்', desc: 'SmartAgri தளத்தில் அனைத்து வர்த்தகங்களும் பாதுகாப்பாக கையாளப்படுகின்றன.' },
      { icon: '✅', title: 'நியாயமான விலைகள்', desc: 'சந்தை-சீரமைந்த விலை நிர்ணயம் ஒவ்வொரு விவசாயிக்கும் நியாயமான ஒப்பந்தங்களை உறுதி செய்கிறது.' },
      { icon: '🌐', title: 'பரந்த வரம்பு', desc: 'இலங்கையின் அனைத்து பகுதிகளிலும் வாங்குபவர்கள் மற்றும் விற்பவர்களுடன் இணைக்கவும்.' },
    ],
    previewLabel: 'விரைவில் — மாதிரி பட்டியல்கள்',
    loginToView: 'நேரடி பட்டியல்களை பார்க்க உள்நுழைக',
    previewItems: [
      { emoji: '🌾', name: 'நெல் (சம்பா)', price: 'ரூ. 185/kg', loc: 'அனுராதபுரம்' },
      { emoji: '🌽', name: 'மக்காச்சோளம்', price: 'ரூ. 95/kg', loc: 'பொலன்னறுவை' },
      { emoji: '🧅', name: 'சிவப்பு வெங்காயம்', price: 'ரூ. 210/kg', loc: 'மாத்தளை' },
    ],
  },
};

export default function MarketplacePage() {
  const { lang } = useApp();
  const t = MKT_T[lang] || MKT_T.en;
  const { user } = getAuthSession();
  const isLoggedIn = !!user;

  return (
    <main className="marketplace-page">
      <div className="marketplace-hero">
        <div className="marketplace-hero__illustration">🛒</div>
        <h1 className="marketplace-hero__title">{t.title}</h1>
        {isLoggedIn ? (
          <>
            <div className="marketplace-coming-soon-badge">🚧 {t.comingSoon}</div>
            <p className="marketplace-hero__sub">{t.comingSoonSub}</p>
            <div className="marketplace-logged-in-notice">
              <span>✅</span> {t.notifyLabel}
            </div>
          </>
        ) : (
          <>
            <p className="marketplace-hero__sub">
              {t.sub.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </p>
            <div className="marketplace-preview">
              <div className="marketplace-preview-label">{t.previewLabel}</div>
              <div className="marketplace-preview-grid">
                {t.previewItems.map((item, i) => (
                  <div key={i} className="marketplace-preview-card">
                    <div className="marketplace-preview-card__emoji">{item.emoji}</div>
                    <div className="marketplace-preview-card__name">{item.name}</div>
                    <div className="marketplace-preview-card__price">{item.price}</div>
                    <div className="marketplace-preview-card__loc">📍 {item.loc}</div>
                  </div>
                ))}
              </div>
              <div className="marketplace-preview-overlay">🔒 {t.loginToView}</div>
            </div>
            <div className="marketplace-actions">
              <Link className="button button--outline" to="/">{t.btnBack}</Link>
              <Link className="button button--primary" to="/login">{t.btnLogin}</Link>
            </div>
          </>
        )}
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
