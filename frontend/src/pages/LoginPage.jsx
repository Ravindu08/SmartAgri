import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <p className="section__label">Login</p>
        <h1>Welcome back to SmartAgri</h1>
        <p>
          This is a placeholder login screen so the landing page button has a real route.
        </p>
        <Link className="button button--primary" to="/">
          Back to Home
        </Link>
      </div>
    </main>
  );
}