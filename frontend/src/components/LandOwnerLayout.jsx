import { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { getAuthSession } from '../services/api';

export default function LandOwnerLayout() {
  const navigate = useNavigate();
  const { user } = getAuthSession();

  useEffect(() => {
    if (!user || user.role !== 'Land Owner') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landowner-shell">
      <Navbar />
      <div className="landowner-page">
        <aside className="landowner-sidebar">
          <div className="landowner-sidebar__title">Land Owner</div>
          <nav className="landowner-sidebar__nav">
            <Link className="landowner-sidebar__link" to="/dashboard/land-owner">
              Dashboard
            </Link>
            <Link className="landowner-sidebar__link" to="/landowner/farms">
              Farm Management
            </Link>
            <Link className="landowner-sidebar__link" to="/landowner/farms/add">
              Add Farm
            </Link>
            <Link className="landowner-sidebar__link" to="/landowner/crops">
              Crop Management
            </Link>
            <Link className="landowner-sidebar__link" to="/landowner/crops/add">
              Add Crop
            </Link>
          </nav>
        </aside>

        <main className="landowner-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
