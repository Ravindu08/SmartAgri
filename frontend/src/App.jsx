import { BrowserRouter, Link, Navigate, Route, Routes, useOutletContext } from 'react-router-dom';

// ── Context ───────────────────────────────────────────────────────────────────
import { AppProvider, useApp } from './context/AppContext';

// ── Layouts ───────────────────────────────────────────────────────────────────
import AppLayout from './components/AppLayout';
import LandOwnerLayout from './components/LandOwnerLayout';
import TraderLayout from './components/TraderLayout';
import AdminLayout from './components/AdminLayout';

// ── Auth / public pages ───────────────────────────────────────────────────────
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoleSelectPage from './pages/RoleSelectPage';
import MarketplacePage from './pages/MarketplacePage';

// ── Land Owner pages ──────────────────────────────────────────────────────────
import LandOwnerDashboard from './pages/landowner/LandOwnerDashboard';
import Settings from './pages/landowner/Settings';
import HelpSupport from './pages/landowner/HelpSupport';
import MyFarms from './pages/farms/MyFarms';
import AddFarm from './pages/farms/AddFarm';
import EditFarm from './pages/farms/EditFarm';
import FarmDetails from './pages/farms/FarmDetails';
import MyCrops from './pages/crops/MyCrops';
import AddCrop from './pages/crops/AddCrop';
import CropDetails from './pages/crops/CropDetails';
import MyCultivations from './pages/cultivations/MyCultivations';

// ── Trader pages ──────────────────────────────────────────────────────────────
import TraderDashboard from './pages/trader/TraderDashboard';
import TraderRequests from './pages/trader/TraderRequests';
import TraderOrders from './pages/trader/TraderOrders';
import TraderHistory from './pages/trader/TraderHistory';
import TraderSettings from './pages/trader/TraderSettings';
import TraderHelp from './pages/trader/TraderHelp';

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserCreate from './pages/admin/AdminUserCreate';
import AdminMarketplace from './pages/admin/AdminMarketplace';
import AdminFarms from './pages/admin/AdminFarms';
import AdminActivity from './pages/admin/AdminActivity';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminReports from './pages/admin/AdminReports';

// ── ML / Guidance / Weather pages ────────────────────────────────────────────
import CropRecommendation from './pages/CropRecommendation';
import CropGuidance from './pages/CropGuidance';
import YieldPrice from './pages/YieldPrice';
import Weather from './pages/Weather';
import About from './pages/About';
import ContactPage from './pages/ContactPage';
import { T } from './data/translations';

// ── Styles ────────────────────────────────────────────────────────────────────
import './styles/globals.css';
import './styles.css';

// ── 404 Not Found ─────────────────────────────────────────────────────────────
const NOT_FOUND_T = {
  en: { title: 'Page Not Found', sub: "The page you're looking for doesn't exist or may have been moved.", backHome: '← Back to Home', tryCrop: 'Try Crop Recommendation' },
  si: { title: 'පිටුව හමු නොවීය', sub: 'ඔබ සොයන පිටුව නොමැත හෝ මාරු කර ඇත.', backHome: '← මුල් පිටුවට', tryCrop: 'බෝග නිර්දේශ' },
  ta: { title: 'பக்கம் கிடைக்கவில்லை', sub: 'நீங்கள் தேடும் பக்கம் இல்லை.', backHome: '← முகப்பு பக்கத்திற்கு', tryCrop: 'பயிர் பரிந்துரை' },
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

// ── Wrapper components for ML tool pages ─────────────────────────────────────
function CropRecommendationPage() {
  const { lang, setLang, setPage, weather, setWeather } = useOutletContext();
  return <CropRecommendation lang={lang} setLang={setLang} setPage={setPage} weather={weather} setWeather={setWeather} />;
}
function CropGuidancePage() {
  const { lang, weather, setWeather } = useOutletContext();
  return <CropGuidance lang={lang} t={T[lang] || T.en} weather={weather} setWeather={setWeather} />;
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
      {/* Stand-alone auth pages */}
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/register"    element={<RegisterPage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />

      {/* Public pages with shared Navbar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<div className="app-shell"><HomePage /></div>} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/crop-recommendation" element={<CropRecommendationPage />} />
        <Route path="/crop-guidance"       element={<CropGuidancePage />} />
        <Route path="/wx"                  element={<WeatherPage />} />
        <Route path="/yield-price"         element={<YieldPricePage />} />
        <Route path="/about"               element={<AboutPage />} />
        <Route path="/contact"             element={<ContactPage />} />
        {/* Legacy redirect — admin now lives at /admin/dashboard */}
        <Route path="/dashboard/admin"  element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard/trader" element={<Navigate to="/trader/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Land Owner section */}
      <Route path="/landowner" element={<LandOwnerLayout />}>
        <Route index element={<Navigate to="/landowner/dashboard" replace />} />
        <Route path="dashboard"      element={<LandOwnerDashboard />} />
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

      {/* Trader section */}
      <Route path="/trader" element={<TraderLayout />}>
        <Route index element={<Navigate to="/trader/dashboard" replace />} />
        <Route path="dashboard" element={<TraderDashboard />} />
        <Route path="requests"  element={<TraderRequests />} />
        <Route path="orders"    element={<TraderOrders />} />
        <Route path="history"   element={<TraderHistory />} />
        <Route path="settings"  element={<TraderSettings />} />
        <Route path="help"      element={<TraderHelp />} />
      </Route>

      {/* Admin section */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"   element={<AdminDashboard />} />
        <Route path="users"       element={<AdminUsers />} />
        <Route path="users/create" element={<AdminUserCreate />} />
        <Route path="marketplace" element={<AdminMarketplace />} />
        <Route path="farms"       element={<AdminFarms />} />
        <Route path="activity"    element={<AdminActivity />} />
        <Route path="feedback"    element={<AdminFeedback />} />
        <Route path="reports"     element={<AdminReports />} />
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
