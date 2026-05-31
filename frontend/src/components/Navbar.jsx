import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = getAuthSession();
  const isSignedIn = Boolean(user);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">SmartAgri</div>
      <nav className="navbar__links" aria-label="Primary navigation">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#features">Features</a>
        <Link to="/marketplace">Marketplace</Link>
        {isSignedIn ? (
          <>
            <span className="navbar__session">
              <span className="navbar__role">{user.role}</span>
              <span className="navbar__user">{user.full_name}</span>
            </span>
            <button className="navbar__logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="navbar__login" to="/login">
              Login
            </Link>
            <Link className="navbar__register" to="/register">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}