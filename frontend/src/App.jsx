import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app-shell">
            <Navbar />
            <LandingPage />
          </div>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}