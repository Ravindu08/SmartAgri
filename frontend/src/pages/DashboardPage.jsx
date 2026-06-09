import { Link, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../services/api';

export default function DashboardPage({ title, role, summary, highlights, primaryLink, primaryLabel }) {
  const navigate = useNavigate();
  const session = getAuthSession();
  const userName = session.user?.full_name || 'SmartAgri user';

  const handleLogout = () => {
    clearAuthSession();
    navigate('/', { replace: true });
  };

  const roleIcon = role === 'Admin' ? '🛡️' : role === 'Land Owner' ? '🌾' : '📦';

  return (
    <main className="dashboard-page">
      <section className="dash-card">
        <div className="dash-card__topbar">
          <div className="dash-card__identity">
            <div className="dash-card__avatar">{userName.charAt(0).toUpperCase()}</div>
            <div>
              <div className="dash-card__role">{roleIcon} {role}</div>
              <div className="dash-card__user">{userName}</div>
            </div>
          </div>
          <div className="dash-card__actions">
            <Link className="button button--outline" to="/">🏠 Home</Link>
            <button className="button button--danger" type="button" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="dash-card__header">
          <h1>{title}</h1>
          <p>{summary}</p>
        </div>

        <div className="dash-primary-actions">
          <Link className="button button--primary" to={primaryLink}>{primaryLabel} →</Link>
          <Link className="button button--outline" to="/marketplace">🏪 Visit Marketplace</Link>
        </div>

        <div className="dash-highlights">
          {highlights.map(item => (
            <article key={item.title} className="dash-highlight">
              <div className="dash-highlight__icon">✅</div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
