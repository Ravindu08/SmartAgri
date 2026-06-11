import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';
import { getFarms } from '../services/farmService';
import { getCrops } from '../services/cropService';
import { listCultivations } from '../utils/cultivationApi';

const DASH_UI = {
  en: { home: '🏠 Home', logout: 'Logout', market: '🏪 Visit Marketplace' },
  si: { home: '🏠 මුල් පිටුව', logout: 'ලොග් අවුට්', market: '🏪 වෙළඳසැලට' },
  ta: { home: '🏠 முகப்பு', logout: 'வெளியேறு', market: '🏪 சந்தைக்கு' },
};

const DASH_ROLE_T = {
  en: {
    'Admin': {
      title: 'Admin Dashboard', summary: 'Review platform activity, users, and system operations.',
      primaryLabel: 'Open platform view',
      highlights: [
        { title: 'User oversight', description: 'Monitor registered traders and land owners across the system.' },
        { title: 'Platform control', description: 'Maintain the marketplace and administrative workflows.' },
      ],
      statLabels: { 'Total Users': 'Total Users', 'Land Owners': 'Land Owners', 'Traders': 'Traders', 'Active Listings': 'Active Listings' },
    },
    'Trader': {
      title: 'Trader Dashboard', summary: 'Manage products, trade opportunities, and marketplace activity.',
      primaryLabel: 'Open marketplace',
      highlights: [
        { title: 'Market listings', description: 'Track product listings and trading opportunities in one place.' },
        { title: 'Buyer activity', description: 'Review interest from land owners and buyers across the platform.' },
      ],
      statLabels: { 'Active Listings': 'Active Listings', 'Total Orders': 'Total Orders', 'Revenue': 'Revenue', 'Messages': 'Messages' },
    },
    'Land Owner': {
      title: 'Land Owner Dashboard', summary: 'Manage land resources, collaborations, and service requests.',
      primaryLabel: 'Browse marketplace',
      highlights: [
        { title: 'Land opportunities', description: 'Organize land access, availability, and partnership requests.' },
        { title: 'Farming support', description: 'Coordinate the services and tools that support your land use.' },
      ],
      statLabels: { 'My Farms': 'My Farms', 'My Crops': 'My Crops', 'Upcoming Harvest': 'Upcoming Harvest', 'Weather Today': 'Weather Today' },
    },
  },
  si: {
    'Admin': {
      title: 'පරිපාලක ඩැෂ්බෝඩ්', summary: 'වේදිකා ක්‍රියාකාරකම්, පරිශ්‍රීලකයන්, සහ පද්ධති කාර්යයන් සමාලෝචනය.',
      primaryLabel: 'වේදිකා දර්ශනය',
      highlights: [
        { title: 'පරිශ්‍රීලක අධීක්ෂණ', description: 'පද්ධතිය හරහා ලියාපදිංචි ව්‍යාපාරිකයන් සහ ඉඩම් හිමිකරුවන් නිරීක්ෂණය.' },
        { title: 'වේදිකා පාලනය', description: 'වෙළඳසැල සහ පරිපාලන කාර්ය ධාරාවන් පවත්වාගෙන යන්න.' },
      ],
      statLabels: { 'Total Users': 'සම්පූර්ණ පරිශ්‍රීලකයන්', 'Land Owners': 'ඉඩම් හිමිකරුවන්', 'Traders': 'ව්‍යාපාරිකයන්', 'Active Listings': 'ක්‍රියාකාරී ලැයිස්තු' },
    },
    'Trader': {
      title: 'ව්‍යාපාරික ඩැෂ්බෝඩ්', summary: 'නිෂ්පාදන, වෙළඳ අවස්ථා, සහ වෙළඳසැල් ක්‍රියාකාරකම් කළමනාකරණය.',
      primaryLabel: 'වෙළඳසැල',
      highlights: [
        { title: 'වෙළඳ ලැයිස්තු', description: 'නිෂ්පාදන ලැයිස්තු සහ වෙළඳ අවස්ථා ට්‍රැක් කරන්න.' },
        { title: 'ගැනුම්කරු ක්‍රියාකාරකම', description: 'ඉඩම් හිමිකරුවන්ගෙන් සහ ගැනුම්කරුවන්ගෙන් ලැබෙන ආකර්ෂණය සමාලෝචනය.' },
      ],
      statLabels: { 'Active Listings': 'ක්‍රියාකාරී ලැයිස්තු', 'Total Orders': 'සම්පූර්ණ ඇණවුම්', 'Revenue': 'ආදායම', 'Messages': 'පණිවිඩ' },
    },
    'Land Owner': {
      title: 'ඉඩම් හිමිකරු ඩැෂ්බෝඩ්', summary: 'ඉඩම් සම්පත්, සහයෝගිතා, සහ සේවා ඉල්ලීම් කළමනාකරණය.',
      primaryLabel: 'වෙළඳසැල ගවේෂණය',
      highlights: [
        { title: 'ඉඩම් අවස්ථා', description: 'ඉඩම් ප්‍රවේශය, ලභ්‍යතාව, සහ හවුල්කාරිත්ව ඉල්ලීම් සංවිධානය.' },
        { title: 'ගොවිතැන් සහාය', description: 'ඔබේ ඉඩම් භාවිතය සහාය දෙන සේවා සහ මෙවලම් සම්බන්ධීකරණය.' },
      ],
      statLabels: { 'My Farms': 'මගේ ගොවිපළ', 'My Crops': 'මගේ බෝග', 'Upcoming Harvest': 'ළඟ අස්වැන්න', 'Weather Today': 'අද කාලගුණය' },
    },
  },
  ta: {
    'Admin': {
      title: 'நிர்வாக டாஷ்போர்டு', summary: 'தள செயல்பாடு, பயனர்கள் மற்றும் கணினி செயல்பாடுகளை மதிப்பாய்வு செய்யவும்.',
      primaryLabel: 'தள காட்சி',
      highlights: [
        { title: 'பயனர் கண்காணிப்பு', description: 'கணினி முழுவதும் பதிவு செய்யப்பட்ட வணிகர்கள் மற்றும் நில உரிமையாளர்களை கண்காணிக்கவும்.' },
        { title: 'தள கட்டுப்பாடு', description: 'சந்தை மற்றும் நிர்வாக செயல்பாட்டு வழிமுறைகளை பராமரிக்கவும்.' },
      ],
      statLabels: { 'Total Users': 'மொத்த பயனர்கள்', 'Land Owners': 'நில உரிமையாளர்கள்', 'Traders': 'வணிகர்கள்', 'Active Listings': 'செயலில் உள்ள பட்டியல்கள்' },
    },
    'Trader': {
      title: 'வணிகர் டாஷ்போர்டு', summary: 'தயாரிப்புகள், வர்த்தக வாய்ப்புகள் மற்றும் சந்தை செயல்பாடுகளை நிர்வகிக்கவும்.',
      primaryLabel: 'சந்தை',
      highlights: [
        { title: 'சந்தை பட்டியல்கள்', description: 'தயாரிப்பு பட்டியல்கள் மற்றும் வர்த்தக வாய்ப்புகளை கண்காணிக்கவும்.' },
        { title: 'வாங்குபவர் செயல்பாடு', description: 'நில உரிமையாளர்கள் மற்றும் வாங்குபவர்களிடமிருந்து வரும் ஆர்வத்தை மதிப்பாய்வு செய்யவும்.' },
      ],
      statLabels: { 'Active Listings': 'செயலில் உள்ள பட்டியல்கள்', 'Total Orders': 'மொத்த ஆர்டர்கள்', 'Revenue': 'வருவாய்', 'Messages': 'செய்திகள்' },
    },
    'Land Owner': {
      title: 'நில உரிமையாளர் டாஷ்போர்டு', summary: 'நில வளங்கள், ஒத்துழைப்புகள் மற்றும் சேவை கோரிக்கைகளை நிர்வகிக்கவும்.',
      primaryLabel: 'சந்தையில் உலாவுக',
      highlights: [
        { title: 'நில வாய்ப்புகள்', description: 'நில அணுகல், கிடைக்கும் தன்மை மற்றும் கூட்டாண்மை கோரிக்கைகளை ஒழுங்கமைக்கவும்.' },
        { title: 'விவசாய ஆதரவு', description: 'உங்கள் நில பயன்பாட்டை ஆதரிக்கும் சேவைகள் மற்றும் கருவிகளை ஒருங்கிணைக்கவும்.' },
      ],
      statLabels: { 'My Farms': 'என் பண்ணைகள்', 'My Crops': 'என் பயிர்கள்', 'Upcoming Harvest': 'வரவிருக்கும் அறுவடை', 'Weather Today': 'இன்றைய வானிலை' },
    },
  },
};

