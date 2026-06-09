import { Link } from 'react-router-dom';

export default function MarketplacePage() {
  return (
    <main className="marketplace-page">
      <div className="marketplace-hero">
        <div className="marketplace-hero__illustration">🛒</div>
        <h1 className="marketplace-hero__title">SmartAgri Marketplace</h1>
        <p className="marketplace-hero__sub">A trusted place to connect, trade, and grow together.<br />Buy, sell, and discover the best opportunities in agriculture.</p>
        <div className="marketplace-actions">
          <Link className="button button--outline" to="/">← Back to Landing</Link>
          <Link className="button button--primary" to="/login">Login to Continue →</Link>
        </div>
      </div>
    </main>
  );
}
