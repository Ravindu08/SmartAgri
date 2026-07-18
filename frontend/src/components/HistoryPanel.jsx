import { getCropLabel, CROP_EMOJI } from "../data/cropData";

const LS_KEY = "smartagri_history";
const MAX_ENTRIES = 10;

/** Persist a new prediction result to localStorage history. */
export function saveToHistory({ crop, confidence, mode, zone, season, soil }) {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const entry = {
      id:         Date.now(),
      ts:         new Date().toISOString(),
      crop,
      confidence,
      mode,
      zone,
      season,
      soil,
    };
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

/** Load history from localStorage, or return [] if unavailable. */
export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Clear all stored history. */
export function clearHistory() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HistoryPanel({ history, onClear, lang, t }) {
  if (!history || history.length === 0) return null;

  const confCls = c => c >= 0.7 ? "hist-conf-hi" : c >= 0.4 ? "hist-conf-md" : "hist-conf-lo";

  const relativeTime = (isoStr) => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return lang === "si" ? "දැන්"    : lang === "ta" ? "இப்போது" : "just now";
    if (m < 60) return lang === "si" ? `මිනිත්තු ${m}කට පෙර` : lang === "ta" ? `${m} நிமிடத்திற்கு முன்` : `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return lang === "si" ? `පැය ${h}කට පෙර`       : lang === "ta" ? `${h} மணி நேரத்திற்கு முன்` : `${h}h ago`;
    const d = Math.floor(h / 24);
    return lang === "si" ? `දින ${d}කට පෙර` : lang === "ta" ? `${d} நாட்களுக்கு முன்` : `${d}d ago`;
  };

  return (
    <div className="hist-card" data-tour="cr-history">
      <div className="hist-inner">
        <div className="hist-hdr">
          <span className="hist-title">📋 {t.historyTitle}</span>
          <button className="hist-clear" onClick={onClear}>{t.historyClear}</button>
        </div>
        <div className="hist-body">
          {history.map(entry => (
            <div className="hist-item" key={entry.id}>
              <div className="hist-emoji">{CROP_EMOJI[entry.crop] || "🌿"}</div>
              <div className="hist-info">
                <div className="hist-crop">{getCropLabel(entry.crop, lang)}</div>
                <div className="hist-meta">
                  {t.historyFull}
                  {" · "}{entry.zone}{" · "}{entry.season}
                  {" · "}{relativeTime(entry.ts)}
                </div>
              </div>
              <span className={`hist-conf ${confCls(entry.confidence)}`}>
                {Math.round(entry.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
