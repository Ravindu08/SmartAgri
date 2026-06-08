/** Suitability bar — shows a user's input value against a crop's ideal range. */
export default function SuitBar({ label, value, min, max, t }) {
  if (value === "" || min == null) return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;

  const span  = max - min;
  const pad   = span * 0.3;
  const lo    = min - pad;
  const hi    = max + pad;
  const total = hi - lo;

  const rL = ((min - lo) / total) * 100;
  const rW = ((max - min) / total) * 100;
  const vP = Math.max(0, Math.min(100, ((v - lo) / total) * 100));
  const st = v < min ? "lo" : v > max ? "hi" : "ok";

  return (
    <div className="suit-row">
      <div className="suit-label">{label}</div>
      <div className="suit-track">
        <div className="suit-range" style={{ left: `${rL}%`, width: `${rW}%` }} />
        <div className={`suit-dot s-${st}`} style={{ left: `${vP}%` }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--bark)", opacity: .6, width: 60, textAlign: "right", flexShrink: 0 }}>
        {v}
      </span>
      <span className={`suit-badge sb-${st}`}>
        {st === "ok" ? t.withinRange : st === "lo" ? t.belowRange : t.aboveRange}
      </span>
    </div>
  );
}
