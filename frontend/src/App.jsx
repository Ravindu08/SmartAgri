import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MarketplacePage from './pages/MarketplacePage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app-shell">
            <Navbar />
            <HomePage />
          </div>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route
        path="/dashboard/trader"
        element={
          <DashboardPage
            title="Trader Dashboard"
            role="Trader"
            summary="Manage products, trade opportunities, and marketplace activity."
            primaryLink="/marketplace"
            primaryLabel="Open marketplace"
            highlights={[
              {
                title: 'Market listings',
                description: 'Track product listings and trading opportunities in one place.',
              },
              {
                title: 'Buyer activity',
                description: 'Review interest from land owners and buyers across the platform.',
              },
            ]}
          />
        }
      />
      <Route
        path="/dashboard/land-owner"
        element={
          <DashboardPage
            title="Land Owner Dashboard"
            role="Land Owner"
            summary="Manage land resources, collaborations, and service requests."
            primaryLink="/marketplace"
            primaryLabel="Browse marketplace"
            highlights={[
              {
                title: 'Land opportunities',
                description: 'Organize land access, availability, and partnership requests.',
              },
              {
                title: 'Farming support',
                description: 'Coordinate the services and tools that support your land use.',
              },
            ]}
          />
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <DashboardPage
            title="Admin Dashboard"
            role="Admin"
            summary="Review platform activity, users, and system operations."
            primaryLink="/marketplace"
            primaryLabel="Open platform view"
            highlights={[
              {
                title: 'User oversight',
                description: 'Monitor registered traders and land owners across the system.',
              },
              {
                title: 'Platform control',
                description: 'Maintain the marketplace and administrative workflows.',
              },
            ]}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}