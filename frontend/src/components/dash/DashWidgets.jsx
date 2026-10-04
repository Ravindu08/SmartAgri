import { useEffect, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import '../../styles/dashboard.css';

// Shared, animated building blocks for the Land Owner, Trader and Admin
// dashboards: a greeting banner, a progress ring, a segmented pipeline bar and
// a ranked bar list. Styling and motion live in styles/dashboard.css.

const GREETINGS = {
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
  si: { morning: 'සුභ උදෑසනක්', afternoon: 'සුභ දහවලක්', evening: 'සුභ සන්ධ්‍යාවක්' },
  ta: { morning: 'காலை வணக்கம்', afternoon: 'மதிய வணக்கம்', evening: 'மாலை வணக்கம்' },
};
const DATE_LOCALE = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };
const DAY_ICON = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/** Greeting banner. `children` render on the right (a ring, a call-to-action…). */
export function DashHero({ name, lang = 'en', tagline, children, tone = 'green' }) {
  const part = partOfDay();
  const greeting = (GREETINGS[lang] || GREETINGS.en)[part];
  const date = new Date().toLocaleDateString(DATE_LOCALE[lang] || 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <section className={`dash-hero dash-hero--${tone}`}>
      <span className="dash-hero__blob dash-hero__blob--a" aria-hidden="true" />
      <span className="dash-hero__blob dash-hero__blob--b" aria-hidden="true" />
      <div className="dash-hero__text">
        <p className="dash-hero__date"><span aria-hidden="true">{DAY_ICON[part]}</span> {date}</p>
        <h1 className="dash-hero__title">
          {greeting}{name ? `, ${name}` : ''} <span className="dash-hero__wave" aria-hidden="true">👋</span>
        </h1>
        {tagline && <p className="dash-hero__tagline">{tagline}</p>}
      </div>
      {children && <div className="dash-hero__side">{children}</div>}
    </section>
  );
}

/** Circular progress. The arc sweeps from empty to `pct` once mounted. */
export function ProgressRing({ pct = 0, label, sub, size = 108, stroke = 10 }) {
  const safe = Math.max(0, Math.min(100, Math.round(pct) || 0));
  const shown = useCountUp(safe, 1100);
  const [drawn, setDrawn] = useState(0);
  // Set after mount so the stroke transition has an empty arc to grow from.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(safe));
    return () => cancelAnimationFrame(id);
  }, [safe]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="dash-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label || ''} ${safe}%`}>
        <defs>
          <linearGradient id="dash-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
        </defs>
        <circle className="dash-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="dash-ring__arc"
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
          stroke="url(#dash-ring-grad)" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * drawn) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text className="dash-ring__num" x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{shown}%</text>
      </svg>
      {(label || sub) && (
        <div className="dash-ring__caption">
          {label && <strong>{label}</strong>}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}

/** One horizontal bar split into coloured segments, with a legend underneath. */
export function PipelineBar({ title, segments, emptyLabel }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <section className="dash-panel">
      {title && <h2 className="dash-panel__title">{title}</h2>}
      {total === 0 ? (
        <p className="dash-panel__empty">{emptyLabel}</p>
      ) : (
        <>
          <div className="dash-pipe" role="img" aria-label={segments.map(s => `${s.label} ${s.value}`).join(', ')}>
            {segments.filter(s => s.value > 0).map((s, i) => (
              <span
                key={s.label}
                className="dash-pipe__seg"
                style={{ flexGrow: s.value, '--tone': s.color, '--i': i }}
                title={`${s.label}: ${s.value}`}
              />
            ))}
          </div>
          <ul className="dash-legend">
            {segments.map((s, i) => (
              <li key={s.label} style={{ '--tone': s.color, '--i': i }}>
                <i aria-hidden="true" />
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function BarRow({ icon, label, value, max, color, index }) {
  const shown = useCountUp(value ?? 0, 900);
  const width = max > 0 ? Math.max(4, ((value || 0) / max) * 100) : 0;
  return (
    <li className="dash-bars__row" style={{ '--tone': color, '--i': index }}>
      <span className="dash-bars__label"><span aria-hidden="true">{icon}</span> {label}</span>
      <span className="dash-bars__track"><span className="dash-bars__fill" style={{ width: `${width}%` }} /></span>
      <strong className="dash-bars__val">{shown}</strong>
    </li>
  );
}

/** Ranked horizontal bars, each scaled against the largest value. */
export function BarList({ title, rows }) {
  const max = Math.max(1, ...rows.map(r => r.value || 0));
  return (
    <section className="dash-panel">
      {title && <h2 className="dash-panel__title">{title}</h2>}
      <ul className="dash-bars">
        {rows.map((r, i) => <BarRow key={r.label} {...r} max={max} index={i} />)}
      </ul>
    </section>
  );
}
