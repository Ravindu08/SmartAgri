import { BrowserRouter, Link, Navigate, Route, Routes, useOutletContext } from 'react-router-dom';

// ── Context ───────────────────────────────────────────────────────────────────
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';

// ── Layouts ───────────────────────────────────────────────────────────────────
import AppLayout from './components/AppLayout';
import LandOwnerLayout from './components/LandOwnerLayout';

// ── Part 2: Auth / Farm / Crop pages ─────────────────────────────────────────
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MarketplacePage from './pages/MarketplacePage';
import DashboardPage from './pages/DashboardPage';
import MyFarms from './pages/farms/MyFarms';
import AddFarm from './pages/farms/AddFarm';
import EditFarm from './pages/farms/EditFarm';
import FarmDetails from './pages/farms/FarmDetails';
import MyCrops from './pages/crops/MyCrops';
import AddCrop from './pages/crops/AddCrop';
import CropDetails from './pages/crops/CropDetails';
import MyCultivations from './pages/cultivations/MyCultivations';
import LandOwnerDashboard from './pages/landowner/LandOwnerDashboard';
import Settings from './pages/landowner/Settings';
import HelpSupport from './pages/landowner/HelpSupport';

// ── Part 1: ML / Guidance / Weather pages ────────────────────────────────────
import CropRecommendation from './pages/CropRecommendation';
import CropGuidance from './pages/CropGuidance';
import YieldPrice from './pages/YieldPrice';
import Weather from './pages/Weather';
import About from './pages/About';
import ContactPage from './pages/ContactPage';
import { T } from './data/translations';

// ── Styles ────────────────────────────────────────────────────────────────────
import './styles/globals.css';   // Design tokens (CSS variables, dark/light themes)
import './styles.css';           // Page & component styles (uses variables from globals)

// ── 404 Not Found ─────────────────────────────────────────────────────────────
const NOT_FOUND_T = {
  en: {
    title: 'Page Not Found',
    sub: "The page you're looking for doesn't exist or may have been moved. Let's get you back on track.",
    backHome: '← Back to Home',
    tryCrop: 'Try Crop Recommendation',
  },
  si: {
    title: 'පිටුව හමු නොවීය',
    sub: 'ඔබ සොයන පිටුව නොමැත හෝ මාරු කර ඇත. ආපසු නිවැරදි මාර්ගයට යමු.',
    backHome: '← මුල් පිටුවට',
    tryCrop: 'බෝග නිර්දේශ',
  },
  ta: {
    title: 'பக்கம் கிடைக்கவில்லை',
    sub: 'நீங்கள் தேடும் பக்கம் இல்லை அல்லது நகர்த்தப்பட்டிருக்கலாம். சரியான பாதையில் திரும்பி வருவோம்.',
    backHome: '← முகப்பு பக்கத்திற்கு',
    tryCrop: 'பயிர் பரிந்துரை',
  },
};

function NotFound() {
  const { lang } = useApp();
  const t = NOT_FOUND_T[lang] || NOT_FOUND_T.en;
  return (
    <div className="not-found-page">
      <div className="not-found-icon">🌾</div>
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">{t.title}</h1>
      <p className="not-found-sub">{t.sub}</p>
      <div className="not-found-actions">
        <Link to="/" className="not-found-btn not-found-btn--primary">{t.backHome}</Link>
        <Link to="/crop-recommendation" className="not-found-btn not-found-btn--outline">{t.tryCrop}</Link>
      </div>
    </div>
  );
}

// ── Wrapper components for Part 1 pages ──────────────────────────────────────
// These read shared state from the Outlet context set by AppLayout,
// then pass them as props exactly as the original pages expect — no changes
// needed inside the Part 1 page files.

function CropRecommendationPage() {
  const { lang, setLang, setPage, weather, setWeather } = useOutletContext();
  return <CropRecommendation lang={lang} setLang={setLang} setPage={setPage} weather={weather} setWeather={setWeather} />;
}

function CropGuidancePage() {
  const { lang, weather, setWeather } = useOutletContext();
  const t = T[lang] || T.en;
  return <CropGuidance lang={lang} t={t} weather={weather} setWeather={setWeather} />;
}

function WeatherPage() {
  const { lang, setWeather } = useOutletContext();
  return <Weather lang={lang} onWeatherFetched={setWeather} />;
}

function YieldPricePage() {
  const { lang } = useOutletContext();
  return <YieldPrice lang={lang} />;
}

function AboutPage() {
  const { lang } = useOutletContext();
  return <About lang={lang} />;
}

// ── Router tree ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Stand-alone auth pages (no shared Navbar) */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* All pages with the shared Navbar */}
      <Route element={<AppLayout />}>
        {/* Landing page (Part 2 HomePage) */}
        <Route path="/" element={<div className="app-shell"><HomePage /></div>} />

        {/* Marketplace */}
        <Route path="/marketplace" element={<MarketplacePage />} />

        {/* Dashboards */}
        <Route path="/dashboard/admin"      element={<DashboardPage title="Admin Dashboard"      role="Admin"       summary="Review platform activity, users, and system operations."              primaryLink="/marketplace" primaryLabel="Open platform view"   highlights={[{ title:'User oversight',  description:'Monitor registered traders and land owners across the system.' },{ title:'Platform control', description:'Maintain the marketplace and administrative workflows.' }]} stats={[{icon:'👥',label:'Total Users',value:'1,248'},{icon:'🌾',label:'Land Owners',value:'832'},{icon:'📦',label:'Traders',value:'416'},{icon:'📋',label:'Active Listings',value:'320'}]} />} />
        <Route path="/dashboard/trader"     element={<DashboardPage title="Trader Dashboard"     role="Trader"      summary="Manage products, trade opportunities, and marketplace activity."      primaryLink="/marketplace" primaryLabel="Open marketplace"      highlights={[{ title:'Market listings', description:'Track product listings and trading opportunities in one place.' },{ title:'Buyer activity', description:'Review interest from land owners and buyers across the platform.' }]} stats={[{icon:'📋',label:'Active Listings',value:'12'},{icon:'🛒',label:'Total Orders',value:'27'},{icon:'💰',label:'Revenue',value:'Rs. 245K'},{icon:'💬',label:'Messages',value:'5'}]} />} />

        {/* Part 1 — ML tool pages */}
        <Route path="/crop-recommendation" element={<CropRecommendationPage />} />
        <Route path="/crop-guidance"       element={<CropGuidancePage />} />
        <Route path="/wx"                  element={<WeatherPage />} />
        <Route path="/yield-price"         element={<YieldPricePage />} />
        <Route path="/about"               element={<AboutPage />} />
        <Route path="/contact"             element={<ContactPage />} />
        <Route path="*"                    element={<NotFound />} />
      </Route>

      {/* Land Owner section (protected layout) */}
      <Route path="/landowner" element={<LandOwnerLayout />}>
        <Route index element={<Navigate to="/landowner/dashboard" replace />} />
        <Route path="dashboard" element={<LandOwnerDashboard />} />
        <Route path="farms"          element={<MyFarms />} />
        <Route path="farms/add"      element={<AddFarm />} />
        <Route path="farms/edit/:id" element={<EditFarm />} />
        <Route path="farms/:id"      element={<FarmDetails />} />
        <Route path="crops"          element={<MyCrops />} />
        <Route path="crops/add"      element={<AddCrop />} />
        <Route path="crops/:id"      element={<CropDetails />} />
        <Route path="cultivations"   element={<MyCultivations />} />
        <Route path="settings"       element={<Settings />} />
        <Route path="help"           element={<HelpSupport />} />
      </Route>

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
