import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CultivationTracker from "../components/CultivationTracker";
import WeatherLocationPicker from "../components/WeatherLocationPicker";
import { getAuthSession } from "../services/api";
import "../styles/CropGuidance.css";

// Guidance endpoints live on the ML service (port 8000).
// Use an empty base so Vite's dev-server proxy forwards /guidance → port 8000.
const API_BASE = "";

// ── Activity type metadata ─────────────────────────────────────────────────
const ACT_META = {
  prepare:   { icon: "🚜", cls: "act-prepare"   },
  plant:     { icon: "🌱", cls: "act-plant"     },
  water:     { icon: "💧", cls: "act-water"     },
  fertilize: { icon: "🌿", cls: "act-fertilize" },
  weed:      { icon: "✂️", cls: "act-weed"      },
  train:     { icon: "🪵", cls: "act-train"     },
  monitor:   { icon: "🔍", cls: "act-monitor"   },
  spray:     { icon: "💦", cls: "act-spray"     },
  harvest:   { icon: "🧺", cls: "act-harvest"   },
  thin:      { icon: "🌾", cls: "act-thin"      },
};

const ACT_KEY = {
  prepare:   "actPrepare",
  plant:     "actPlant",
  water:     "actWater",
  fertilize: "actFertilize",
  weed:      "actWeed",
  train:     "actTrain",
  monitor:   "actMonitor",
  spray:     "actSpray",
  harvest:   "actHarvest",
  thin:      "actThin",
};

const SEV_ICONS = { high: "🔴", medium: "🟡", low: "🟢" };
const RISK_ICONS = { weather: "🌦️", soil: "🪨", pest: "🐛", market: "📈" };
const TABS = ["growthStages","fertilization","irrigationGuide","diseaseMgmt","pestMgmt","riskFactors","harvestGuide"];

const TAB_ICONS = {
  growthStages:    "🌿",
  fertilization:   "🧪",
  irrigationGuide: "💧",
  diseaseMgmt:     "🦠",
  pestMgmt:        "🐛",
  riskFactors:     "⚠️",
  harvestGuide:    "🧺",
};

// Substitutes {0}, {1}, ... in a translation string with provided values
function tpl(str, ...vals) {
  return str.replace(/\{(\d+)\}/g, (_, i) => vals[i] ?? "");
}

// ── Helpers ────────────────────────────────────────────────────────────────
function daysSincePlanting(plantingDate) {
  if (!plantingDate) return null;
  return Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86400000);
}

function stageBadge(stage, daysSince, t) {
  if (daysSince === null) return null;
  if (daysSince >= stage.day_start && daysSince <= stage.day_end) return { label: t.todayBadge || "NOW", cls: "current" };
  if (daysSince < stage.day_start) return { label: t.upcoming, cls: "upcoming" };
  return { label: "✓", cls: "done" };
}

function activityDayLabel(day, daysSince, t) {
  if (day < 0) return `${Math.abs(day)} ${t.noDays} ${t.beforePlanting}`;
  const label = `${t.stageDay} ${day}`;
  if (daysSince === null) return label;
  const diff = day - daysSince;
  if (diff === 0) return label;
  if (diff > 0) return `${label}  (+${diff}d)`;
  return `${label}  (${diff}d)`;
}

