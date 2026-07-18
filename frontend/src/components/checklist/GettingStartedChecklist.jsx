import { useState } from 'react';
import { Link } from 'react-router-dom';

// Dismissible "Getting Started" card, reused by the Land Owner and Trader
// dashboards. `done` on each item is computed by the caller from data
// already loaded on the page — this component does no fetching and stores
// no completion state itself, only the dismiss flag.
export default function GettingStartedChecklist({ title, items, storageKey, dismissAria, dataTour }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });

  const doneCount = items.filter(i => i.done).length;
  const total = items.length;

  if (dismissed || doneCount === total) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="getting-started-card" data-tour={dataTour}>
      <div className="getting-started-card__header">
        <h2 className="getting-started-card__title">{title}</h2>
        <div className="getting-started-card__header-right">
          <span className="getting-started-card__count">{doneCount}/{total}</span>
          <button type="button" className="getting-started-card__dismiss" aria-label={dismissAria} onClick={dismiss}>✕</button>
        </div>
      </div>
      <div className="getting-started-card__progress-track">
        <div className="getting-started-card__progress-fill" style={{ width: `${(doneCount / total) * 100}%` }} />
      </div>
      <div className="getting-started-card__items">
        {items.map(item => (
          <Link
            key={item.id}
            to={item.href}
            className={`getting-started-card__item${item.done ? ' getting-started-card__item--done' : ''}`}
          >
            <span className="getting-started-card__item-icon">{item.done ? '✓' : '○'}</span>
            <span className="getting-started-card__item-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
