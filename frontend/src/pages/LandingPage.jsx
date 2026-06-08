import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';
import { fetchBackendHealth } from '../services/api';

const features = [
  {
    title: 'AI Crop Recommendation',
    description:
      'Get smart crop suggestions based on soil data, weather, and farm conditions to improve yield and reduce risk.',
    icon: 'AI',
  },
  {
    title: 'Smart Farming Calendar',
    description:
      'Plan planting, irrigation, fertilization, and harvesting with a clear calendar built for practical farm planning.',
    icon: 'SC',
  },
  {
    title: 'Agricultural Marketplace',
    description:
      'Connect farmers, traders, and land owners in a simple marketplace for products, services, and opportunities.',
    icon: 'AM',
  },
];

export default function LandingPage() {
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
    <main>
      <section id="home" className="hero">
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="hero__eyebrow">Smart Agricultural Decision Support System</p>
          <h1>SmartAgri</h1>
          <p className="hero__subtitle">AI-Powered Agricultural Decision Support System</p>
          <p className="hero__text">
            A modern university final year project that helps farmers make better decisions through
            intelligent recommendations, planning tools, and a connected agricultural ecosystem.
          </p>
          <div className={`connection-badge connection-badge--${connectionState}`}>
            Backend status:{' '}
            {connectionState === 'connected'
              ? 'Connected to FastAPI'
              : connectionState === 'offline'
                ? 'Backend offline'
                : 'Checking connection...'}
          </div>
          <div className="hero__actions">
            <Link className="button button--primary" to="/login">
              Get Started
            </Link>
            <a className="button button--ghost" href="#features">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="section section--about">
        <div className="section__intro">
          <p className="section__label">About</p>
          <h2>Built for practical farm decision making</h2>
          <p>
            SmartAgri combines simple design with useful agricultural intelligence so students and
            users can present a polished, real-world system idea.
          </p>
        </div>
      </section>

      <section id="features" className="section section--features">
        <div className="section__intro section__intro--center">
          <p className="section__label">Features</p>
          <h2>Three core tools in one platform</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </section>
    </main>
  );
}