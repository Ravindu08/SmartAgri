/**
 * AppLayout — wraps pages that need the shared Navbar.
 * Reads lang/weather from AppContext and passes them as props to Part 1 ML pages
 * via the Outlet context.
 */
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useApp } from '../context/AppContext';

export default function AppLayout() {
  const { lang, setLang, weather, setWeather } = useApp();
  const navigate = useNavigate();

  /** Maps legacy setPage('key') calls from Part 1 pages to react-router navigation */
  const setPage = (key) => {
    const routes = {
      home: '/',
      'crop-recommendation': '/crop-recommendation',
      'crop-guidance': '/crop-guidance',
      weather: '/weather',
      'yield-price': '/yield-price',
      about: '/about',
    };
    navigate(routes[key] ?? '/');
  };

  return (
    <>
      <Navbar />
      <main>
        <Outlet context={{ lang, setLang, weather, setWeather, setPage }} />
      </main>
    </>
  );
}
