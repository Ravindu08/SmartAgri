import { BrowserRouter, Navigate, Route, Routes, useOutletContext } from 'react-router-dom';

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
import EditCrop from './pages/crops/EditCrop';
import CropDetails from './pages/crops/CropDetails';

// ── Part 1: ML / Guidance / Weather pages ────────────────────────────────────
import CropRecommendation from './pages/CropRecommendation';
import CropGuidance from './pages/CropGuidance';
import YieldPrice from './pages/YieldPrice';
import Weather from './pages/Weather';
import About from './pages/About';
import { T } from './data/translations';

// ── Styles ────────────────────────────────────────────────────────────────────
import './styles/globals.css';   // Design tokens (CSS variables, dark/light themes)
import './styles.css';           // Page & component styles (uses variables from globals)

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
        <Route path="/dashboard/admin"      element={<DashboardPage title="Admin Dashboard"      role="Admin"       summary="Review platform activity, users, and system operations."              primaryLink="/marketplace" primaryLabel="Open platform view"   highlights={[{ title:'User oversight',  description:'Monitor registered traders and land owners across the system.' },{ title:'Platform control', description:'Maintain the marketplace and administrative workflows.' }]} />} />
        <Route path="/dashboard/land-owner" element={<DashboardPage title="Land Owner Dashboard" role="Land Owner"  summary="Manage land resources, collaborations, and service requests."          primaryLink="/marketplace" primaryLabel="Browse marketplace"    highlights={[{ title:'Land opportunities', description:'Organize land access, availability, and partnership requests.' },{ title:'Farming support', description:'Coordinate the services and tools that support your land use.' }]} />} />
        <Route path="/dashboard/trader"     element={<DashboardPage title="Trader Dashboard"     role="Trader"      summary="Manage products, trade opportunities, and marketplace activity."      primaryLink="/marketplace" primaryLabel="Open marketplace"      highlights={[{ title:'Market listings', description:'Track product listings and trading opportunities in one place.' },{ title:'Buyer activity', description:'Review interest from land owners and buyers across the platform.' }]} />} />

        {/* Part 1 — ML tool pages */}
        <Route path="/crop-recommendation" element={<CropRecommendationPage />} />
        <Route path="/crop-guidance"       element={<CropGuidancePage />} />
        <Route path="/weather"             element={<WeatherPage />} />
        <Route path="/yield-price"         element={<YieldPricePage />} />
        <Route path="/about"               element={<AboutPage />} />
      </Route>

      {/* Land Owner section (protected layout) */}
      <Route path="/landowner" element={<LandOwnerLayout />}>
        <Route index element={<Navigate to="/landowner/farms" replace />} />
        <Route path="farms"          element={<MyFarms />} />
        <Route path="farms/add"      element={<AddFarm />} />
        <Route path="farms/edit/:id" element={<EditFarm />} />
        <Route path="farms/:id"      element={<FarmDetails />} />
        <Route path="crops"          element={<MyCrops />} />
        <Route path="crops/add"      element={<AddCrop />} />
        <Route path="crops/edit/:id" element={<EditCrop />} />
        <Route path="crops/:id"      element={<CropDetails />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
