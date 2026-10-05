import { useState, useEffect, useCallback } from "react";
import { ML_BASE_URL } from "../services/api";
import { Link, useSearchParams } from "react-router";
import CultivationTracker from "../components/CultivationTracker";
import { getActiveRole, getAuthSession } from "../services/api";
import "../styles/CropGuidance.css";
import "../styles/tool-cg.css";
import { ArrowLeft, BookOpen, Bug, CalendarDays, Check, Droplets, FlaskConical, Lock, Search, ShieldAlert, ShoppingBasket, Sprout, TriangleAlert } from "lucide-react";
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
      { target: 'cg-crop-select', title: "Pick a crop", body: "Search or tap any of the 41 crops. Its full growing guide opens straight away." },
      { target: 'cg-date', title: "Planting date (optional)", body: "Add the day you planted and the guide shows which stage your crop is in today." },
      { target: 'cg-zones', title: 'Suitable growing zones', body: "See at a glance whether your area's agro-climatic zone matches this crop." },
      { target: 'cg-timeline', title: "Where you are now", body: "The crop's stages from land preparation to harvest. With a planting date, the current stage and what comes next are highlighted." },
      { target: 'cg-tab-nav', title: "Explore each topic", body: "Jump between growth stages, fertilization, irrigation, diseases, pests, risks and harvest." },
      { target: 'cg-tab-content', title: "One panel, many topics", body: "This panel shows the tab you picked: what to do at each stage, the fertiliser schedule, irrigation timing, how to handle diseases and pests, or when to harvest." },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'cg-mode-tabs', title: 'ප්‍රකාර දෙකක්', body: 'බෝග මාර්ගෝපදේශය පිරික්සීම සහ ඔබේම වගාවන් නිරීක්ෂණය කිරීම අතර මාරු වන්න.' },
      { target: 'cg-crop-select', title: "බෝගයක් තෝරන්න", body: "බෝග 41න් ඕනෑම එකක් සොයන්න හෝ තට්ටු කරන්න. එහි සම්පූර්ණ වගා මාර්ගෝපදේශය එසැණින් විවෘත වේ." },
      { target: 'cg-date', title: "සිටුවූ දිනය (අත්‍යවශ්‍ය නොවේ)", body: "ඔබ සිටුවූ දිනය එක් කළ විට, ඔබේ බෝගය අද සිටින අදියර මාර්ගෝපදේශය පෙන්වයි." },
      { target: 'cg-zones', title: 'සුදුසු වගා කලාප', body: 'ඔබේ ප්‍රදේශයේ කෘෂි-දේශගුණික කලාපය මෙම බෝගයට ගැලපෙනවාදැයි එක් බැල්මකින් බලන්න.' },
      { target: 'cg-timeline', title: "ඔබ දැන් සිටින තැන", body: "බිම් සැකසීමේ සිට අස්වැන්න දක්වා බෝගයේ අදියර. සිටුවූ දිනයක් ඇති විට, වත්මන් අදියර සහ ඊළඟට එන දේ උද්දීපනය වේ." },
      { target: 'cg-tab-nav', title: "සෑම මාතෘකාවක්ම බලන්න", body: "වර්ධන අදියර, පොහොර, ජලය, රෝග, පළිබෝධ, අවදානම් සහ අස්වැන්න අතර මාරු වන්න." },
      { target: 'cg-tab-content', title: "එක් පුවරුවක්, මාතෘකා රැසක්", body: "මෙම පුවරුව ඔබ තෝරාගත් ටැබය පෙන්වයි: එක් එක් අදියරේ කළ යුතු දේ, පොහොර කාලසටහන, ජල සැපයුම, රෝග සහ පළිබෝධ පාලනය, හෝ අස්වැන්න නෙළන කාලය." },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'cg-mode-tabs', title: 'இரண்டு பயன்முறைகள்', body: 'பயிர் வழிகாட்டியை உலாவுவதற்கும் உங்கள் சொந்த சாகுபடிகளை கண்காணிப்பதற்கும் இடையே மாறவும்.' },
      { target: 'cg-crop-select', title: "ஒரு பயிரைத் தேர்ந்தெடுங்கள்", body: "41 பயிர்களில் எதையும் தேடுங்கள் அல்லது தட்டுங்கள். அதன் முழு வளர்ப்பு வழிகாட்டி உடனே திறக்கும்." },
      { target: 'cg-date', title: "நடவு தேதி (விருப்பம்)", body: "நீங்கள் நட்ட நாளைச் சேர்த்தால், உங்கள் பயிர் இன்று எந்த நிலையில் உள்ளது என்பதை வழிகாட்டி காட்டும்." },
      { target: 'cg-zones', title: 'பொருத்தமான வளர்ப்பு மண்டலங்கள்', body: 'உங்கள் பகுதியின் வேளாண்-காலநிலை மண்டலம் இந்த பயிருக்குப் பொருந்துகிறதா என்பதை ஒரே பார்வையில் பாருங்கள்.' },
      { target: 'cg-timeline', title: "நீங்கள் இப்போது இருக்கும் இடம்", body: "நிலம் தயாரிப்பு முதல் அறுவடை வரை பயிரின் நிலைகள். நடவு தேதி இருந்தால், தற்போதைய நிலையும் அடுத்து வருவதும் சிறப்பித்துக் காட்டப்படும்." },
      { target: 'cg-tab-nav', title: "ஒவ்வொரு தலைப்பையும் பாருங்கள்", body: "வளர்ச்சி நிலைகள், உரமிடல், நீர்ப்பாசனம், நோய்கள், பூச்சிகள், அபாயங்கள் மற்றும் அறுவடை இடையே மாறுங்கள்." },
      { target: 'cg-tab-content', title: "ஒரு பலகை, பல தலைப்புகள்", body: "நீங்கள் தேர்ந்த தாவலை இந்தப் பலகை காட்டுகிறது: ஒவ்வொரு நிலையிலும் செய்ய வேண்டியவை, உர அட்டவணை, நீர்ப்பாசன நேரம், நோய் மற்றும் பூச்சி மேலாண்மை, அல்லது அறுவடை நேரம்." },
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