export default function DashboardPage({ primaryLink, role, stats = [] }) {
  const navigate = useNavigate();
  const { lang } = useApp();
  const session = getAuthSession();
  const userName = session.user?.full_name || 'SmartAgri user';
  const userId   = session.user?.id ? String(session.user.id) : null;

  const [liveStats,          setLiveStats]          = useState(null);
  const [activeCultivations, setActiveCultivations] = useState([]);

  useEffect(() => {
    if (role !== 'Land Owner' || !userId) return;
    Promise.all([
      getFarms().catch(() => []),
      getCrops().catch(() => []),
      listCultivations(userId).catch(() => ({ sessions: [] })),
    ]).then(([farms, crops, cultData]) => {
      const now   = new Date();
      const in30  = new Date(now.getTime() + 30 * 86400000);
      const upcomingCount = crops.filter(c => {
        const d = new Date(c.expected_harvest_date);
        return d >= now && d <= in30;
      }).length;
      setLiveStats([
        { icon: '🌾', label: 'My Farms',         value: String(farms.length)  },
        { icon: '🌱', label: 'My Crops',         value: String(crops.length)  },
        { icon: '🧺', label: 'Upcoming Harvest', value: String(upcomingCount) },
        { icon: '🌤️', label: 'Weather Today',    value: '—'                   },
      ]);
      setActiveCultivations((cultData.sessions || []).filter(s => s.status === 'active'));
    });
  }, [role, userId]);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true });
  };

  const ui = DASH_UI[lang] || DASH_UI.en;
  const roleContent = (DASH_ROLE_T[lang] || DASH_ROLE_T.en)[role] || (DASH_ROLE_T.en)[role] || {};
  const { title, summary, primaryLabel, highlights = [], statLabels = {} } = roleContent;
  const roleIcon = role === 'Admin' ? '🛡️' : role === 'Land Owner' ? '🌾' : '📦';

  return (
    <main className="dashboard-page">
      <section className="dash-card">
        <div className="dash-card__topbar">
          <div className="dash-card__identity">
            <div className="dash-card__avatar">{userName.charAt(0).toUpperCase()}</div>
            <div>
              <div className="dash-card__role">{roleIcon} {role}</div>
              <div className="dash-card__user">{userName}</div>
            </div>
          </div>
          <div className="dash-card__actions">
            <Link className="button button--outline" to="/">{ui.home}</Link>
            <button className="button button--danger" type="button" onClick={handleLogout}>{ui.logout}</button>
          </div>
        </div>

        <div className="dash-card__header">
          <h1>{title}</h1>
          <p>{summary}</p>
        </div>

        {(liveStats || stats).length > 0 && (
          <div className="dash-stats-row">
            {(liveStats || stats).map(s => (
              <div key={s.label} className="dash-stat-tile">
                <div className="dash-stat-tile__icon">{s.icon}</div>
                <div className="dash-stat-tile__value">{s.value}</div>
                <div className="dash-stat-tile__label">{statLabels[s.label] || s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="dash-primary-actions">
          <Link className="button button--primary" to={primaryLink}>{primaryLabel} →</Link>
          <Link className="button button--outline" to="/marketplace">{ui.market}</Link>
        </div>

        <div className="dash-highlights">
          {highlights.map(item => (
            <article key={item.title} className="dash-highlight">
              <div className="dash-highlight__icon">✅</div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        {role === 'Land Owner' && activeCultivations.length > 0 && (
          <div className="dash-cultivations">
            <div className="dash-cultivations__header">
              <h2>🌱 Active Cultivations</h2>
              <Link className="button button--outline" to="/crop-guidance">View all →</Link>
            </div>
            {activeCultivations.map(cult => {
              const tasks   = Object.values(cult.tasks || {});
              const done    = tasks.filter(tk => tk.status === 'done').length;
              const pct     = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
              const elapsed = cult.planting_date
                ? Math.floor((Date.now() - new Date(cult.planting_date).getTime()) / 86400000)
                : null;
              const overdue = tasks.filter(tk =>
                tk.status !== 'done' && tk.status !== 'skipped' &&
                tk.scheduled_date < new Date().toISOString().slice(0, 10)
              ).length;
              return (
                <div key={cult.id} className="dash-cult-card">
                  <div className="dash-cult-card__header">
                    <span className="dash-cult-card__crop">{cult.crop}</span>
                    <div className="dash-cult-card__meta">
                      {elapsed !== null && <span className="dash-cult-card__day">Day {elapsed}</span>}
                      {overdue > 0 && <span className="dash-cult-card__overdue">⚠ {overdue} overdue</span>}
                    </div>
                  </div>
                  <div className="dash-cult-card__progress">
                    <div className="dash-cult-card__bar">
                      <div className="dash-cult-card__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="dash-cult-card__pct">{done}/{tasks.length} · {pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
