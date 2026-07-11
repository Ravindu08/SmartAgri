// Shimmer skeleton placeholders — swap in for "Loading…" text so pages feel
// instant instead of blank. Shapes should roughly match the content they replace.

export function SkeletonListingGrid({ count = 6 }) {
  return (
    <div className="skel-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel-card" key={i}>
          <div className="skel skel-card__img" />
          <div className="skel skel-line skel-line--lg" />
          <div className="skel skel-line skel-line--sm" />
          <div className="skel skel-line skel-line--md" style={{ marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 4, withAvatar = false }) {
  return (
    <div className="skel-rows">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel-row" key={i}>
          {withAvatar && <div className="skel skel-avatar" />}
          <div className="skel-row__body">
            <div className="skel skel-line skel-line--md" />
            <div className="skel skel-line skel-line--sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skel-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skel-table__row" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <div className="skel skel-line" key={c} style={{ width: c === 0 ? '80%' : `${50 + (c * 13) % 35}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="skel-stat-row">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel-stat-card" key={i}>
          <div className="skel skel-stat-icon" />
          <div className="skel skel-line skel-line--sm" />
          <div className="skel skel-line skel-line--md" />
        </div>
      ))}
    </div>
  );
}
