import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import { fetchBackendHealth } from '../services/api';

const features = [
  { title: 'AI Crop Intelligence', description: 'Get AI-powered crop recommendations and insights tailored to your land.', icon: '🤖' },
  { title: 'Smart Farm Insights', description: 'Real-time data on weather, soil health, and farm metrics in one dashboard.', icon: '📊' },
  { title: 'Trusted Marketplace', description: 'Buy, sell, and connect with trusted traders and land owners easily.', icon: '🏪' },
];

export default function HomePage() {
  const [connectionState, setConnectionState] = useState('checking');

  useEffect(() => {
    let isMounted = true;

    fetchBackendHealth()
      .then(() => {
        if (isMounted) {
          setConnectionState('connected');
        }
      })
      .catch(() => {
        if (isMounted) {
          setConnectionState('offline');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__overlay" />
        <div className="home-hero__content">
          <div className="home-hero__badge">🤖 AI-POWERED AGRICULTURE</div>
          <h1 className="home-hero__title">
            Empowering Farmers.<br />
            Enriching <span className="home-hero__highlight">Future.</span>
          </h1>
          <p className="home-hero__text">
            SmartAgri brings AI and data together to help you make smarter decisions, increase productivity, and grow sustainably.
          </p>
          <div className={`connection-badge connection-badge--${connectionState}`}>
            {connectionState === 'connected' ? '🟢 Connected to SmartAgri Backend — All Systems Operational'
             : connectionState === 'offline' ? '🔴 Backend offline'
             : '⏳ Checking connection...'}
          </div>
          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" to="/marketplace">Explore Marketplace →</Link>
            <Link className="home-btn home-btn--outline" to="/about">Learn More →</Link>
          </div>
        </div>
        <div className="home-hero__cards">
          <div className="home-float-card">
            <div className="home-float-card__icon home-float-card__icon--green">🌱</div>
            <div>
              <div className="home-float-card__label">Soil Health Score</div>
              <div className="home-float-card__value">82<span>/100</span></div>
              <div className="home-float-card__status">● Healthy</div>
            </div>
          </div>
          <div className="home-float-card">
            <div className="home-float-card__icon home-float-card__icon--blue">🌤️</div>
            <div>
              <div className="home-float-card__label">Weather Forecast</div>
              <div className="home-float-card__value">28°C</div>
              <div className="home-float-card__status">Partly Cloudy</div>
            </div>
          </div>
          <div className="home-float-card">
            <div className="home-float-card__icon home-float-card__icon--yellow">🌾</div>
            <div>
              <div className="home-float-card__label">Crop Recommendation</div>
              <div className="home-float-card__value">High Yield</div>
              <div className="home-float-card__status">Maize</div>
            </div>
          </div>
        </div>
      </section>

      {/* About strip */}
      <section className="home-about">
        <div className="home-about__left">
          <p className="section__label">ABOUT SMARTAGRI</p>
          <h2>Technology that grows<br />with your farm</h2>
          <p>SmartAgri is an intelligent platform designed to support farmers and land owners with real-time insights, AI-driven recommendations, and a trusted marketplace.</p>
          <Link className="home-about__link" to="/about">Learn more about us →</Link>
        </div>
        <div className="home-about__right">
          <p className="section__label">OUR FEATURES</p>
          <div className="home-features-grid">
            {features.map(f => <FeatureCard key={f.title} title={f.title} description={f.description} icon={f.icon} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
