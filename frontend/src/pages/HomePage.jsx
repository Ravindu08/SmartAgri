import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import { fetchBackendHealth } from '../services/api';
import { useApp } from '../context/AppContext';

function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const HOME_T = {
  en: {
    badge: 'AI-POWERED AGRICULTURE',
    titleLine1: 'Empowering Farmers.',
    titleLine2: 'Enriching ',
    highlight: 'Future.',
    desc: 'SmartAgri brings AI and data together to help you make smarter decisions, increase productivity, and grow sustainably.',
    connected: '✅ Platform Ready — all AI tools are live',
    offline: '⚠️ Some features may be temporarily unavailable',
    checking: '⏳ Loading...',
    btnMarket: 'Explore Marketplace →',
    btnDemo: 'Request a Demo →',
    cardSoilLabel: 'Soil Health Score', cardSoilStatus: '● Healthy',
    cardWeatherLabel: 'Weather Forecast', cardWeatherVal: '28°C', cardWeatherStatus: 'Partly Cloudy',
    cardCropLabel: 'Crop Recommendation', cardCropVal: 'High Yield', cardCropStatus: 'Maize',
    aboutLabel: 'ABOUT SMARTAGRI',
    aboutTitle: 'Technology that grows\nwith your farm',
    aboutDesc: 'SmartAgri is an intelligent platform designed to support farmers and land owners with real-time insights, AI-driven recommendations, and a trusted marketplace.',
    aboutLink: 'Learn more about us →',
    featLabel: 'OUR FEATURES',
    features: [
      { title: 'AI Crop Intelligence', description: 'Get AI-powered crop recommendations and insights tailored to your land.', icon: '🤖' },
      { title: 'Smart Farm Insights', description: 'Real-time data on weather, soil health, and farm metrics in one dashboard.', icon: '📊' },
      { title: 'Trusted Marketplace', description: 'Buy, sell, and connect with trusted traders and land owners easily.', icon: '🏪' },
    ],
    statsLabel: 'BY THE NUMBERS',
    statsTitle: 'Built to make a real impact',
    stats: [
      { num: '3',   suffix: '',  label: 'Languages Supported' },
      { num: '4',   suffix: '',  label: 'AI-Powered Tools' },
      { num: '25',  suffix: '+', label: 'Districts Covered' },
      { num: '41',  suffix: '+', label: 'Crops Supported' },
    ],
    howLabel: 'HOW IT WORKS',
    howTitle: 'Start farming smarter in four steps',
    howSub: 'From sign-up to AI-powered insight in minutes — no technical expertise needed.',
    steps: [
      { num: '01', icon: '👤', title: 'Create Account',        desc: 'Register for free and set up your farmer or land owner profile in under 2 minutes.' },
      { num: '02', icon: '🌍', title: 'Enter Farm Details',    desc: 'Input your soil type, district, season, and farming conditions to personalise results.' },
      { num: '03', icon: '🤖', title: 'Get AI Analysis',       desc: 'Receive crop recommendations, step-by-step guidance, yield forecasts, and weather advice.' },
      { num: '04', icon: '✅', title: 'Make Smart Decisions',  desc: 'Plan your entire farming season with confidence using data-driven, real-time insights.' },
    ],
    toolsLabel: 'AI TOOLS',
    toolsTitle: 'Four tools for every stage of farming',
    toolsSub: 'Each tool is specifically designed for Sri Lankan agro-ecological conditions.',
    tools: [
      { icon: '🌱', title: 'Crop Recommendation', desc: 'Get the best crop suggestion for your land using soil data, climate, and season inputs.',     link: '/crop-recommendation', cta: 'Try Crop Rec →',   color: 'green'  },
      { icon: '📋', title: 'Crop Guidance',        desc: 'Follow a complete farming plan — fertilisation, irrigation, pest control, and harvest tips.',  link: '/crop-guidance',       cta: 'Get Guidance →', color: 'blue'   },
      { icon: '📊', title: 'Yield & Price',         desc: 'Estimate your expected harvest and calculate production costs, selling price, and profit.',    link: '/yield-price',         cta: 'Estimate Yield →',color: 'purple' },
      { icon: '🌤️', title: 'Weather Advice',        desc: 'Live weather data for Sri Lankan districts with farming-specific alerts and forecasts.',       link: '/wx',                  cta: 'Check Weather →', color: 'orange' },
    ],
    ctaTitle: 'Ready to farm smarter?',
    ctaSub: 'Join farmers across Sri Lanka using AI to reduce losses and maximise harvests.',
    ctaBtn1: 'Get Started Free →',
    ctaBtn2: 'Request a Demo →',
  },
  si: {
    badge: 'AI-ශක්‍ය ගොවිතැන',
    titleLine1: 'ගොවීන් සවිබල ගැන්වීම.',
    titleLine2: 'අනාගතය ',
    highlight: 'පොහොසත් කිරීම.',
    desc: 'SmartAgri AI සහ දත්ත එකතු කරන්නේ ඔබට ස්මාර්ට් තීරණ ගැනීමට, නිෂ්පාදිතය වැඩිකිරීමට, සහ තිරසාරව ගොවිකිරීමට සහාය දීමටය.',
    connected: '✅ වේදිකාව සූදානම් — සියලු AI මෙවලම් සක්‍රියයි',
    offline: '⚠️ සමහර විශේෂාංග තාවකාලිකව නොමැත',
    checking: '⏳ පූරණය කරමින්...',
    btnMarket: 'වෙළඳසැල ගවේෂණය →',
    btnDemo: 'ආදර්ශනයක් ඉල්ලන්න →',
    cardSoilLabel: 'ඉඩම් සෞඛ්‍ය ලකුණු', cardSoilStatus: '● සෞඛ්‍ය සම්පන්නය',
    cardWeatherLabel: 'කාලගුණ අනාවැකිය', cardWeatherVal: '28°C', cardWeatherStatus: 'අර්ධ වලාකුළු',
    cardCropLabel: 'බෝග නිර්දේශ', cardCropVal: 'ඉහළ අස්වැන්න', cardCropStatus: 'ඉරිඟු',
    aboutLabel: 'SMARTAGRI ගැන',
    aboutTitle: 'ඔබේ ගොවිපළ සමඟ\nවර්ධනය වන තාක්ෂණය',
    aboutDesc: 'SmartAgri යනු ගොවීන් සහ ඉඩම් හිමිකරුවන් සඳහා සැබෑකාලීන විශ්ලේෂණ, AI-ධාවිත නිර්දේශ, සහ විශ්වාසනීය වෙළඳසැලක් සපයන බුද්ධිමත් වේදිකාවකි.',
    aboutLink: 'අප ගැන තවත් දැනගන්න →',
    featLabel: 'අපගේ විශේෂාංග',
    features: [
      { title: 'AI බෝග බුද්ධිය', description: 'ඔබේ ඉඩමට ගැලපෙන AI-ශක්‍ය බෝග නිර්දේශ ලබාගන්න.', icon: '🤖' },
      { title: 'ස්මාර්ට් ගොවිපළ විශ්ලේෂණ', description: 'කාලගුණය, ඉඩම් සෞඛ්‍ය, සහ ගොවිපළ ප්‍රමාණ සඳහා සැබෑකාලීන දත්ත.', icon: '📊' },
      { title: 'විශ්වාසනීය වෙළඳසැල', description: 'විශ්වාසනීය ව්‍යාපාරිකයන් සහ ඉඩම් හිමිකරුවන් සමඟ ගනු දෙනු කරන්න.', icon: '🏪' },
    ],
    statsLabel: 'සංඛ්‍යා',
    statsTitle: 'සැබෑ බලපෑමක් ඇති කිරීමට',
    stats: [
      { num: '3',   suffix: '',  label: 'භාෂා සහාය' },
      { num: '4',   suffix: '',  label: 'AI-ශක්‍ය මෙවලම්' },
      { num: '25',  suffix: '+', label: 'දිස්ත්‍රික්ක ආවරණය' },
      { num: '41',  suffix: '+', label: 'සහිත බෝග' },
    ],
    howLabel: 'ක්‍රියා කරන ආකාරය',
    howTitle: 'සිව් පියවරකින් ස්මාර්ට් ගොවිකිරීම',
    howSub: 'ලියාපදිංචියේ සිට AI-ශක්‍ය විශ්ලේෂණ දක්වා — කිසිදු තාක්ෂණික දැනුමක් අවශ්‍ය නොවේ.',
    steps: [
      { num: '01', icon: '👤', title: 'ගිණුම සාදන්න',         desc: 'ගොවියෙකු ලෙස නොමිලේ ලියාපදිංචි වී ඔබේ ගොවිපළ ගිණුම 2 මිනිත්තුවකින් සකසන්න.' },
      { num: '02', icon: '🌍', title: 'ගොවිපළ විස්තර ඇතුළු', desc: 'ඔබේ පාංශු වර්ගය, දිස්ත්‍රික්කය, කන්නය, සහ ගොවිතැන් කොන්දේසි ඇතුළු කරන්න.' },
      { num: '03', icon: '🤖', title: 'AI විශ්ලේෂණ ලබාගන්න',  desc: 'බෝග නිර්දේශ, ක්‍රමවත් මාර්ගෝපදේශ, අස්වැන්න අනාවැකි, සහ කාලගුණ උපදෙස් ලබාගන්න.' },
      { num: '04', icon: '✅', title: 'ස්මාර්ට් තීරණ',        desc: 'දත්ත-ධාවිත, සැබෑකාලීන විශ්ලේෂණ භාවිතා කර ඔබේ ගොවිකිරීමේ කාලය සැලසුම් කරන්න.' },
    ],
    toolsLabel: 'AI මෙවලම්',
    toolsTitle: 'ගොවිකිරීමේ සෑම අදියරකටම මෙවලම් හතරක්',
    toolsSub: 'සෑම මෙවලමක්ම ශ්‍රී ලාංකික කෘෂි-පාරිසරික කොන්දේසි සඳහා සැලසුම් කර ඇත.',
    tools: [
      { icon: '🌱', title: 'බෝග නිර්දේශ',    desc: 'පාංශු දත්ත, කාලගුණය, සහ කන්නය භාවිතා කර ඔබේ ඉඩමට හොඳම බෝගය ලබාගන්න.',     link: '/crop-recommendation', cta: 'නිර්දේශය →', color: 'green'  },
      { icon: '📋', title: 'බෝග මාර්ගෝපදේශ', desc: 'පොහොරු, ජලය, රෝග, සහ අස්වනු නෙළීමේ ඉඟි සහිත සම්පූර්ණ ගොවිතැන් සැලැස්ම.',    link: '/crop-guidance',       cta: 'මාර්ගෝපදේශ →', color: 'blue'   },
      { icon: '📊', title: 'අස්වැන්න සහ මිල', desc: 'නිෂ්පාදන පිරිවැය, විකිණීමේ මිල, සහ ලාභය ගණනය කරමින් ඔබේ අස්වැන්න ගණනය කරන්න.', link: '/yield-price',         cta: 'ගණනය →',     color: 'purple' },
      { icon: '🌤️', title: 'කාලගුණ උපදෙස්',  desc: 'ශ්‍රී ලාංකික දිස්ත්‍රික්ක සඳහා සජීවී කාලගුණ දත්ත සහ ගොවිතැනට ආදාල ඇඟවීම්.',   link: '/wx',                  cta: 'කාලගුණය →', color: 'orange' },
    ],
    ctaTitle: 'ස්මාර්ට් ගොවිකිරීමට සූදානම්ද?',
    ctaSub: 'ශ්‍රී ලංකාව පුරා ගොවීන් AI භාවිතා කර අස්වනු වැඩිකරගනිති.',
    ctaBtn1: 'නොමිලේ ලියාපදිංචි →',
    ctaBtn2: 'ආදර්ශනයක් ඉල්ලන්න →',
  },
  ta: {
    badge: 'AI-இயக்கப்படும் வேளாண்மை',
    titleLine1: 'விவசாயிகளை வலுப்படுத்துவோம்.',
    titleLine2: 'எதிர்காலத்தை ',
    highlight: 'வளர்ப்போம்.',
    desc: 'SmartAgri AI மற்றும் தரவை ஒருங்கிணைத்து, சிறந்த முடிவுகள் எடுக்கவும், உற்பத்தித்திறனை அதிகரிக்கவும், நிலையான விவசாயம் செய்யவும் உதவுகிறது.',
    connected: '✅ தளம் தயார் — அனைத்து AI கருவிகளும் இயங்குகின்றன',
    offline: '⚠️ சில அம்சங்கள் தற்காலிகமாக இல்லை',
    checking: '⏳ ஏற்றுகிறது...',
    btnMarket: 'சந்தையை ஆராயுங்கள் →',
    btnDemo: 'டெமோ கோருங்கள் →',
    cardSoilLabel: 'மண் ஆரோக்கிய மதிப்பெண்', cardSoilStatus: '● ஆரோக்கியமானது',
    cardWeatherLabel: 'வானிலை முன்னறிவிப்பு', cardWeatherVal: '28°C', cardWeatherStatus: 'பகுதியளவு மேகம்',
    cardCropLabel: 'பயிர் பரிந்துரை', cardCropVal: 'அதிக விளைச்சல்', cardCropStatus: 'மக்காச்சோளம்',
    aboutLabel: 'SMARTAGRI பற்றி',
    aboutTitle: 'உங்கள் பண்ணையுடன்\nவளரும் தொழில்நுட்பம்',
    aboutDesc: 'SmartAgri என்பது விவசாயிகளுக்கும் நில உரிமையாளர்களுக்கும் நிகழ்நேர தகவல்கள், AI பரிந்துரைகள் மற்றும் நம்பகமான சந்தையை வழங்கும் ஒரு புத்திசாலி தளம்.',
    aboutLink: 'எங்களை பற்றி மேலும் அறிக →',
    featLabel: 'எங்கள் அம்சங்கள்',
    features: [
      { title: 'AI பயிர் அறிவு', description: 'உங்கள் நிலத்திற்கு ஏற்ற AI பயிர் பரிந்துரைகளைப் பெறுங்கள்.', icon: '🤖' },
      { title: 'ஸ்மார்ட் பண்ணை நுண்ணறிவு', description: 'வானிலை, மண் ஆரோக்கியம் மற்றும் பண்ணை அளவீடுகள் பற்றிய நிகழ்நேர தரவு.', icon: '📊' },
      { title: 'நம்பகமான சந்தை', description: 'நம்பகமான வணிகர்கள் மற்றும் நில உரிமையாளர்களுடன் வாங்கவும் விற்கவும்.', icon: '🏪' },
    ],
    statsLabel: 'எண்களில்',
    statsTitle: 'உண்மையான தாக்கத்தை ஏற்படுத்த',
    stats: [
      { num: '3',   suffix: '',  label: 'மொழிகள் ஆதரிக்கப்படுகின்றன' },
      { num: '4',   suffix: '',  label: 'AI கருவிகள்' },
      { num: '25',  suffix: '+', label: 'மாவட்டங்கள் உள்ளடக்கப்பட்டன' },
      { num: '41',  suffix: '+', label: 'பயிர்கள் ஆதரிக்கப்படுகின்றன' },
    ],
    howLabel: 'எப்படி செயல்படுகிறது',
    howTitle: 'நான்கு படிகளில் ஸ்மார்ட் விவசாயம்',
    howSub: 'பதிவு செய்வதில் இருந்து AI நுண்ணறிவு வரை — தொழில்நுட்ப அறிவு தேவையில்லை.',
    steps: [
      { num: '01', icon: '👤', title: 'கணக்கு உருவாக்கு',    desc: 'இலவசமாக பதிவு செய்து உங்கள் விவசாயி சுயவிவரத்தை 2 நிமிடங்களில் அமையுங்கள்.' },
      { num: '02', icon: '🌍', title: 'பண்ணை விவரங்கள்',     desc: 'மண் வகை, மாவட்டம், பருவகாலம் மற்றும் விவசாய நிலைமைகளை உள்ளிடுங்கள்.' },
      { num: '03', icon: '🤖', title: 'AI பகுப்பாய்வு பெறு', desc: 'பயிர் பரிந்துரைகள், வழிகாட்டுதல், மகசூல் முன்னறிவிப்புகள் மற்றும் வானிலை ஆலோசனை பெறுங்கள்.' },
      { num: '04', icon: '✅', title: 'சிறந்த முடிவுகள்',    desc: 'தரவு-இயக்கப்படும் நிகழ்நேர நுண்ணறிவைப் பயன்படுத்தி உங்கள் பருவத்தை திட்டமிடுங்கள்.' },
    ],
    toolsLabel: 'AI கருவிகள்',
    toolsTitle: 'விவசாயத்தின் ஒவ்வொரு கட்டத்திற்கும் நான்கு கருவிகள்',
    toolsSub: 'ஒவ்வொரு கருவியும் இலங்கை வேளாண்-சுற்றுச்சூழல் நிலைமைகளுக்காக வடிவமைக்கப்பட்டது.',
    tools: [
      { icon: '🌱', title: 'பயிர் பரிந்துரை', desc: 'மண் தரவு, காலநிலை மற்றும் பருவகாலம் பயன்படுத்தி சிறந்த பயிர் பரிந்துரையைப் பெறுங்கள்.', link: '/crop-recommendation', cta: 'பரிந்துரை →',  color: 'green'  },
      { icon: '📋', title: 'பயிர் வழிகாட்டி', desc: 'உரம், நீர், நோய் மற்றும் அறுவடை குறிப்புகளுடன் முழுமையான விவசாய திட்டம்.',                link: '/crop-guidance',       cta: 'வழிகாட்டல் →', color: 'blue'   },
      { icon: '📊', title: 'மகசூல் & விலை',   desc: 'உற்பத்தி செலவு, விற்பனை விலை மற்றும் லாபத்தை கணக்கிட்டு மகசூலை மதிப்பிடுங்கள்.',          link: '/yield-price',         cta: 'மதிப்பிடு →', color: 'purple' },
      { icon: '🌤️', title: 'வானிலை ஆலோசனை', desc: 'இலங்கை மாவட்டங்களுக்கான நேரடி வானிலை தரவு மற்றும் விவசாய எச்சரிக்கைகள்.',                   link: '/wx',                  cta: 'வானிலை →',   color: 'orange' },
    ],
    ctaTitle: 'ஸ்மார்ட் விவசாயத்திற்கு தயாரா?',
    ctaSub: 'இலங்கை முழுவதும் விவசாயிகள் AI பயன்படுத்தி மகசூலை அதிகரிக்கிறார்கள்.',
    ctaBtn1: 'இலவசமாக தொடங்கு →',
    ctaBtn2: 'டெமோ கோருங்கள் →',
  },
};

