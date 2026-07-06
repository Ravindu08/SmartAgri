import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useOutletContext } from 'react-router-dom';

// ── Context ───────────────────────────────────────────────────────────────────
import { AppProvider, useApp } from './context/AppContext';

// ── Layouts (kept eager — tiny shells needed immediately) ─────────────────────
import AppLayout from './components/AppLayout';
import LandOwnerLayout from './components/LandOwnerLayout';
import TraderLayout from './components/TraderLayout';
import AdminLayout from './components/AdminLayout';
import PageLoader from './components/PageLoader';

// ── Auth / public pages ───────────────────────────────────────────────────────
const HomePage          = lazy(() => import('./pages/HomePage'));
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const RegisterPage      = lazy(() => import('./pages/RegisterPage'));
const VerifyCodePage    = lazy(() => import('./pages/VerifyCodePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const RoleSelectPage    = lazy(() => import('./pages/RoleSelectPage'));
const MarketplacePage   = lazy(() => import('./pages/MarketplacePage'));
const About             = lazy(() => import('./pages/About'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));
const YieldPrice        = lazy(() => import('./pages/YieldPrice'));

// ── ML pages ─────────────────────────────────────────────────────────────────
const CropRecommendation = lazy(() => import('./pages/CropRecommendation'));
const CropGuidance       = lazy(() => import('./pages/CropGuidance'));
const Weather            = lazy(() => import('./pages/Weather'));

// ── Land Owner pages ──────────────────────────────────────────────────────────
const LandOwnerDashboard = lazy(() => import('./pages/landowner/LandOwnerDashboard'));
const Settings           = lazy(() => import('./pages/landowner/Settings'));
const HelpSupport        = lazy(() => import('./pages/landowner/HelpSupport'));
const MyFarms            = lazy(() => import('./pages/farms/MyFarms'));
const AddFarm            = lazy(() => import('./pages/farms/AddFarm'));
const EditFarm           = lazy(() => import('./pages/farms/EditFarm'));
const FarmDetails        = lazy(() => import('./pages/farms/FarmDetails'));
const MyCrops            = lazy(() => import('./pages/crops/MyCrops'));
const AddCrop            = lazy(() => import('./pages/crops/AddCrop'));
const CropDetails        = lazy(() => import('./pages/crops/CropDetails'));
const MyCultivations     = lazy(() => import('./pages/cultivations/MyCultivations'));

// ── Trader pages ──────────────────────────────────────────────────────────────
const TraderDashboard = lazy(() => import('./pages/trader/TraderDashboard'));
const TraderRequests  = lazy(() => import('./pages/trader/TraderRequests'));
const TraderOrders    = lazy(() => import('./pages/trader/TraderOrders'));
const TraderHistory   = lazy(() => import('./pages/trader/TraderHistory'));
const TraderSettings  = lazy(() => import('./pages/trader/TraderSettings'));
const TraderHelp      = lazy(() => import('./pages/trader/TraderHelp'));

// ── Admin pages ───────────────────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers          = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserCreate     = lazy(() => import('./pages/admin/AdminUserCreate'));
const AdminUserImport     = lazy(() => import('./pages/admin/AdminUserImport'));
const AdminMarketplace    = lazy(() => import('./pages/admin/AdminMarketplace'));
const AdminFarms          = lazy(() => import('./pages/admin/AdminFarms'));
const AdminFarmImport     = lazy(() => import('./pages/admin/AdminFarmImport'));
const AdminActivity       = lazy(() => import('./pages/admin/AdminActivity'));
const AdminFeedback       = lazy(() => import('./pages/admin/AdminFeedback'));
const AdminReports        = lazy(() => import('./pages/admin/AdminReports'));
const AdminHarvestForecast = lazy(() => import('./pages/admin/AdminHarvestForecast'));

import { T } from './data/translations';
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
      <Route path="/login"           element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
      <Route path="/register"        element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
      <Route path="/verify-code"     element={<Suspense fallback={<PageLoader />}><VerifyCodePage /></Suspense>} />
      <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
      <Route path="/reset-password"  element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
      <Route path="/role-select"     element={<Suspense fallback={<PageLoader />}><RoleSelectPage /></Suspense>} />

      {/* Public pages with shared Navbar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><div className="app-shell"><HomePage /></div></Suspense>} />
        <Route path="/marketplace" element={
          import.meta.env.VITE_SHOW_MARKETPLACE === 'false'
            ? <Navigate to="/landowner/dashboard" replace />
            : <Suspense fallback={<PageLoader />}><MarketplacePage /></Suspense>
        } />
        <Route path="/crop-recommendation" element={<Suspense fallback={<PageLoader />}><CropRecommendationPage /></Suspense>} />
        <Route path="/crop-guidance"       element={<Suspense fallback={<PageLoader />}><CropGuidancePage /></Suspense>} />
        <Route path="/wx"                  element={<Suspense fallback={<PageLoader />}><WeatherPage /></Suspense>} />
        <Route path="/yield-price"         element={<Suspense fallback={<PageLoader />}><YieldPricePage /></Suspense>} />
        <Route path="/about"               element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/contact"             element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="/dashboard/admin"  element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/dashboard/trader" element={<Navigate to="/trader/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Land Owner section */}
      <Route path="/landowner" element={<LandOwnerLayout />}>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Route>

      {/* Trader section */}
      <Route path="/trader" element={<TraderLayout />}>
        <Suspense fallback={<PageLoader />}>
          <Route index element={<Navigate to="/trader/dashboard" replace />} />
          <Route path="dashboard" element={<TraderDashboard />} />
          <Route path="requests"  element={<TraderRequests />} />
          <Route path="orders"    element={<TraderOrders />} />
          <Route path="history"   element={<TraderHistory />} />
          <Route path="settings"  element={<TraderSettings />} />
          <Route path="help"      element={<TraderHelp />} />
        </Suspense>
      </Route>

      {/* Admin section */}
      <Route path="/admin" element={<AdminLayout />}>
        <Suspense fallback={<PageLoader />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"        element={<AdminDashboard />} />
          <Route path="users"            element={<AdminUsers />} />
          <Route path="users/create"     element={<AdminUserCreate />} />
          <Route path="users/import"     element={<AdminUserImport />} />
          <Route path="marketplace"      element={<AdminMarketplace />} />
          <Route path="farms"            element={<AdminFarms />} />
          <Route path="farms/import"     element={<AdminFarmImport />} />
          <Route path="activity"         element={<AdminActivity />} />
          <Route path="feedback"         element={<AdminFeedback />} />
          <Route path="reports"          element={<AdminReports />} />
          <Route path="harvest-forecast" element={<AdminHarvestForecast />} />
        </Suspense>
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
