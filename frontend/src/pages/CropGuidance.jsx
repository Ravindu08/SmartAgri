import { useState, useEffect, useCallback } from "react";
import { ML_BASE_URL } from "../services/api";
import { Link, useSearchParams } from "react-router";
import CultivationTracker from "../components/CultivationTracker";
import WeatherLocationPicker from "../components/WeatherLocationPicker";
import { getAuthSession } from "../services/api";
import "../styles/CropGuidance.css";
import "../styles/tool-cg.css";
import { ArrowLeft, BookOpen, Bug, CalendarDays, Check, CloudSun, Droplets, FlaskConical, Lock, Search, ShieldAlert, ShoppingBasket, Sprout, TriangleAlert } from "lucide-react";
import ToolSwitcher from "../components/ToolSwitcher";
import ToolIntro from "../components/ToolIntro";
import { getCropLabel, CROP_EMOJI } from "../data/cropData";
import { ZONE_LABELS, FERT_TIMING_LABELS, STAGE_NAME_LABELS, PROPAGATION_LABELS } from "../data/translations";
import SpotlightTour   from "../components/tour/SpotlightTour";
import HelpButton      from "../components/tour/HelpButton";

const API_BASE = ML_BASE_URL;

const CG_TOUR_T = {
  en: {
    steps: [
      { target: 'cg-mode-tabs', title: 'Two modes', body: 'Switch between browsing the crop guide and tracking your own cultivations.' },
      { target: 'cg-crop-select', title: 'Pick a crop', body: 'Choose any of the 41 supported crops to see its full growing guide.' },
      { target: 'cg-generate-btn', title: 'Generate the guide', body: 'This opens a stage-by-stage plan — fertilisation, irrigation, pest control and harvest tips.' },
      { target: 'cg-zones', title: 'Suitable growing zones', body: "See at a glance whether your area's agro-climatic zone matches this crop." },
      { target: 'cg-tab-nav', title: 'Explore each stage', body: 'Once a guide is open, use these tabs to jump between growth stages, fertilization, irrigation, and more.' },
      { target: 'cg-tab-content', title: 'One panel, many topics', body: 'This panel updates with the tab you pick — fertiliser schedule, irrigation timing, pest and disease alerts, or harvest readiness.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'cg-mode-tabs', title: 'ප්‍රකාර දෙකක්', body: 'බෝග මාර්ගෝපදේශය පිරික්සීම සහ ඔබේම වගාවන් නිරීක්ෂණය කිරීම අතර මාරු වන්න.' },
      { target: 'cg-crop-select', title: 'බෝගයක් තෝරන්න', body: 'සම්පූර්ණ වගා මාර්ගෝපදේශය බැලීමට සහාය දක්වන බෝග 41න් ඕනෑම එකක් තෝරන්න.' },
      { target: 'cg-generate-btn', title: 'මාර්ගෝපදේශය ජනනය කරන්න', body: 'මෙය අදියරෙන් අදියර සැලැස්මක් විවෘත කරයි — පොහොර, ජලය, පළිබෝධ පාලනය සහ අස්වනු ඉඟි.' },
      { target: 'cg-zones', title: 'සුදුසු වගා කලාප', body: 'ඔබේ ප්‍රදේශයේ කෘෂි-දේශගුණික කලාපය මෙම බෝගයට ගැලපෙනවාදැයි එක් බැල්මකින් බලන්න.' },
      { target: 'cg-tab-nav', title: 'සෑම අදියරක්ම ගවේෂණය කරන්න', body: 'මාර්ගෝපදේශයක් විවෘත වූ පසු, වර්ධන අදියර, පොහොර යෙදීම, ජලය සහ තවත් දේ අතර මාරු වීමට මෙම ටැබ් භාවිතා කරන්න.' },
      { target: 'cg-tab-content', title: 'එක් පැනලයක්, මාතෘකා රැසක්', body: 'ඔබ තෝරන ටැබය අනුව මෙම පැනලය යාවත්කාලීන වේ — පොහොර කාලසටහන, ජලය දීමේ වේලාව, පළිබෝධ සහ රෝග ඇඟවීම්, හෝ අස්වනු නෙළීමේ සූදානම.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'cg-mode-tabs', title: 'இரண்டு பயன்முறைகள்', body: 'பயிர் வழிகாட்டியை உலாவுவதற்கும் உங்கள் சொந்த சாகுபடிகளை கண்காணிப்பதற்கும் இடையே மாறவும்.' },
      { target: 'cg-crop-select', title: 'ஒரு பயிரைத் தேர்வு செய்யுங்கள்', body: 'ஆதரிக்கப்படும் 41 பயிர்களில் ஏதேனும் ஒன்றைத் தேர்ந்தெடுத்து அதன் முழு வளர்ப்பு வழிகாட்டியைப் பாருங்கள்.' },
      { target: 'cg-generate-btn', title: 'வழிகாட்டியை உருவாக்குங்கள்', body: 'இது நிலைவாரியான திட்டத்தைத் திறக்கும் — உரமிடுதல், நீர்ப்பாசனம், பூச்சி கட்டுப்பாடு மற்றும் அறுவடை குறிப்புகள்.' },
      { target: 'cg-zones', title: 'பொருத்தமான வளர்ப்பு மண்டலங்கள்', body: 'உங்கள் பகுதியின் வேளாண்-காலநிலை மண்டலம் இந்த பயிருக்குப் பொருந்துகிறதா என்பதை ஒரே பார்வையில் பாருங்கள்.' },
      { target: 'cg-tab-nav', title: 'ஒவ்வொரு நிலையையும் ஆராயுங்கள்', body: 'ஒரு வழிகாட்டி திறந்தவுடன், வளர்ச்சி நிலைகள், உரமிடுதல், நீர்ப்பாசனம் மற்றும் பலவற்றுக்கு இடையே செல்ல இந்த தாவல்களைப் பயன்படுத்துங்கள்.' },
      { target: 'cg-tab-content', title: 'ஒரு பலகம், பல தலைப்புகள்', body: 'நீங்கள் தேர்ந்தெடுக்கும் தாவலுக்கு ஏற்ப இந்த பலகம் புதுப்பிக்கப்படும் — உர அட்டவணை, நீர்ப்பாசன நேரம், பூச்சி மற்றும் நோய் எச்சரிக்கைகள், அல்லது அறுவடை தயார்நிலை.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

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

// Substitutes {0}, {1}, ... in a translation string with provided values
function tpl(str, ...vals) {
  return str.replace(/\{(\d+)\}/g, (_, i) => vals[i] ?? "");
}

// Picks the lang-specific field (_si / _ta), falls back to the English field
function tF(obj, key, lang) {
  if (!obj) return "";
  if (lang !== "en") {
    const loc = obj[`${key}_${lang}`];
    if (loc) return loc;
  }
  return obj[key] ?? "";
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

function ActivityCard({ act, daysSince, t, lang }) {
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
        <div className="activity-title">{tF(act, "title", lang)}</div>
        <div className="activity-desc">{tF(act, "description", lang)}</div>
        {act.why && (
          <div className="activity-why">
            <span className="activity-why-label">{t.actWhy}:</span>
            {tF(act, "why", lang)}
          </div>
        )}
      </div>
    </div>
  );
}

function StagesTab({ stages, daysSince, t, lang }) {
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
                <div className="stage-name">{STAGE_NAME_LABELS[lang]?.[stage.name] || stage.name}</div>
                <div className="stage-days">
                  {stage.day_start < 0
                    ? `${Math.abs(stage.day_start)} ${t.noDays} ${t.beforePlanting} → ${t.stageDay} 0`
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
                {stage.description && <p className="stage-desc">{tF(stage, "description", lang)}</p>}
                <div className="stage-activities-label">
                  {t.stageActivities}
                </div>
                <div className="activity-list">
                  {stage.activities.map((act, j) => (
                    <ActivityCard key={j} act={act} daysSince={daysSince} t={t} lang={lang} />
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

function FertTab({ fertilization, t, weather, lang }) {
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
              <span>{FERT_TIMING_LABELS[lang]?.[f.timing] || f.timing}</span>
              {f.day >= 0 && <span className="fert-day">{t.stageDay} {f.day}</span>}
            </div>
            <div className="fert-body">
              <ul className="fert-app-list">
                {f.applications.map((a, j) => (
                  <li key={j}>
                    <span className="fert-mat">{tF(a, "material", lang)}</span>
                    <span className="fert-rate">{tF(a, "rate", lang)} · {tF(a, "method", lang)}</span>
                  </li>
                ))}
              </ul>
              {f.why && <div className="fert-why">💡 {tF(f, "why", lang)}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IrrigTab({ irrigation, t, weather, lang }) {
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
          <p>{tF(irrigation, "frequency", lang)}</p>
        </div>
        <div className="irrig-item">
          <label>{t.irrigMethod}</label>
          <p>{tF(irrigation, "method", lang)}</p>
        </div>
        {irrigation.critical_stages?.length > 0 && (
          <div className="irrig-item irrig-item--critical">
            <label>{t.criticalStages}</label>
            <p>{(tF(irrigation, "critical_stages_text", lang) || irrigation.critical_stages.join(" · "))}</p>
          </div>
        )}
      </div>
      <div className="irrig-sign-list">
        {irrigation.water_stress_signs?.length > 0 && (
          <div className="irrig-sign-group">
            <label>{t.waterStressSigns}</label>
            <ul>{(lang !== "en" && irrigation[`water_stress_signs_${lang}`] || irrigation.water_stress_signs).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
        {irrigation.over_watering_signs?.length > 0 && (
          <div className="irrig-sign-group">
            <label>{t.overWaterSigns}</label>
            <ul>{(lang !== "en" && irrigation[`over_watering_signs_${lang}`] || irrigation.over_watering_signs).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </div>
      {irrigation.notes && <div className="irrig-notes">📝 {tF(irrigation, "notes", lang)}</div>}
    </div>
  );
}

function ThreatCard({ item, type, t, lang }) {
  const sev = item.severity || "low";
  return (
    <div className="threat-card">
      <div className={`threat-header sev-${sev}`}>
        <span>{type === "risk" ? (RISK_ICONS[item.type] || "⚠️") : SEV_ICONS[sev]}</span>
        <div className="threat-name-group">
          <div className="threat-name">{tF(item, "name", lang)}</div>
          {item.local_name && <div className="threat-local">{tF(item, "local_name", lang)}</div>}
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
            <label>{t.cause}</label><span>{tF(item, "cause", lang)}</span>
          </div>
        )}
        {(item.symptoms || item.damage || item.description) && (
          <div className="threat-row">
            <label>{item.symptoms ? t.symptoms : item.damage ? t.damage : ""}</label>
            <span>{tF(item, "symptoms", lang) || tF(item, "damage", lang) || tF(item, "description", lang)}</span>
          </div>
        )}
        {item.identification && (
          <div className="threat-row">
            <label>{t.identification}</label><span>{tF(item, "identification", lang)}</span>
          </div>
        )}
        {(item.favorable_conditions || item.favorable) && (
          <div className="threat-row">
            <label>{t.favorable}</label>
            <span>{tF(item, "favorable_conditions", lang) || tF(item, "favorable", lang)}</span>
          </div>
        )}
        {item.signs && (
          <div className="threat-row">
            <label>{t.signs}</label><span>{tF(item, "signs", lang)}</span>
          </div>
        )}
        {item.prevention && (
          <div className="threat-action-row threat-action-row--prev">
            <div className="threat-action-label">🛡️ {t.prevention}</div>
            <div className="threat-action-text">{tF(item, "prevention", lang)}</div>
          </div>
        )}
        {(item.treatment || item.mitigation) && (
          <div className="threat-action-row threat-action-row--treat">
            <div className="threat-action-label">💊 {item.treatment ? t.treatment : t.mitigation}</div>
            <div className="threat-action-text">{tF(item, "treatment", lang) || tF(item, "mitigation", lang)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HarvestTab({ harvest, t, daysSince, lang }) {
  const days = harvest.days_after_transplanting || harvest.days_after_sowing || harvest.days_after_planting;

  let countdownEl = null;
  if (days && daysSince !== null) {
    const daysLeft = days.min - daysSince;
    const inWindow = daysSince >= days.min && daysSince <= days.max;
    const past     = daysSince > days.max;
    if (inWindow) {
      countdownEl = <div className="harvest-countdown harvest-countdown--ready">{t.harvestWindowNow(days.min, days.max)}</div>;
    } else if (past) {
      countdownEl = <div className="harvest-countdown harvest-countdown--past">{t.harvestWindowPast(days.max)}</div>;
    } else {
      countdownEl = <div className="harvest-countdown harvest-countdown--upcoming">{t.harvestWindowIn(daysLeft, days.min, days.max)}</div>;
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
              {(lang !== "en" && harvest[`indicators_${lang}`] || harvest.indicators).map((ind, i) => <li key={i}>{ind}</li>)}
            </ul>
          </div>
        )}
        {harvest.method && (
          <div className="harvest-block">
            <label>{t.harvestMethod}</label>
            <p>{tF(harvest, "method", lang)}</p>
          </div>
        )}
        {harvest.frequency && (
          <div className="harvest-block">
            <label>{t.harvestFreq}</label>
            <p>{tF(harvest, "frequency", lang)}</p>
          </div>
        )}
        {harvest.post_harvest && (
          <div className="harvest-block full-width">
            <label>{t.postHarvest}</label>
            <p>{tF(harvest, "post_harvest", lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty info section (shown before a crop is selected) ───────────────────
const GUIDE_TABS_INFO = [
  { icon: "🌱", en: "Growth Stages",        si: "වර්ධන අදියර",        ta: "வளர்ச்சி நிலைகள்",
    desc_en: "Track your crop's journey from germination to harvest with day-by-day stage guidance.",
    desc_si: "දිනෙන් දින අදියර මාර්ගෝපදේශය සමඟ බිත්තරයේ සිට අස්වනු නෙළීම දක්වා ඔබේ බෝගයේ ගමන ලුහුබඳින්න.",
    desc_ta: "நாள்தோறும் நிலை வழிகாட்டுதல்களுடன் முளைத்தலில் இருந்து அறுவடை வரை உங்கள் பயிரின் பயணத்தை கண்காணிக்கவும்." },
  { icon: "🌿", en: "Fertilization",        si: "පොහොර",               ta: "உரமிடல்",
    desc_en: "Receive a full fertilization schedule with materials, rates, and timing for each stage.",
    desc_si: "සෑම අදියරක් සඳහාම ද්‍රව්‍ය, අනුපාත සහ කාලය සහිත සම්පූර්ණ පොහොර සිනිදුව ලබා ගන්න.",
    desc_ta: "ஒவ்வொரு நிலைக்கும் பொருட்கள், விகிதங்கள் மற்றும் நேரங்களுடன் முழுமையான உரமிடல் அட்டவணை பெறுங்கள்." },
  { icon: "💧", en: "Irrigation Guide",     si: "ජල කළමනාකරණය",      ta: "நீர்ப்பாசனம்",
    desc_en: "Learn watering frequency, method, critical stages, and how to spot stress signs.",
    desc_si: "ජල දැමීමේ වාර ගණන, ක්‍රමය, ජීවිතාන්ත අදියර සහ ආතතිය දිරිගැන්වීමේ ලකුණු හඳුනා ගන්න.",
    desc_ta: "நீர் பாய்ச்சும் அதிர்வெண், முறை, முக்கிய நிலைகள் மற்றும் அழுத்த அறிகுறிகளை கண்டறியுங்கள்." },
  { icon: "🔴", en: "Disease Management",   si: "රෝග කළමනාකරණය",     ta: "நோய் மேலாண்மை",
    desc_en: "Identify threats early with symptoms, severity, prevention tips, and treatments.",
    desc_si: "රෝග ලක්ෂණ, බරපතලකම, වැළැක්වීමේ ඉඟි සහ ප්‍රතිකාර සමඟ තර්ජන කලාත්මකව හඳුනා ගන්න.",
    desc_ta: "அறிகுறிகள், தீவிரம், தடுப்பு குறிப்புகள் மற்றும் சிகிச்சைகளுடன் அச்சுறுத்தல்களை முன்கூட்டியே கண்டறியுங்கள்." },
  { icon: "🐛", en: "Pest Management",      si: "කෘමි කළමනාකරණය",    ta: "பூச்சி மேலாண்மை",
    desc_en: "Know which pests to watch for, how to identify them, and how to control them.",
    desc_si: "කුමන කෘමීන් නිරීක්ෂණය කළ යුතුද, ඒවා හඳුනා ගන්නේ කෙසේද සහ ඒවා පාලනය කරන්නේ කෙසේද දැන ගන්න.",
    desc_ta: "எந்த பூச்சிகளை கவனிக்க வேண்டும், அவற்றை எவ்வாறு அடையாளம் காண்பது மற்றும் கட்டுப்படுத்துவது என்பதை அறியுங்கள்." },
  { icon: "🧺", en: "Harvest Guide",        si: "අස්වනු නෙළීම",       ta: "அறுவடை வழிகாட்டி",
    desc_en: "Know exactly when and how to harvest, plus post-harvest handling for best quality.",
    desc_si: "කවදා, කෙසේ අස්වනු නෙළිය යුතුද සහ හොඳම ගුණාත්මකභාවය සඳහා අස්වනු-නෙළීමෙන් පසු හැසිරවීම දැන ගන්න.",
    desc_ta: "எப்போது, எவ்வாறு அறுவடை செய்வது மற்றும் சிறந்த தரத்திற்காக அறுவடைக்கு பிந்தைய கையாளுதலை அறியுங்கள்." },
];

// Icon for each guide tab, shared by the tab bar and the "what every guide
// includes" tiles.
const TAB_LOOK = {
  growthStages:    { Icon: Sprout, },
  fertilization:   { Icon: FlaskConical, },
  irrigationGuide: { Icon: Droplets, },
  diseaseMgmt:     { Icon: ShieldAlert, },
  pestMgmt:        { Icon: Bug, },
  riskFactors:     { Icon: TriangleAlert, },
  harvestGuide:    { Icon: ShoppingBasket, },
};
// GUIDE_TABS_INFO lists six of the tabs, in this order.
const INFO_TABS = ["growthStages", "fertilization", "irrigationGuide", "diseaseMgmt", "pestMgmt", "harvestGuide"];

const CG2 = {
  en: {
    pickT: "Pick a crop", pickS: "crops with full growing guides", search: "Search crops", none: "No crop matches that search.",
    dateL: "Planting date (optional)", dateH: "Add it to see which stage your crop is in today.",
    wxT: "District for weather alerts",
    getsT: "What every guide includes", getsS: "Six sections, from planting to harvest",
    journey: "The growing journey", journeyS: "Tap a stage to read it",
    nowT: "Where you are now", dayOf: "Day {0} of {1}", stageOf: "Stage {0} of {1}",
    next: "Coming up next", daysLeft: "Days left in this stage",
    notStarted: "Not planted yet", finished: "Past the harvest window",
    duration: "Duration", spacing: "Spacing", propagation: "Propagation", today: "Today",
    fitT: "Weather fit", fitS: "How today's weather affects this crop", fitNone: "Pick your district to see weather alerts for this crop.",
    fitOk: "No weather alerts for this crop right now.", temp: "Season temp", hum: "Humidity", rain2d: "Rain, next 2 days",
  },
  si: {
    pickT: "බෝගයක් තෝරන්න", pickS: "බෝග සඳහා සම්පූර්ණ වගා මාර්ගෝපදේශ", search: "බෝග සොයන්න", none: "එම සෙවුමට ගැලපෙන බෝගයක් නැත.",
    dateL: "සිටුවූ දිනය (විකල්ප)", dateH: "ඔබේ බෝගය අද කුමන අදියරේද යන්න බැලීමට එය එක් කරන්න.",
    wxT: "කාලගුණ ඇඟවීම් සඳහා දිස්ත්‍රික්කය",
    getsT: "සෑම මාර්ගෝපදේශයකම ඇතුළත් දේ", getsS: "සිටුවීමේ සිට අස්වැන්න දක්වා කොටස් හයක්",
    journey: "වගා ගමන", journeyS: "කියවීමට අදියරක් තට්ටු කරන්න",
    nowT: "ඔබ දැන් සිටින තැන", dayOf: "දින {1}න් {0} වන දිනය", stageOf: "අදියර {1}න් {0}",
    next: "ඊළඟට එන දේ", daysLeft: "මෙම අදියරේ ඉතිරි දින",
    notStarted: "තවම සිටුවා නැත", finished: "අස්වනු කාලය ඉක්මවා ඇත",
    duration: "කාලසීමාව", spacing: "පරතරය", propagation: "ප්‍රචාරණය", today: "අද",
    fitT: "කාලගුණ ගැළපීම", fitS: "අද කාලගුණය මෙම බෝගයට බලපාන ආකාරය", fitNone: "මෙම බෝගය සඳහා කාලගුණ ඇඟවීම් බැලීමට ඔබේ දිස්ත්‍රික්කය තෝරන්න.",
    fitOk: "මෙම බෝගය සඳහා දැනට කාලගුණ ඇඟවීම් නැත.", temp: "කන්නයේ උෂ්ණත්වය", hum: "ආර්ද්‍රතාවය", rain2d: "ඉදිරි දින 2 වර්ෂාව",
  },
  ta: {
    pickT: "ஒரு பயிரைத் தேர்ந்தெடுங்கள்", pickS: "பயிர்களுக்கு முழுமையான வளர்ப்பு வழிகாட்டிகள்", search: "பயிர்களைத் தேடுங்கள்", none: "அந்தத் தேடலுக்குப் பொருந்தும் பயிர் இல்லை.",
    dateL: "நடவு தேதி (விருப்பம்)", dateH: "உங்கள் பயிர் இன்று எந்த நிலையில் உள்ளது என்பதைக் காண இதைச் சேர்க்கவும்.",
    wxT: "வானிலை எச்சரிக்கைகளுக்கான மாவட்டம்",
    getsT: "ஒவ்வொரு வழிகாட்டியிலும் உள்ளவை", getsS: "நடவு முதல் அறுவடை வரை ஆறு பிரிவுகள்",
    journey: "வளர்ச்சிப் பயணம்", journeyS: "படிக்க ஒரு நிலையைத் தட்டவும்",
    nowT: "நீங்கள் இப்போது இருக்கும் இடம்", dayOf: "{1} நாட்களில் {0}வது நாள்", stageOf: "{1} நிலைகளில் {0}",
    next: "அடுத்து வருபவை", daysLeft: "இந்த நிலையில் மீதமுள்ள நாட்கள்",
    notStarted: "இன்னும் நடவு செய்யப்படவில்லை", finished: "அறுவடைக் காலம் கடந்துவிட்டது",
    duration: "காலம்", spacing: "இடைவெளி", propagation: "இனப்பெருக்கம்", today: "இன்று",
    fitT: "வானிலை பொருத்தம்", fitS: "இன்றைய வானிலை இந்தப் பயிரை எவ்வாறு பாதிக்கிறது", fitNone: "இந்தப் பயிருக்கான வானிலை எச்சரிக்கைகளைக் காண உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்.",
    fitOk: "இந்தப் பயிருக்கு தற்போது வானிலை எச்சரிக்கைகள் இல்லை.", temp: "பருவ வெப்பநிலை", hum: "ஈரப்பதம்", rain2d: "அடுத்த 2 நாட்கள் மழை",
  },
};

// ── Crop picker ────────────────────────────────────────────────────────────
function GuideCropPicker({ lang, onSelect }) {
  const c = CG2[lang] || CG2.en;
  const [crops, setCrops] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/guidance`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => setCrops(d.crops || []))
      .catch(() => {});
  }, []);

  // Matches the English name as well as the translated one.
  const q = query.trim().toLowerCase();
  const shown = q
    ? crops.filter(name => name.toLowerCase().includes(q) || getCropLabel(name, lang).toLowerCase().includes(q))
    : crops;

  return (
    <section className="tu-card tu-rise">
      <div className="tu-head">
        <span className="tu-ic tu-ic--sm"><Search size={18} /></span>
        <div><h2>{c.pickT}</h2><small>{crops.length} {c.pickS}</small></div>
      </div>
      <div className="cg2-search">
        <Search size={16} />
        <input className="tu-input" type="search" placeholder={c.search} value={query} onChange={e => setQuery(e.target.value)} aria-label={c.search} />
      </div>
      <div className="cg2-crops" data-tour="cg-crop-select">
        {shown.map(name => (
          <button key={name} type="button" className="cg2-crop" onClick={() => onSelect(name)}>
            <span aria-hidden="true">{CROP_EMOJI[name] || "🌱"}</span>{getCropLabel(name, lang)}
          </button>
        ))}
      </div>
      {crops.length > 0 && shown.length === 0 && <p className="cg2-none">{c.none}</p>}
    </section>
  );
}

// ── Detail screen ──────────────────────────────────────────────────────────
function GuidanceDetail({ cropName, plantingDate, onDateChange, t, lang, onBack, weather, setWeather }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("growthStages");
  const daysSince = daysSincePlanting(plantingDate);

  useEffect(() => {
    // Guarded so switching crops quickly cannot leave the previous crop's
    // guidance on screen under the new crop's heading.
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/guidance/${encodeURIComponent(cropName)}`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { if (!cancelled) { setData(d.data ?? null); setLoading(false); } })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [cropName]);

  if (loading) return <div className="tu-card cg2-state">{t.guidanceLoading}</div>;
  if (!data)   return (
    <div>
      <button className="cg2-back" onClick={onBack}><ArrowLeft size={15} />{t.backToCrops}</button>
      <div className="tu-card cg2-state">{t.guidanceNotFound}</div>
    </div>
  );

  const tabContent = () => {
    switch (tab) {
      case "growthStages":   return <StagesTab stages={data.stages || []} daysSince={daysSince} t={t} lang={lang} />;
      case "fertilization":  return <FertTab   fertilization={data.fertilization || []} t={t} weather={weather} lang={lang} />;
      case "irrigationGuide":return <IrrigTab  irrigation={data.irrigation || {}} t={t} weather={weather} lang={lang} />;
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
              {(data.diseases || []).map((d, i) => <ThreatCard key={i} item={d} type="disease" t={t} lang={lang} />)}
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
              {(data.pests || []).map((p, i) => <ThreatCard key={i} item={p} type="pest" t={t} lang={lang} />)}
            </div>
          </div>
        );
      }
      case "riskFactors":    return (
        <div className="threat-list">
          {(data.risks || []).map((r, i) => <ThreatCard key={i} item={r} type="risk" t={t} lang={lang} />)}
        </div>
      );
      case "harvestGuide":   return <HarvestTab harvest={data.harvest || {}} t={t} daysSince={daysSince} lang={lang} />;
      default: return null;
    }
  };

  const c = CG2[lang] || CG2.en;
  const stages = data.stages || [];
  const lastDay = stages.length ? stages[stages.length - 1].day_end : 0;
  const currentIdx = daysSince === null ? -1 : stages.findIndex(st => daysSince >= st.day_start && daysSince <= st.day_end);
  const current = currentIdx >= 0 ? stages[currentIdx] : null;
  const upcoming = current
    ? (current.activities || []).filter(a => a.day >= daysSince).sort((a, b) => a.day - b.day).slice(0, 4)
    : [];

  const openTab = (key) => {
    setTab(key);
    document.getElementById("cg2-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // The same weather rules the tabs use for their banners, gathered in one place
  // so the crop's weather risks are visible before opening a tab.
  const wxAlerts = [];
  let wxTemp = null, wxHum = null, rain2d = 0;
  if (weather) {
    wxTemp = weather.season_avg_temp     ?? weather.current.temperature;
    wxHum  = weather.season_avg_humidity ?? weather.current.humidity;
    rain2d = weather.forecast?.slice(0, 2).reduce((sum, d) => sum + (d.rain_mm ?? 0), 0) ?? 0;
    if (wxHum > 80)                    wxAlerts.push({ title: t.wxDiseaseFungalTitle, tab: "diseaseMgmt" });
    if (wxTemp > 30 && wxHum > 70)     wxAlerts.push({ title: t.wxWarmHumidPathTitle, tab: "diseaseMgmt" });
    if (weather.current.wind_kph > 30) wxAlerts.push({ title: t.wxHighWindTitle,      tab: "pestMgmt" });
    if (rain2d > 5)                    wxAlerts.push({ title: t.wxRainDelayPestTitle, tab: "pestMgmt" });
    if (wxTemp > 32 && wxHum > 70)     wxAlerts.push({ title: t.wxPestActivityTitle,  tab: "pestMgmt" });
  }

  return (
    <div>
      <button className="cg2-back" onClick={onBack}><ArrowLeft size={15} />{t.backToCrops}</button>

      {/* Crop header */}
      <section className="cg2-hero tu-rise">
        <div className="cg2-hero__e" aria-hidden="true">{CROP_EMOJI[cropName] || "🌱"}</div>
        <div>
          <span className="tu-eyebrow"><BookOpen size={14} />{t.guidanceTitle}</span>
          <h1>
            {getCropLabel(cropName, lang)}
            {lang === 'en' && data.local_name && <small> · {data.local_name}</small>}
          </h1>
          {data.scientific_name && <em>{data.scientific_name}{data.family ? ` · ${data.family}` : ""}</em>}
          {data.overview && <p>{tF(data, "overview", lang)}</p>}
          <div className="cg2-facts">
            {data.duration && <div><small>{c.duration}</small><b>{data.duration.min}–{data.duration.max} {t.noDays}</b></div>}
            {data.spacing && <div><small>{c.spacing}</small><b>{data.spacing.row_cm} × {data.spacing.plant_cm} cm</b></div>}
            {data.propagation && <div><small>{c.propagation}</small><b>{PROPAGATION_LABELS[lang]?.[data.propagation] || data.propagation}</b></div>}
            {daysSince !== null && <div><small>{c.today}</small><b>{t.stageDay} {daysSince}</b></div>}
          </div>
          {data.zones?.length > 0 && (
            <div className="cg2-zones" data-tour="cg-zones">
              {t.suitableZones}
              {data.zones.map(z => <span key={z}>{ZONE_LABELS[lang]?.[z] || z}</span>)}
            </div>
          )}
        </div>
      </section>

      <div className="cg2-two">
        {/* Stage timeline */}
        {stages.length > 0 && (
          <section className="tu-card tu-rise">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><CalendarDays size={18} /></span>
              <div>
                <h2>{daysSince !== null ? c.nowT : c.journey}</h2>
                <small>
                  {daysSince === null ? c.journeyS
                    : daysSince < stages[0].day_start ? c.notStarted
                    : daysSince > lastDay ? c.finished
                    : tpl(c.dayOf, daysSince, lastDay)}
                </small>
              </div>
              {current && <span className="tu-tag tu-tone-amber tu-head__end">{tpl(c.stageOf, currentIdx + 1, stages.length)}</span>}
            </div>
            <div className="cg2-tl" style={{ "--n": stages.length }}>
              {stages.map((st, i) => {
                const cls = stageBadge(st, daysSince, t)?.cls || "";
                return (
                  <button key={st.id} type="button" className={`cg2-st ${cls}`} onClick={() => openTab("growthStages")}>
                    <i>{cls === "done" ? <Check size={20} strokeWidth={3} /> : st.icon || i + 1}</i>
                    <b>{STAGE_NAME_LABELS[lang]?.[st.name] || st.name}</b>
                    <small>{st.day_start < 0
                      ? `${Math.abs(st.day_start)} ${t.noDays} ${t.beforePlanting}`
                      : `${t.stageDay} ${st.day_start}–${st.day_end}`}</small>
                  </button>
                );
              })}
            </div>
            {current && (
              <div className="cg2-stage">
                <div>
                  <h3>{STAGE_NAME_LABELS[lang]?.[current.name] || current.name}</h3>
                  {current.description && <p>{tF(current, "description", lang)}</p>}
                  <div className="tu-tile"><small>{c.daysLeft}</small><b>{current.day_end - daysSince}</b></div>
                </div>
                {upcoming.length > 0 && (
                  <div>
                    <span className="tu-label">{c.next}</span>
                    {upcoming.map((a, i) => (
                      <div className="cg2-todo" key={i}>
                        <i><Check size={14} strokeWidth={3} /></i>
                        <span>{tF(a, "title", lang)}<small>{activityDayLabel(a.day, daysSince, t)}</small></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <label className="cg2-date">
              <span>{c.dateL} — {c.dateH}</span>
              <input className="tu-input" type="date" value={plantingDate || ""} max={new Date().toISOString().slice(0, 10)}
                onChange={e => onDateChange(e.target.value || null)} />
            </label>
          </section>
        )}

        {/* Weather fit */}
        <section className="tu-card tu-rise">
          <div className="tu-head">
            <span className="tu-ic tu-ic--sm"><CloudSun size={18} /></span>
            <div><h2>{c.fitT}</h2><small>{c.fitS}</small></div>
          </div>
          {weather ? (
            <>
              <div className="cg2-wx">
                <div className="tu-tile"><small>{c.temp}</small><b>{Number(wxTemp).toFixed(1)}°</b></div>
                <div className="tu-tile"><small>{c.hum}</small><b>{Math.round(wxHum)}%</b></div>
                <div className="tu-tile"><small>{c.rain2d}</small><b>{rain2d.toFixed(0)} mm</b></div>
              </div>
              {wxAlerts.length > 0 ? (
                <div className="cg2-alerts">
                  {wxAlerts.map((a, i) => (
                    <button key={i} type="button" onClick={() => openTab(a.tab)}><TriangleAlert size={14} color="var(--tu-gold)" />{a.title}</button>
                  ))}
                </div>
              ) : (
                <div className="cg2-ok"><Check size={16} strokeWidth={3} />{c.fitOk}</div>
              )}
            </>
          ) : (
            <p className="cg2-hint" style={{ marginBottom: 12 }}>{c.fitNone}</p>
          )}
          <div style={{ marginTop: 14 }}>
            <WeatherLocationPicker weather={weather} onWeatherFetched={setWeather} t={t} lang={lang} />
          </div>
        </section>
      </div>

      {/* Tab navigation */}
      <div className="cg2-tabs" data-tour="cg-tab-nav">
        {TABS.map(key => {
          const count =
            key === "diseaseMgmt" ? (data.diseases || []).length :
            key === "pestMgmt"    ? (data.pests    || []).length :
            key === "riskFactors" ? (data.risks    || []).length : 0;
          const { Icon } = TAB_LOOK[key];
          return (
            <button key={key} type="button" className="cg2-tab" aria-pressed={tab === key} onClick={() => setTab(key)}>
              <Icon size={16} />{t[key] || key}{count > 0 && <em>{count}</em>}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="tu-card cg2-content" id="cg2-content" data-tour="cg-tab-content">
        {tabContent()}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function CropGuidance({ lang, t, weather, setWeather }) {
  const [mode, setMode]                 = useState("guide");   // guide | cultivations
  // /crop-guidance?crop=Tomato&date=2026-08-30 opens straight on that guide, so
  // the recommendation page can link to the crop it suggested.
  const [params] = useSearchParams();
  const [selected, setSelected]         = useState(() => params.get("crop") || null);
  const [plantingDate, setPlantingDate] = useState(() => (/^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "") ? params.get("date") : null));
  const { user } = getAuthSession();
  const isLandOwner = user?.role === 'Land Owner';

  // The planting date is kept when switching crops; it belongs to the farmer's
  // season, not to one crop's guide.
  const handleSelect = useCallback((crop) => {
    setSelected(crop);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => setSelected(null), []);

  const cgTourT = CG_TOUR_T[lang] || CG_TOUR_T.en;
  const [tourOpen, setTourOpen] = useState(false);

  const c = CG2[lang] || CG2.en;

  return (
    <div className="tu-page tu-tone-teal">
      <ToolSwitcher />

      {/* Top-level mode switcher — hidden when viewing crop detail to reduce visual clutter */}
      {!selected && (
        <div className="cg2-modes" data-tour="cg-mode-tabs">
          <button type="button" aria-pressed={mode === "guide"} onClick={() => setMode("guide")}>
            <BookOpen size={16} />{t.cropGuideTab}
          </button>
          <button type="button" aria-pressed={mode === "cultivations"} onClick={() => setMode("cultivations")}>
            <Sprout size={16} />{t.myCultivations}{!isLandOwner && <Lock size={13} />}
          </button>
        </div>
      )}

      {mode === "guide" ? (
        !selected ? (
          <>
            <ToolIntro tool="guide" />

            <div className="cg2-pick">
              <GuideCropPicker lang={lang} onSelect={handleSelect} />
              <aside className="cg2-side">
                <div className="tu-card">
                  <label className="tu-label" htmlFor="cg2-date">{c.dateL}</label>
                  <input id="cg2-date" className="tu-input" type="date" value={plantingDate || ""} max={new Date().toISOString().slice(0, 10)}
                    onChange={e => setPlantingDate(e.target.value || null)} />
                  <span className="cg2-hint">{c.dateH}</span>
                </div>
                <div className="tu-card">
                  <span className="tu-label">{c.wxT}</span>
                  <WeatherLocationPicker weather={weather} onWeatherFetched={setWeather} t={t} lang={lang} />
                </div>
              </aside>
            </div>

            <section className="tu-sec">
              <div className="tu-head">
                <span className="tu-ic tu-ic--sm"><BookOpen size={18} /></span>
                <div><h2>{c.getsT}</h2><small>{c.getsS}</small></div>
              </div>
              <div className="cg2-gets">
                {GUIDE_TABS_INFO.map((info, i) => {
                  const { Icon } = TAB_LOOK[INFO_TABS[i]];
                  return (
                    <div className="cg2-get" key={i}>
                      <Icon size={24} />
                      <b>{info[lang] || info.en}</b>
                      <p>{info[`desc_${lang}`] || info.desc_en}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <GuidanceDetail cropName={selected} plantingDate={plantingDate} onDateChange={setPlantingDate}
            t={t} lang={lang} onBack={handleBack} weather={weather} setWeather={setWeather} />
        )
      ) : !isLandOwner ? (
        <div className="cult-auth-wall">
          <div className="cult-auth-wall__icon">🔒</div>
          <h2 className="cult-auth-wall__title">{t.guidanceAuthTitle}</h2>
          <p className="cult-auth-wall__desc">{t.guidanceAuthDesc}</p>
          <div className="cult-auth-wall__actions">
            <Link className="button button--primary" to="/login">{t.guidanceAuthLoginBtn}</Link>
            <Link className="button button--outline" to="/register">{t.guidanceAuthRegister}</Link>
          </div>
        </div>
      ) : (
        <CultivationTracker t={t} lang={lang} userId={String(user.id)} />
      )}

      <HelpButton label={cgTourT.needHelp} ariaLabel={cgTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={cgTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: cgTourT.next, back: cgTourT.back, skip: cgTourT.skip, done: cgTourT.done }}
      />
    </div>
  );
}
