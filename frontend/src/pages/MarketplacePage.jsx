import { Link } from 'react-router-dom';

export default function MarketplacePage() {
  return (
    <main className="marketplace-page">
      <section className="marketplace-card">
        <p className="section__label">Marketplace</p>
        <h1>Public agricultural marketplace</h1>
        <p>
          Visitors can browse marketplace content and the landing page without creating an account.
        </p>

        <div className="marketplace-actions">
          <Link className="button button--primary" to="/">
            Back to landing page
          </Link>
          <Link className="button button--ghost" to="/login">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}