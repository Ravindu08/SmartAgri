import { FEAT_ICONS, xaiSentence } from "../data/cropData";

/**
 * Single XAI feature card showing contribution bar, status badge, and sentence.
 *
 * barW is normalised relative to the top feature score (maxScore) so that the
 * highest-scoring feature always fills 100% of the bar and others are shown
 * proportionally — rather than using an arbitrary multiplier.
 */
export default function XAIFeatureCard({ feat, maxScore, lang, t }) {
  const pct  = Math.round(feat.score * 100);
  const barW = maxScore > 0 ? Math.round((feat.score / maxScore) * 100) : 0;

  const lbl  = lang === "si" ? (feat.label_si || feat.label)
             : lang === "ta" ? (feat.label_ta || feat.label)
             : feat.label;

  const icon = FEAT_ICONS[feat.feature] || "📊";
  const v = feat.value, mn = feat.ideal_min, mx = feat.ideal_max;

  let status = "na", badge = null, bCls = "xb-na";
  if (v !== null && v !== undefined && mn !== null && mx !== null) {
    if (v >= mn && v <= mx) { status = "ok"; badge = t.withinRange; bCls = "xb-ok"; }
    else if (v < mn)        { status = "lo"; badge = t.belowRange;  bCls = "xb-lo"; }
    else                    { status = "hi"; badge = t.aboveRange;  bCls = "xb-hi"; }
  }

  const sentence = xaiSentence(feat, lang);

  return (
    <div className="xai-feat-card">
      <div className="xai-feat-top">
        <div className={`xai-feat-icon xai-feat-icon-${status}`}>{icon}</div>
        <div className="xai-feat-name">{lbl}</div>
        {badge && <span className={`xai-feat-badge ${bCls}`}>{badge}</span>}
      </div>

      <div className="xai-bar-row">
        <div className="xai-bar-track">
          <div className={`xai-bar-fill xai-bar-fill-${status}`} style={{ width: `${barW}%` }} />
        </div>
        <div className="xai-bar-pct">{pct}%</div>
      </div>

      {sentence && (
        <div className="xai-range-row">
          <span style={{ fontSize: 11, color: "var(--bark)", opacity: .7, lineHeight: 1.45 }}>
            {sentence}
          </span>
        </div>
      )}

      {v !== null && v !== undefined && mn !== null && (
        <div className="xai-range-row" style={{ marginTop: 4 }}>
          <span className="xai-ideal-text">
            {lang === "si" ? "සුදුසු" : lang === "ta" ? "சரியான" : t.rangeHint}: {mn?.toFixed(1)}–{mx?.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