function FertTab({ fertilization, t, lang }) {
  return (
    <div>
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

function IrrigTab({ irrigation, t, lang }) {
  return (
    <div>
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
    getsT: "What every guide includes", getsS: "Six sections, from planting to harvest",
    journey: "The growing journey", journeyS: "Tap a stage to read it",
    nowT: "Where you are now", dayOf: "Day {0} of {1}", stageOf: "Stage {0} of {1}",
    next: "Coming up next", daysLeft: "Days left in this stage",
    notStarted: "Not planted yet", finished: "Past the harvest window",
    duration: "Duration", spacing: "Spacing", propagation: "Propagation", today: "Today", more: "Read more", less: "Show less",
  },
  si: {
    pickT: "බෝගයක් තෝරන්න", pickS: "බෝග සඳහා සම්පූර්ණ වගා මාර්ගෝපදේශ", search: "බෝග සොයන්න", none: "එම සෙවුමට ගැලපෙන බෝගයක් නැත.",
    dateL: "සිටුවූ දිනය (විකල්ප)", dateH: "ඔබේ බෝගය අද කුමන අදියරේද යන්න බැලීමට එය එක් කරන්න.",
    getsT: "සෑම මාර්ගෝපදේශයකම ඇතුළත් දේ", getsS: "සිටුවීමේ සිට අස්වැන්න දක්වා කොටස් හයක්",
    journey: "වගා ගමන", journeyS: "කියවීමට අදියරක් තට්ටු කරන්න",
    nowT: "ඔබ දැන් සිටින තැන", dayOf: "දින {1}න් {0} වන දිනය", stageOf: "අදියර {1}න් {0}",
    next: "ඊළඟට එන දේ", daysLeft: "මෙම අදියරේ ඉතිරි දින",
    notStarted: "තවම සිටුවා නැත", finished: "අස්වනු කාලය ඉක්මවා ඇත",
    duration: "කාලසීමාව", spacing: "පරතරය", propagation: "ප්‍රචාරණය", today: "අද", more: "තව කියවන්න", less: "අඩුවෙන් පෙන්වන්න",
  },
  ta: {
    pickT: "ஒரு பயிரைத் தேர்ந்தெடுங்கள்", pickS: "பயிர்களுக்கு முழுமையான வளர்ப்பு வழிகாட்டிகள்", search: "பயிர்களைத் தேடுங்கள்", none: "அந்தத் தேடலுக்குப் பொருந்தும் பயிர் இல்லை.",
    dateL: "நடவு தேதி (விருப்பம்)", dateH: "உங்கள் பயிர் இன்று எந்த நிலையில் உள்ளது என்பதைக் காண இதைச் சேர்க்கவும்.",
    getsT: "ஒவ்வொரு வழிகாட்டியிலும் உள்ளவை", getsS: "நடவு முதல் அறுவடை வரை ஆறு பிரிவுகள்",
    journey: "வளர்ச்சிப் பயணம்", journeyS: "படிக்க ஒரு நிலையைத் தட்டவும்",
    nowT: "நீங்கள் இப்போது இருக்கும் இடம்", dayOf: "{1} நாட்களில் {0}வது நாள்", stageOf: "{1} நிலைகளில் {0}",
    next: "அடுத்து வருபவை", daysLeft: "இந்த நிலையில் மீதமுள்ள நாட்கள்",
    notStarted: "இன்னும் நடவு செய்யப்படவில்லை", finished: "அறுவடைக் காலம் கடந்துவிட்டது",
    duration: "காலம்", spacing: "இடைவெளி", propagation: "இனப்பெருக்கம்", today: "இன்று", more: "மேலும் படிக்க", less: "குறைவாகக் காட்டு",
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
function GuidanceDetail({ cropName, plantingDate, onDateChange, t, lang, onBack }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("growthStages");
  const [moreOverview, setMoreOverview] = useState(false);
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
      case "fertilization":  return <FertTab   fertilization={data.fertilization || []} t={t} lang={lang} />;
      case "irrigationGuide":return <IrrigTab  irrigation={data.irrigation || {}} t={t} lang={lang} />;
      case "diseaseMgmt":    return (
        <div className="threat-list">
          {(data.diseases || []).map((d, i) => <ThreatCard key={i} item={d} type="disease" t={t} lang={lang} />)}
        </div>
      );
      case "pestMgmt":       return (
        <div className="threat-list">
          {(data.pests || []).map((p, i) => <ThreatCard key={i} item={p} type="pest" t={t} lang={lang} />)}
        </div>
      );
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
          {data.overview && (
            <>
              <p className={moreOverview ? "" : "cg2-clamp"}>{tF(data, "overview", lang)}</p>
              <button type="button" className="cg2-more" onClick={() => setMoreOverview(m => !m)}>
                {moreOverview ? c.less : c.more}
              </button>
            </>
          )}
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

      <div className="cg2-two cg2-two--solo">
        {/* Stage timeline */}
        {stages.length > 0 && (
          <section className="tu-card tu-rise" data-tour="cg-timeline">
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
export default function CropGuidance({ lang, t }) {
  const [mode, setMode]                 = useState("guide");   // guide | cultivations
  // /crop-guidance?crop=Tomato&date=2026-08-30 opens straight on that guide, so
  // the recommendation page can link to the crop it suggested.
  const [params] = useSearchParams();
  const [selected, setSelected]         = useState(() => params.get("crop") || null);
  const [plantingDate, setPlantingDate] = useState(() => (/^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "") ? params.get("date") : null));
  const { user } = getAuthSession();
  // The role the user is acting as, not the account's primary role: a dual-role
  // account keeps one primary role whichever side it is using.
  const isLandOwner = Boolean(user) && getActiveRole() === 'Land Owner';

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
                <div className="tu-card" data-tour="cg-date">
                  <label className="tu-label" htmlFor="cg2-date">{c.dateL}</label>
                  <input id="cg2-date" className="tu-input" type="date" value={plantingDate || ""} max={new Date().toISOString().slice(0, 10)}
                    onChange={e => setPlantingDate(e.target.value || null)} />
                  <span className="cg2-hint">{c.dateH}</span>
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
            t={t} lang={lang} onBack={handleBack} />
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