function StatCardAnimated({ num, suffix, label, delay, inView }) {
  const target = parseInt(num, 10);
  const animated = useCountUp(target, 1600, inView);
  return (
    <div className="home-stat-card" style={{ animationDelay: delay }}>
      <div className="home-stat-num">{animated}<span className="home-stat-suffix">{suffix}</span></div>
      <div className="home-stat-label">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { lang } = useApp();
  const t = HOME_T[lang] || HOME_T.en;
  const [connectionState, setConnectionState] = useState('checking');
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendHealth()
      .then(() => { if (isMounted) setConnectionState('connected'); })
      .catch(() => { if (isMounted) setConnectionState('offline'); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal--visible');
          if (e.target === statsRef.current) setStatsInView(true);
        }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="home-page">

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__overlay" />
        <div className="home-hero__content">
          <div className="home-hero__badge">🤖 {t.badge}</div>
          <h1 className="home-hero__title">
            {t.titleLine1}<br />
            {t.titleLine2}<span className="home-hero__highlight">{t.highlight}</span>
          </h1>
          <p className="home-hero__text">{t.desc}</p>
          <div className={`connection-badge connection-badge--${connectionState}`}>
            {connectionState === 'connected' ? t.connected
             : connectionState === 'offline'   ? t.offline
             : t.checking}
          </div>
          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" to="/marketplace">{t.btnMarket}</Link>
            <Link className="home-btn home-btn--outline" to="/contact">{t.btnDemo}</Link>
          </div>
        </div>
        <div className="home-hero__cards">
          <div className="home-float-card">
            <div className="home-float-card__icon home-float-card__icon--green">🌱</div>
            <div>
              <div className="home-float-card__label">{t.cardSoilLabel}</div>
              <div className="home-float-card__value">82<span>/100</span></div>
              <div className="home-float-card__status">{t.cardSoilStatus}</div>
            </div>
          </div>
          <div className="home-float-card">
            <div className="home-float-card__icon home-float-card__icon--blue">🌤️</div>
            <div>
              <div className="home-float-card__label">{t.cardWeatherLabel}</div>
              <div className="home-float-card__value">{t.cardWeatherVal}</div>
              <div className="home-float-card__status">{t.cardWeatherStatus}</div>
            </div>
          </div>
          <div className="home-float-card">
            <div className="home-float-card__icon home-float-card__icon--yellow">🌾</div>
            <div>
              <div className="home-float-card__label">{t.cardCropLabel}</div>
              <div className="home-float-card__value">{t.cardCropVal}</div>
              <div className="home-float-card__status">{t.cardCropStatus}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About strip ── */}
      <section className="home-about reveal">
        <div className="home-about__left">
          <p className="section__label">{t.aboutLabel}</p>
          <h2>{t.aboutTitle.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</h2>
          <p>{t.aboutDesc}</p>
          <Link className="home-about__link" to="/about">{t.aboutLink}</Link>
        </div>
        <div className="home-about__right">
          <p className="section__label">{t.featLabel}</p>
          <div className="home-features-grid">
            {t.features.map(f => <FeatureCard key={f.icon} title={f.title} description={f.description} icon={f.icon} />)}
          </div>
        </div>
      </section>

      {/* ── Stats ribbon ── */}
      <section className="home-stats reveal" ref={statsRef}>
        <div className="home-stats-inner">
          <p className="section__label home-stats-label">{t.statsLabel}</p>
          <h2 className="home-stats-title">{t.statsTitle}</h2>
          <div className="home-stats-grid">
            {t.stats.map((s, i) => (
              <StatCardAnimated key={i} num={s.num} suffix={s.suffix} label={s.label} delay={`${i * 0.1}s`} inView={statsInView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="home-how reveal">
        <div className="home-how-inner">
          <div className="home-how-header">
            <p className="section__label">{t.howLabel}</p>
            <h2 className="home-how-title">{t.howTitle}</h2>
            <p className="home-how-sub">{t.howSub}</p>
          </div>
          <div className="home-how-steps">
            {t.steps.map((step, i) => (
              <div key={i} className="home-how-step" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="home-how-step-bubble">{step.num}</div>
                <div className="home-how-step-icon">{step.icon}</div>
                <h3 className="home-how-step-title">{step.title}</h3>
                <p className="home-how-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Tools showcase ── */}
      <section className="home-tools reveal">
        <div className="home-tools-inner">
          <div className="home-tools-header">
            <p className="section__label">{t.toolsLabel}</p>
            <h2 className="home-tools-title">{t.toolsTitle}</h2>
            <p className="home-tools-sub">{t.toolsSub}</p>
          </div>
          <div className="home-tools-grid">
            {t.tools.map((tool, i) => (
              <div key={i} className={`home-tool-card home-tool-card--${tool.color}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="home-tool-icon">{tool.icon}</div>
                <h3 className="home-tool-title">{tool.title}</h3>
                <p className="home-tool-desc">{tool.desc}</p>
                <Link className="home-tool-cta" to={tool.link}>{tool.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="home-cta">
        <div className="home-cta-glow" />
        <div className="home-cta-inner">
          <h2 className="home-cta-title">{t.ctaTitle}</h2>
          <p className="home-cta-sub">{t.ctaSub}</p>
          <div className="home-cta-actions">
            <Link className="home-btn home-btn--primary" to="/register">{t.ctaBtn1}</Link>
            <Link className="home-btn home-btn--ghost" to="/contact">{t.ctaBtn2}</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
