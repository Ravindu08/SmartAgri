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

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="dashboard-card__topbar">
          <div className="dashboard-card__identity">
            <p className="section__label">{role}</p>
            <div className="dashboard-card__user">{userName}</div>
          </div>

          <div className="dashboard-card__actions">
            <Link className="button button--ghost" to="/">
              Home
            </Link>
            <button className="button button--ghost dashboard-card__logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-card__header">
          <div>
            <h1>{title}</h1>
            <p>{summary}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link className="button button--primary" to={primaryLink}>
            {primaryLabel}
          </Link>
          <Link className="button button--ghost" to="/marketplace">
            Visit marketplace
          </Link>
        </div>

        <div className="dashboard-highlights">
          {highlights.map((item) => (
            <article key={item.title} className="dashboard-highlight">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}