function isToday(day, daysSince) {
  return daysSince !== null && Math.abs(day - daysSince) <= 1;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ActivityCard({ act, daysSince, t }) {
  const meta = ACT_META[act.type] || { icon: "📋", cls: "act-monitor" };
  const today = isToday(act.day, daysSince);
  return (
    <div className={`activity-card${today ? " today-highlight" : ""}`}>
      <div className={`activity-icon-wrap ${meta.cls}`}>{meta.icon}</div>
      <div className="activity-body">
        <div className="activity-day">
          <span>{activityDayLabel(act.day, daysSince, t)}</span>
          {today && <span className="today-badge">{t.todayBadge}</span>}
          &nbsp;·&nbsp;
          <span className="activity-type-label">{t[ACT_KEY[act.type]] || act.type}</span>
        </div>
        <div className="activity-title">{act.title}</div>
        <div className="activity-desc">{act.description}</div>
        {act.why && (
          <div className="activity-why">
            <span className="activity-why-label">{t.actWhy}:</span>
            {act.why}
          </div>
        )}
      </div>
    </div>
  );
}

function StagesTab({ stages, daysSince, t }) {
  const [open, setOpen] = useState(() => {
    if (daysSince === null) return 0;
    const idx = stages.findIndex(s => daysSince >= s.day_start && daysSince <= s.day_end);
    return idx >= 0 ? idx : 0;
  });

  return (
    <div className="guidance-timeline">
      {stages.map((stage, i) => {
        const badge = stageBadge(stage, daysSince, t);
        const isOpen = open === i;
        return (
          <div className="guidance-stage" key={stage.id}>
            <div
              className={`guidance-stage-header${badge?.cls === "current" ? " active-stage" : ""}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="stage-icon">{stage.icon}</span>
              <div className="stage-info">
                <div className="stage-name">{stage.name}</div>
                <div className="stage-days">
                  {stage.day_start < 0
                    ? `${Math.abs(stage.day_start)}d before → Day 0`
                    : `${t.stageDay} ${stage.day_start} – ${stage.day_end}`}
                </div>
              </div>
              {badge && (
                <span className={`stage-badge ${badge.cls}`}>{badge.label}</span>
              )}
              <span className={`stage-chevron${isOpen ? " open" : ""}`}>▶</span>
            </div>
            {isOpen && (
              <div className="guidance-stage-body">
                {stage.description && <p className="stage-desc">{stage.description}</p>}
                <div className="stage-activities-label">
                  {t.stageActivities}
                </div>
                <div className="activity-list">
                  {stage.activities.map((act, j) => (
                    <ActivityCard key={j} act={act} daysSince={daysSince} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Weather banner for guidance tabs ──────────────────────────────────────
function WeatherTabBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="guidance-wx-banners">
      {alerts.map((a, i) => (
        <div key={i} className={`guidance-wx-alert guidance-wx-${a.type}`}>
          <span className="guidance-wx-icon">{a.icon}</span>
          <div>
            <div className="guidance-wx-title">{a.title}</div>
            <div className="guidance-wx-detail">{a.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FertTab({ fertilization, t, weather }) {
  const alerts = [];
  if (weather) {
    const rain7d   = weather.forecast?.slice(0, 2).reduce((s, d) => s + (d.rain_mm ?? 0), 0) ?? 0;
    const humidity = weather.season_avg_humidity ?? weather.current.humidity;
    if (rain7d > 5)
      alerts.push({ type: "warning", icon: "🚫", title: t.wxAvoidFertTitle, detail: tpl(t.wxAvoidFertDetail, rain7d.toFixed(0)) });
    if (humidity > 80)
      alerts.push({ type: "risk", icon: "💧", title: t.wxHighHumFoliarTitle, detail: tpl(t.wxHighHumFoliarDetail, humidity) });
  }
  return (
    <div>
      <WeatherTabBanner alerts={alerts} />
      <div className="fert-list">
        {fertilization.map((f, i) => (
          <div className="fert-card" key={i}>
            <div className="fert-header">
              <span>🌿</span>
              <span>{f.timing}</span>
              {f.day >= 0 && <span className="fert-day">{t.stageDay} {f.day}</span>}
            </div>
            <div className="fert-body">
              <ul className="fert-app-list">
                {f.applications.map((a, j) => (
                  <li key={j}>
                    <span className="fert-mat">{a.material}</span>
                    <span className="fert-rate">{a.rate} · {a.method}</span>
                  </li>
                ))}
              </ul>
              {f.why && <div className="fert-why">💡 {f.why}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IrrigTab({ irrigation, t, weather }) {
  const alerts = [];
  if (weather) {
    const temperature = weather.season_avg_temp     ?? weather.current.temperature;
    const humidity    = weather.season_avg_humidity  ?? weather.current.humidity;
    const rain7d      = weather.forecast?.reduce((s, d) => s + (d.rain_mm ?? 0), 0) ?? 0;
    if (temperature > 35)
      alerts.push({ type: "action", icon: "🌡️", title: t.wxHeatStressTitle, detail: tpl(t.wxHeatStressDetail, temperature.toFixed(1)) });
    if (rain7d > 50)
      alerts.push({ type: "info", icon: "🌧️", title: t.wxHeavyRainTitle, detail: tpl(t.wxHeavyRainDetail, rain7d.toFixed(0)) });
    if (rain7d < 5)
      alerts.push({ type: "warning", icon: "☀️", title: t.wxDryWeekTitle, detail: tpl(t.wxDryWeekDetail, rain7d.toFixed(0)) });
    if (humidity > 85)
      alerts.push({ type: "risk", icon: "💦", title: t.wxHighHumWaterlogTitle, detail: tpl(t.wxHighHumWaterlogDetail, humidity) });
  }
  return (
    <div>
      <WeatherTabBanner alerts={alerts} />
      <div className="irrigation-grid">
        <div className="irrig-item">
          <label>{t.irrigFreq}</label>
          <p>{irrigation.frequency}</p>
        </div>
        <div className="irrig-item">
          <label>{t.irrigMethod}</label>
          <p>{irrigation.method}</p>
        </div>
        {irrigation.critical_stages?.length > 0 && (
          <div className="irrig-item irrig-item--critical">
            <label>{t.criticalStages}</label>
            <p>{irrigation.critical_stages.join(" · ")}</p>
          </div>
        )}
      </div>
      <div className="irrig-sign-list">
        {irrigation.water_stress_signs?.length > 0 && (
          <div className="irrig-sign-group">
            <label>{t.waterStressSigns}</label>
            <ul>{irrigation.water_stress_signs.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
        {irrigation.over_watering_signs?.length > 0 && (
          <div className="irrig-sign-group">
            <label>{t.overWaterSigns}</label>
            <ul>{irrigation.over_watering_signs.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </div>
      {irrigation.notes && <div className="irrig-notes">📝 {irrigation.notes}</div>}
    </div>
  );
}

function ThreatCard({ item, type, t }) {
  const sev = item.severity || "low";
  return (
    <div className="threat-card">
      <div className={`threat-header sev-${sev}`}>
        <span>{type === "risk" ? (RISK_ICONS[item.type] || "⚠️") : SEV_ICONS[sev]}</span>
        <div className="threat-name-group">
          <div className="threat-name">{item.name}</div>
          {item.local_name && <div className="threat-local">{item.local_name}</div>}
          {type === "risk" && item.type && (
            <span className="risk-type-badge">{item.type}</span>
          )}
        </div>
        <span className={`sev-badge sev-${sev}`}>
          {t[`sev${sev.charAt(0).toUpperCase() + sev.slice(1)}`] || sev}
        </span>
      </div>
      <div className="threat-body">
        {item.cause && (
          <div className="threat-row">
            <label>{t.cause}</label><span>{item.cause}</span>
          </div>
        )}
        {(item.symptoms || item.damage || item.description) && (
          <div className="threat-row">
            <label>{item.symptoms ? t.symptoms : item.damage ? t.damage : ""}</label>
            <span>{item.symptoms || item.damage || item.description}</span>
          </div>
        )}
        {item.identification && (
          <div className="threat-row">
            <label>{t.identification}</label><span>{item.identification}</span>
          </div>
        )}
        {(item.favorable_conditions || item.favorable) && (
          <div className="threat-row">
            <label>{t.favorable}</label>
            <span>{item.favorable_conditions || item.favorable}</span>
          </div>
        )}
        {item.signs && (
          <div className="threat-row">
            <label>{t.signs}</label><span>{item.signs}</span>
          </div>
        )}
        {item.prevention && (
          <div className="threat-action-row threat-action-row--prev">
            <div className="threat-action-label">🛡️ {t.prevention}</div>
            <div className="threat-action-text">{item.prevention}</div>
          </div>
        )}
        {(item.treatment || item.mitigation) && (
          <div className="threat-action-row threat-action-row--treat">
            <div className="threat-action-label">💊 {item.treatment ? t.treatment : t.mitigation}</div>
            <div className="threat-action-text">{item.treatment || item.mitigation}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HarvestTab({ harvest, t, daysSince }) {
  const days = harvest.days_after_transplanting || harvest.days_after_sowing || harvest.days_after_planting;

  let countdownEl = null;
  if (days && daysSince !== null) {
    const daysLeft = days.min - daysSince;
    const inWindow = daysSince >= days.min && daysSince <= days.max;
    const past     = daysSince > days.max;
    if (inWindow) {
      countdownEl = <div className="harvest-countdown harvest-countdown--ready">🧺 Harvest window is NOW — days {days.min}–{days.max}</div>;
    } else if (past) {
      countdownEl = <div className="harvest-countdown harvest-countdown--past">⚠️ Harvest window has passed (day {days.max})</div>;
    } else {
      countdownEl = <div className="harvest-countdown harvest-countdown--upcoming">⏳ Harvest in ~{daysLeft} days (day {days.min}–{days.max})</div>;
    }
  }

  return (
    <div>
      {countdownEl}
      {days && (
        <div className="harvest-grid harvest-grid--top">
          <div className="harvest-block harvest-block--highlight">
            <label>{t.calHarvest}</label>
            <p className="harvest-val">{t.stageDay} {days.min} – {days.max}</p>
          </div>
          <div className="harvest-block harvest-block--highlight">
            <label>{t.expectedYield}</label>
            <p className="harvest-val">{harvest.yield || "—"}</p>
          </div>
        </div>
      )}
      <div className="harvest-grid">
        {harvest.indicators?.length > 0 && (
          <div className="harvest-block full-width">
            <label>{t.harvestIndicators}</label>
            <ul className="harvest-indicators">
              {harvest.indicators.map((ind, i) => <li key={i}>{ind}</li>)}
            </ul>
          </div>
        )}
        {harvest.method && (
          <div className="harvest-block">
            <label>{t.harvestMethod}</label>
            <p>{harvest.method}</p>
          </div>
        )}
        {harvest.frequency && (
          <div className="harvest-block">
            <label>{t.harvestFreq}</label>
            <p>{harvest.frequency}</p>
          </div>
        )}
        {harvest.post_harvest && (
          <div className="harvest-block full-width">
            <label>{t.postHarvest}</label>
            <p>{harvest.post_harvest}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty info section (shown before a crop is selected) ───────────────────
const GUIDE_TABS_INFO = [
  { icon: "🌱", en: "Growth Stages",        si: "වර්ධන අදියර",        ta: "வளர்ச்சி நிலைகள்",       desc_en: "Track your crop's journey from germination to harvest with day-by-day stage guidance." },
  { icon: "🌿", en: "Fertilization",        si: "පොහොර",               ta: "உரமிடல்",               desc_en: "Receive a full fertilization schedule with materials, rates, and timing for each stage." },
  { icon: "💧", en: "Irrigation Guide",     si: "ජල කළමනාකරණය",      ta: "நீர்ப்பாசனம்",           desc_en: "Learn watering frequency, method, critical stages, and how to spot stress signs." },
  { icon: "🔴", en: "Disease Management",   si: "රෝග කළමනාකරණය",     ta: "நோய் மேலாண்மை",         desc_en: "Identify threats early with symptoms, severity, prevention tips, and treatments." },
  { icon: "🐛", en: "Pest Management",      si: "කෘමි කළමනාකරණය",    ta: "பூச்சி மேலாண்மை",       desc_en: "Know which pests to watch for, how to identify them, and how to control them." },
  { icon: "🧺", en: "Harvest Guide",        si: "අස්වනු නෙළීම",       ta: "அறுவடை வழிகாட்டி",      desc_en: "Know exactly when and how to harvest, plus post-harvest handling for best quality." },
];

const POPULAR_CROPS = [
  { name: "Tomato",    emoji: "🍅" },
  { name: "Chilli",    emoji: "🌶️" },
  { name: "Cabbage",   emoji: "🥬" },
  { name: "Carrot",    emoji: "🥕" },
  { name: "Brinjal",   emoji: "🍆" },
  { name: "Okra",      emoji: "🥒" },
  { name: "Maize",     emoji: "🌽" },
  { name: "Cowpea",    emoji: "🫘" },
];

function GuidanceEmptyInfo({ lang }) {
  return (
    <div className="guidance-info-state">

      {/* What the guide includes */}
      <div className="guidance-info-header">
        <div className="guidance-info-label">WHAT YOU'LL GET</div>
        <h2 className="guidance-info-title">
          {lang === "si" ? "ඔබේ සම්පූර්ණ ගොවිතැන් මාර්ගෝපදේශය" :
           lang === "ta" ? "உங்கள் முழுமையான விவசாய வழிகாட்டி" :
           "Your complete crop growing guide"}
        </h2>
        <p className="guidance-info-sub">
          {lang === "si" ? "ඔබේ බෝගය සහ රෝපණ දිනය තෝරා ගෙන, බිත්තරයේ සිට අස්වනු නෙළීම දක්වා අනුගත වීමට ඔබට ගැලපෙන සම්පූර්ණ ගොවිතැන් සැලැස්මක් ලබා ගන්න." :
           lang === "ta" ? "உங்கள் பயிரை தேர்ந்தெடுத்து நடவு தேதியை உள்ளிட்டு, நடவு முதல் அறுவடை வரை உங்களுக்கு தனிப்பயனாக்கப்பட்ட விவசாய திட்டத்தை பெறுங்கள்." :
           "Select your crop and planting date above to get a personalised, day-by-day farming plan from sowing to harvest."}
        </p>
      </div>

      <div className="guidance-tabs-preview">
        {GUIDE_TABS_INFO.map((tab, i) => (
          <div key={i} className="guidance-tab-preview-card">
            <div className="guidance-tab-preview-icon">{tab.icon}</div>
            <div className="guidance-tab-preview-title">{tab[lang] || tab.en}</div>
            <div className="guidance-tab-preview-desc">{tab.desc_en}</div>
          </div>
        ))}
      </div>

      {/* Popular crops quick strip */}
      <div className="guidance-popular-section">
        <div className="guidance-info-label" style={{marginBottom:"12px"}}>
          {lang === "si" ? "ජනප්‍රිය බෝග" : lang === "ta" ? "பிரபலமான பயிர்கள்" : "POPULAR CROPS"}
        </div>
        <div className="guidance-popular-crops">
          {POPULAR_CROPS.map(({ name, emoji }) => (
            <div key={name} className="guidance-popular-chip">
              <span>{emoji}</span> {name}
            </div>
          ))}
        </div>
        <p className="guidance-popular-hint">
          {lang === "si" ? "ඉහත ක්ෂේත්‍රයෙන් ඕනෑම බෝගයක් සොයා ගෙන ඔබේ මාර්ගෝපදේශය ජනනය කරන්න." :
           lang === "ta" ? "மேலே உள்ள தேர்வு பட்டியலில் இருந்து எந்த பயிரையும் தேர்ந்தெடுத்து உங்கள் வழிகாட்டியை உருவாக்குங்கள்." :
           "Find any of these and more in the crop dropdown above — then generate your guide."}
        </p>
      </div>

      {/* How it works strip */}
      <div className="guidance-how-strip">
        {[
          { step: "1", icon: "🌾", en: "Select your crop", si: "ඔබේ බෝගය තෝරන්න", ta: "உங்கள் பயிரை தேர்ந்தெடுங்கள்" },
          { step: "2", icon: "📅", en: "Enter planting date", si: "රෝපණ දිනය ඇතුළත් කරන්න", ta: "நடவு தேதியை உள்ளிடுங்கள்" },
          { step: "3", icon: "✨", en: "Generate your guide", si: "ඔබේ මාර්ගෝපදේශය ජනනය කරන්න", ta: "உங்கள் வழிகாட்டியை உருவாக்குங்கள்" },
          { step: "4", icon: "📋", en: "Follow the daily plan", si: "දෛනික සැලැස්ම අනුගමනය කරන්න", ta: "தினசரி திட்டத்தை பின்பற்றுங்கள்" },
        ].map(({ step, icon, en, si, ta }) => (
          <div key={step} className="guidance-how-step">
            <div className="guidance-how-num">{step}</div>
            <div className="guidance-how-icon">{icon}</div>
            <div className="guidance-how-text">{lang === "si" ? si : lang === "ta" ? ta : en}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Selector screen ────────────────────────────────────────────────────────
function GuidanceSelector({ t, lang, onSelect }) {
  const [crops, setCrops]   = useState([]);
  const [crop, setCrop]     = useState("");
  const [date, setDate]     = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/guidance`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => setCrops(d.crops || []))
      .catch(() => {});
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!crop) return;
    onSelect(crop, date || null);
  }

  return (
    <form className="guidance-selector" onSubmit={handleSubmit}>
      <div className="guidance-selector-header">
        <div className="guidance-selector-icon">📖</div>
        <div>
          <h2>{t.guidanceTitle}</h2>
          <p>{t.guidanceSub}</p>
        </div>
      </div>
      <div className="guidance-selector-body">
        <div className="guidance-selector-row">
          <div>
            <label>{t.selectCrop}</label>
            <select value={crop} onChange={e => setCrop(e.target.value)} required>
              <option value="">{t.selectCropPh}</option>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>{t.plantingDate} <span className="label-hint">({t.plantingDateHint})</span></label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
        <button className="guidance-generate-btn" type="submit" disabled={!crop}>
          🌱 {t.generateGuide}
        </button>
      </div>
    </form>
  );
}

// ── Detail screen ──────────────────────────────────────────────────────────
function GuidanceDetail({ cropName, plantingDate, t, onBack, weather }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("growthStages");
  const daysSince = daysSincePlanting(plantingDate);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/guidance/${encodeURIComponent(cropName)}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { setData(d.data ?? null); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [cropName]);

  if (loading) return <div className="guidance-empty"><p>{t.guidanceLoading}</p></div>;
  if (!data)   return <div className="guidance-empty"><p>{t.guidanceNotFound}</p></div>;

  const tabContent = () => {
    switch (tab) {
      case "growthStages":   return <StagesTab stages={data.stages || []} daysSince={daysSince} t={t} />;
      case "fertilization":  return <FertTab   fertilization={data.fertilization || []} t={t} weather={weather} />;
      case "irrigationGuide":return <IrrigTab  irrigation={data.irrigation || {}} t={t} weather={weather} />;
      case "diseaseMgmt": {
        const diseaseAlerts = [];
        if (weather) {
          const dTemp = weather.season_avg_temp     ?? weather.current.temperature;
          const dHum  = weather.season_avg_humidity  ?? weather.current.humidity;
          if (dHum > 80)
            diseaseAlerts.push({ type: "risk", icon: "🦠", title: t.wxDiseaseFungalTitle, detail: tpl(t.wxDiseaseFungalDetail, dHum) });
          if (dTemp > 30 && dHum > 70)
            diseaseAlerts.push({ type: "warning", icon: "🌡️", title: t.wxWarmHumidPathTitle, detail: tpl(t.wxWarmHumidPathDetail, dTemp.toFixed(1)) });
        }
        return (
          <div>
            <WeatherTabBanner alerts={diseaseAlerts} />
            <div className="threat-list">
              {(data.diseases || []).map((d, i) => <ThreatCard key={i} item={d} type="disease" t={t} />)}
            </div>
          </div>
        );
      }
      case "pestMgmt": {
        const pestAlerts = [];
        if (weather) {
          const pTemp = weather.season_avg_temp     ?? weather.current.temperature;
          const pHum  = weather.season_avg_humidity  ?? weather.current.humidity;
          if (weather.current.wind_kph > 30)
            pestAlerts.push({ type: "warning", icon: "💨", title: t.wxHighWindTitle, detail: tpl(t.wxHighWindDetail, weather.current.wind_kph.toFixed(0)) });
          const rain2d = weather.forecast?.slice(0, 2).reduce((s, d) => s + (d.rain_mm ?? 0), 0) ?? 0;
          if (rain2d > 5)
            pestAlerts.push({ type: "warning", icon: "🌧️", title: t.wxRainDelayPestTitle, detail: tpl(t.wxRainDelayPestDetail, rain2d.toFixed(0)) });
          if (pTemp > 32 && pHum > 70)
            pestAlerts.push({ type: "risk", icon: "🐛", title: t.wxPestActivityTitle, detail: tpl(t.wxPestActivityDetail, pTemp.toFixed(1), pHum) });
        }
        return (
          <div>
            <WeatherTabBanner alerts={pestAlerts} />
            <div className="threat-list">
              {(data.pests || []).map((p, i) => <ThreatCard key={i} item={p} type="pest" t={t} />)}
            </div>
          </div>
        );
      }
      case "riskFactors":    return (
        <div className="threat-list">
          {(data.risks || []).map((r, i) => <ThreatCard key={i} item={r} type="risk" t={t} />)}
        </div>
      );
      case "harvestGuide":   return <HarvestTab harvest={data.harvest || {}} t={t} daysSince={daysSince} />;
      default: return null;
    }
  };

  return (
    <div>
      <button className="guidance-back-btn" onClick={onBack}>← {t.backToCrops}</button>

      {/* Crop header */}
      <div className="guidance-crop-header">
        <h1>
          {cropName}
          {data.local_name && <span className="crop-local-name"> · {data.local_name}</span>}
        </h1>
        {data.scientific_name && <p className="sci-name"><em>{data.scientific_name}</em>{data.family ? ` · ${data.family}` : ""}</p>}
        <div className="guidance-crop-meta">
          {data.duration && (
            <span>⏱ {data.duration.min}–{data.duration.max} {t.noDays}</span>
          )}
          {data.spacing && (
            <span>📐 {data.spacing.row_cm}×{data.spacing.plant_cm} cm</span>
          )}
          {data.propagation && <span>🌱 {data.propagation}</span>}
          {plantingDate && daysSince !== null && (
            <span>📅 {t.stageDay} {daysSince} {t.noDays}</span>
          )}
        </div>
      </div>

      {/* Overview */}
      {data.overview && (
        <div className="guidance-overview">{data.overview}</div>
      )}

      {/* Zones */}
      {data.zones?.length > 0 && (
        <div className="guidance-zones-row">
          <span className="guidance-zones-label">🗺 {t.suitableZones}</span>
          <div className="guidance-zone-chips">
            {data.zones.map(z => (
              <span key={z} className="guidance-zone-chip">{z}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="guidance-tabs">
        {TABS.map(key => {
          const count =
            key === "diseaseMgmt" ? (data.diseases || []).length :
            key === "pestMgmt"    ? (data.pests    || []).length :
            key === "riskFactors" ? (data.risks    || []).length : 0;
          return (
            <button
              key={key}
              className={`guidance-tab-btn${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              <span className="tab-btn-icon">{TAB_ICONS[key]}</span>
              <span className="tab-btn-label">{t[key] || key}</span>
              {count > 0 && <span className="tab-count-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="guidance-section">
        <div className="guidance-section-hdr">
          <span className="guidance-section-hdr-icon">
            {{
              growthStages:   "📅",
              fertilization:  "🌿",
              irrigationGuide:"💧",
              diseaseMgmt:    "🦠",
              pestMgmt:       "🐛",
              riskFactors:    "⚠️",
              harvestGuide:   "🧺",
            }[tab]}
          </span>
          <span className="guidance-section-hdr-text">{t[tab]}</span>
        </div>
        <div className="guidance-section-body">
          {tabContent()}
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function CropGuidance({ lang, t, weather, setWeather }) {
  const [mode, setMode]                 = useState("guide");   // guide | cultivations
  const [selected, setSelected]         = useState(null);
  const [plantingDate, setPlantingDate] = useState(null);
  const { user } = getAuthSession();
  const isLandOwner = user?.role === 'Land Owner';

  const handleSelect = useCallback((crop, date) => {
    setSelected(crop);
    setPlantingDate(date);
  }, []);

  const handleBack = useCallback(() => {
    setSelected(null);
    setPlantingDate(null);
  }, []);

  return (
    <div className="guidance-page">
      <WeatherLocationPicker weather={weather} onWeatherFetched={setWeather} t={t} lang={lang} />

      {/* Top-level mode switcher */}
      <div className="guidance-mode-tabs">
        <button
          className={`guidance-mode-tab${mode === "guide" ? " active" : ""}`}
          onClick={() => setMode("guide")}
        >
          📖 {t.cropGuideTab}
        </button>
        <button
          className={`guidance-mode-tab${mode === "cultivations" ? " active" : ""}`}
          onClick={() => setMode("cultivations")}
        >
          🌱 {t.myCultivations}{!isLandOwner ? " 🔒" : ""}
        </button>
      </div>

      {mode === "guide" ? (
        !selected
          ? <>
              <GuidanceSelector t={t} lang={lang} onSelect={handleSelect} />
              <GuidanceEmptyInfo lang={lang} />
            </>
          : <GuidanceDetail   cropName={selected} plantingDate={plantingDate} t={t} onBack={handleBack} weather={weather} />
      ) : !isLandOwner ? (
        <div className="cult-auth-wall">
          <div className="cult-auth-wall__icon">🔒</div>
          <h2 className="cult-auth-wall__title">Land Owner Access Only</h2>
          <p className="cult-auth-wall__desc">
            My Cultivations is a personal scheduling tool for registered Land Owners.
            Log in with a Land Owner account to track your crop calendar, manage tasks, and monitor harvest progress.
          </p>
          <div className="cult-auth-wall__actions">
            <Link className="button button--primary" to="/login">Log in as Land Owner</Link>
            <Link className="button button--outline" to="/register">Register</Link>
          </div>
        </div>
      ) : (
        <CultivationTracker t={t} lang={lang} userId={String(user.id)} />
      )}
    </div>
  );
}
