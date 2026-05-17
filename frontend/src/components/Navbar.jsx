import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">SmartAgri</div>
      <nav className="navbar__links" aria-label="Primary navigation">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#features">Features</a>
        <Link className="navbar__login" to="/login">
          Login
        </Link>
      </nav>
    </header>
  );
}