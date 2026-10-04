import { useState } from "react";
import { Link } from "react-router";
import { ChartLine, ChartPie, CloudSun, Coins, FlaskConical, RotateCcw, Sprout, Store } from "lucide-react";
import { T } from "../data/translations";
import {
  CROP_YIELD_PER_ACRE,
  LAND_UNIT_TO_ACRES,
  CROP_EMOJI,
  getCropLabel,
} from "../data/cropData";
import CustomSelect from "../components/CustomSelect";
import ToolSwitcher from "../components/ToolSwitcher";
import "../styles/tool-yp.css";
import SpotlightTour   from "../components/tour/SpotlightTour";
import HelpButton      from "../components/tour/HelpButton";

// Sanity caps for this client-side calculator. Chosen to be far beyond any real
// Sri Lankan smallholding while still rejecting obvious nonsense.
const MAX_LAND_ACRES         = 100_000;   // matches MAX_FARM_SIZE_ACRES server-side
const MAX_YIELD_PER_ACRE_KG  = 100_000;   // ~10x the most productive crop in the DB
const MAX_TOTAL_YIELD_KG     = 1_000_000_000;

const YP_TOUR_T = {
  en: {
    steps: [
      { target: 'yp-crop-select', title: 'Choose your crop', body: 'Pick the crop you’re planning — we’ll use its typical yield-per-acre as a starting point.' },
      { target: 'yp-land-size', title: 'Enter your land size', body: 'Add the size and unit of the land you’re planting on.' },
      { target: 'yp-germ-rate', title: 'Germination rate', body: 'Not every seed sprouts — adjust this if you expect a lower or higher germination rate than the default 90%.' },
      { target: 'yp-calc-yield-btn', title: 'Calculate yield', body: 'This estimates your total expected harvest based on land size and germination rate.' },
      { target: 'yp-use-yield-btn', title: 'One click to the next step', body: 'Send this yield estimate straight into the price calculator below — no need to retype it.' },
      { target: 'yp-cost-inputs', title: 'Add your costs', body: 'Fill in your production costs — seeds, fertiliser, labour and more — to estimate profit.' },
      { target: 'yp-calc-price-btn', title: 'Calculate selling price', body: 'Get a suggested price per kg based on your costs and target profit margin.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'yp-crop-select', title: 'ඔබේ බෝගය තෝරන්න', body: 'ඔබ සැලසුම් කරන බෝගය තෝරන්න — ආරම්භක ලක්ෂ්‍යයක් ලෙස එහි සාමාන්‍ය අක්කරයට අස්වැන්න භාවිතා කරන්නෙමු.' },
      { target: 'yp-land-size', title: 'ඔබේ ඉඩම් ප්‍රමාණය ඇතුළත් කරන්න', body: 'ඔබ වගා කරන ඉඩමේ ප්‍රමාණය සහ ඒකකය එකතු කරන්න.' },
      { target: 'yp-germ-rate', title: 'පැළවීමේ අනුපාතය', body: 'සෑම බීජයක්ම පැළ නොවේ — පෙරනිමි 90%ට වඩා අඩු හෝ වැඩි පැළවීමේ අනුපාතයක් අපේක්ෂා කරන්නේ නම් මෙය සකසන්න.' },
      { target: 'yp-calc-yield-btn', title: 'අස්වැන්න ගණනය කරන්න', body: 'ඉඩම් ප්‍රමාණය සහ පැළවීමේ අනුපාතය මත පදනම්ව ඔබේ මුළු අපේක්ෂිත අස්වැන්න ඇස්තමේන්තු කරයි.' },
      { target: 'yp-use-yield-btn', title: 'ඊළඟ පියවරට එක් ක්ලික්කයකින්', body: 'මෙම අස්වැන්න ඇස්තමේන්තුව යළිත් ටයිප් නොකර පහත මිල ගණකයට කෙලින්ම යවන්න.' },
      { target: 'yp-cost-inputs', title: 'ඔබේ පිරිවැය එකතු කරන්න', body: 'ලාභය ඇස්තමේන්තු කිරීමට බීජ, පොහොර, කම්කරු සහ තවත් නිෂ්පාදන පිරිවැය පුරවන්න.' },
      { target: 'yp-calc-price-btn', title: 'විකුණුම් මිල ගණනය කරන්න', body: 'ඔබේ පිරිවැය සහ ඉලක්කගත ලාභ මාර්ජිනය මත පදනම්ව කිලෝග්‍රෑමයකට යෝජිත මිලක් ලබාගන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'yp-crop-select', title: 'உங்கள் பயிரைத் தேர்வு செய்யுங்கள்', body: 'நீங்கள் திட்டமிடும் பயிரைத் தேர்ந்தெடுக்கவும் — ஆரம்பப் புள்ளியாக அதன் வழக்கமான ஏக்கருக்கான மகசூலைப் பயன்படுத்துவோம்.' },
      { target: 'yp-land-size', title: 'உங்கள் நில அளவை உள்ளிடுங்கள்', body: 'நீங்கள் நடவு செய்யும் நிலத்தின் அளவு மற்றும் அலகைச் சேர்க்கவும்.' },
      { target: 'yp-germ-rate', title: 'முளைப்பு விகிதம்', body: 'ஒவ்வொரு விதையும் முளைக்காது — இயல்புநிலை 90%ஐ விட குறைவான அல்லது அதிகமான முளைப்பு விகிதத்தை எதிர்பார்த்தால் இதை மாற்றவும்.' },
      { target: 'yp-calc-yield-btn', title: 'மகசூலைக் கணக்கிடுங்கள்', body: 'நில அளவு மற்றும் முளைப்பு விகிதத்தின் அடிப்படையில் உங்கள் மொத்த எதிர்பார்க்கப்படும் அறுவடையை மதிப்பிடுகிறது.' },
      { target: 'yp-use-yield-btn', title: 'அடுத்த படிக்கு ஒரு கிளிக்', body: 'இந்த மகசூல் மதிப்பீட்டை மீண்டும் தட்டச்சு செய்யாமல் கீழே உள்ள விலை கால்குலேட்டருக்கு நேரடியாக அனுப்புங்கள்.' },
      { target: 'yp-cost-inputs', title: 'உங்கள் செலவுகளைச் சேர்க்கவும்', body: 'லாபத்தை மதிப்பிட விதைகள், உரம், தொழிலாளர் மற்றும் பலவற்றின் உற்பத்தி செலவுகளை நிரப்பவும்.' },
      { target: 'yp-calc-price-btn', title: 'விற்பனை விலையைக் கணக்கிடுங்கள்', body: 'உங்கள் செலவுகள் மற்றும் இலக்கு லாப வரம்பின் அடிப்படையில் கிலோ ஒன்றுக்கான பரிந்துரைக்கப்பட்ட விலையைப் பெறுங்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

const CROPS = Object.keys(CROP_YIELD_PER_ACRE).sort();
const COMMON_CROPS = ["Tomato", "Chilli", "Cabbage", "Carrot", "Maize", "Big Onion", "Potato", "Pumpkin"].filter(c => c in CROP_YIELD_PER_ACRE);
const LAND_UNITS = ["Acre", "Perch", "Hectare"];
const GERM_OPTIONS = [70, 80, 90, 95];
const MARGIN_OPTIONS = [10, 15, 20, 25];

// Slider ceilings. The number boxes accept more; the slider just stops here.
const YIELD_SLIDER_MAX = Math.ceil((Math.max(...Object.values(CROP_YIELD_PER_ACRE)) * 1.5) / 1000) * 1000;
const COST_SLIDER_MAX = 200_000;

const DEFAULT_YIELD = {
  crop: "",
  landSize: "",
  landUnit: "Acre",
  avgYield: "",
  germRate: 90,
};

const DEFAULT_PRICE = {
  seedCost: "",
  fertCost: "",
  pestCost: "",
  laborCost: "",
  irrigCost: "",
  transportCost: "",
  otherCost: "",
  profitMargin: "15",
};

// One colour per cost, shared by its slider and its slice of the chart.
const COSTS = [
  { key: "seedCost",      color: "#22c55e" },
  { key: "fertCost",      color: "#f97316" },
  { key: "pestCost",      color: "#a855f7" },
  { key: "laborCost",     color: "#38bdf8" },
  { key: "irrigCost",     color: "#14b8a6" },
  { key: "transportCost", color: "#f472b6" },
  { key: "otherCost",     color: "#94a3b8" },
];

const YP2 = {
  en: {
    eyebrow: "Yield & Price", h1a: "Know your harvest and your", h1b: "fair price", h1c: "before you sell.",
    sub: "Change any number on the left. The harvest, cost and price on the right update as you type.",
    s1: "Your crop and land", s1h: "The typical yield fills in when you pick a crop",
    s2: "Your costs", s2h: "Drag or type. Each cost has its own colour in the chart",
    s3: "Profit you want", s3h: "Added on top of your total cost",
    common: "Common crops", all: "All crops",
    ownYield: "Already know your harvest? Enter it here (kg)", ownYieldHint: "Leave empty to use the estimate above.",
    fair: "Fair selling price", perKg: "per kg · covers every cost plus your profit",
    idleT: "Your price appears here", idleB: "Pick a crop, enter your land size and add your costs.",
    harvest: "Estimated harvest", profit: "Expected profit",
    donut: "Where the money goes", noCosts: "Add a cost to see the breakdown.",
    perKgT: "Each kg you sell", breakEven: "Break-even price", cost: "Cost", gain: "Profit",
    market: "List on Marketplace", weather: "Check the weather", reset: "Start again",
  },
  si: {
    eyebrow: "අස්වැන්න සහ මිල", h1a: "විකිණීමට පෙර ඔබේ අස්වැන්න සහ", h1b: "සාධාරණ මිල", h1c: "දැනගන්න.",
    sub: "වම් පස ඕනෑම අගයක් වෙනස් කරන්න. දකුණු පස අස්වැන්න, පිරිවැය සහ මිල ඔබ ටයිප් කරන විටම යාවත්කාලීන වේ.",
    s1: "ඔබේ බෝගය සහ ඉඩම", s1h: "බෝගයක් තේරූ විට සාමාන්‍ය අස්වැන්න ස්වයංක්‍රීයව පිරේ",
    s2: "ඔබේ පිරිවැය", s2h: "අදින්න හෝ ටයිප් කරන්න. සෑම පිරිවැයකටම ප්‍රස්තාරයේ තමන්ගේම වර්ණයක් ඇත",
    s3: "ඔබට අවශ්‍ය ලාභය", s3h: "ඔබේ මුළු පිරිවැයට එකතු කෙරේ",
    common: "බහුල බෝග", all: "සියලු බෝග",
    ownYield: "ඔබේ අස්වැන්න දැනටමත් දන්නවාද? එය මෙහි ඇතුළත් කරන්න (kg)", ownYieldHint: "ඉහත ඇස්තමේන්තුව භාවිතා කිරීමට හිස්ව තබන්න.",
    fair: "සාධාරණ විකුණුම් මිල", perKg: "කිලෝවකට · සියලු පිරිවැය සහ ඔබේ ලාභය ආවරණය කරයි",
    idleT: "ඔබේ මිල මෙහි දිස්වේ", idleB: "බෝගයක් තෝරා, ඉඩම් ප්‍රමාණය ඇතුළත් කර, පිරිවැය එක් කරන්න.",
    harvest: "ඇස්තමේන්තුගත අස්වැන්න", profit: "අපේක්ෂිත ලාභය",
    donut: "මුදල් යන්නේ කොහේටද", noCosts: "බෙදීම බැලීමට පිරිවැයක් එක් කරන්න.",
    perKgT: "ඔබ විකුණන සෑම කිලෝවක්ම", breakEven: "පාඩු නොලබන මිල", cost: "පිරිවැය", gain: "ලාභය",
    market: "වෙළඳසැලේ ලැයිස්තුගත කරන්න", weather: "කාලගුණය පරීක්ෂා කරන්න", reset: "නැවත අරඹන්න",
  },
  ta: {
    eyebrow: "மகசூல் & விலை", h1a: "விற்பதற்கு முன் உங்கள் மகசூலையும்", h1b: "நியாயமான விலையையும்", h1c: "அறிந்துகொள்ளுங்கள்.",
    sub: "இடதுபுறத்தில் எந்த எண்ணையும் மாற்றுங்கள். வலதுபுறத்தில் மகசூல், செலவு மற்றும் விலை நீங்கள் தட்டச்சு செய்யும்போதே புதுப்பிக்கப்படும்.",
    s1: "உங்கள் பயிர் மற்றும் நிலம்", s1h: "பயிரைத் தேர்ந்தெடுத்ததும் வழக்கமான மகசூல் தானாக நிரப்பப்படும்",
    s2: "உங்கள் செலவுகள்", s2h: "இழுக்கவும் அல்லது தட்டச்சு செய்யவும். ஒவ்வொரு செலவுக்கும் வரைபடத்தில் தனி நிறம் உண்டு",
    s3: "நீங்கள் விரும்பும் லாபம்", s3h: "உங்கள் மொத்த செலவுடன் சேர்க்கப்படும்",
    common: "பொதுவான பயிர்கள்", all: "அனைத்து பயிர்கள்",
    ownYield: "உங்கள் மகசூல் ஏற்கனவே தெரியுமா? இங்கே உள்ளிடுங்கள் (kg)", ownYieldHint: "மேலே உள்ள மதிப்பீட்டைப் பயன்படுத்த காலியாக விடுங்கள்.",
    fair: "நியாயமான விற்பனை விலை", perKg: "ஒரு கிலோவுக்கு · அனைத்து செலவுகளையும் உங்கள் லாபத்தையும் உள்ளடக்கியது",
    idleT: "உங்கள் விலை இங்கே தோன்றும்", idleB: "ஒரு பயிரைத் தேர்ந்தெடுத்து, நில அளவை உள்ளிட்டு, செலவுகளைச் சேர்க்கவும்.",
    harvest: "மதிப்பிடப்பட்ட மகசூல்", profit: "எதிர்பார்க்கப்படும் லாபம்",
    donut: "பணம் எங்கே செல்கிறது", noCosts: "பிரிவைக் காண ஒரு செலவைச் சேர்க்கவும்.",
    perKgT: "நீங்கள் விற்கும் ஒவ்வொரு கிலோவும்", breakEven: "நட்டமில்லா விலை", cost: "செலவு", gain: "லாபம்",
    market: "சந்தையில் பட்டியலிடு", weather: "வானிலையைப் பார்க்கவும்", reset: "மீண்டும் தொடங்கு",
  },
};

function fmt(n) {
  return Number(n).toLocaleString("en-LK", { maximumFractionDigits: 2 });
}

// "Seed Cost (Rs.)" -> "Seed Cost": the unit is shown inside the box instead.
const bare = label => String(label || "").replace(/\s*\([^)]*\)\s*$/, "");
const pctOf = (value, max) => `${Math.min(100, Math.max(0, (value / max) * 100))}%`;

export default function YieldPrice({ lang }) {
  const t = T[lang] || T.en;
  const y = YP2[lang] || YP2.en;
  const ypTourT = YP_TOUR_T[lang] || YP_TOUR_T.en;
  const [tourOpen, setTourOpen] = useState(false);

  const [yf, setYf] = useState(DEFAULT_YIELD);
  const [pf, setPf] = useState(DEFAULT_PRICE);
  // A harvest the farmer already knows; when set it replaces the estimate.
  const [ownYield, setOwnYield] = useState("");

  const pickCrop = (crop) => setYf(prev => ({
    ...prev,
    crop,
    avgYield: crop ? String(CROP_YIELD_PER_ACRE[crop] ?? "") : "",
  }));

  const resetAll = () => { setYf(DEFAULT_YIELD); setPf(DEFAULT_PRICE); setOwnYield(""); };

  // ── Yield ────────────────────────────────────────────────────────────────
  // Upper bounds as well as lower ones: this calculator is entirely client-side,
  // so without a cap it will happily report a yield for a million-acre farm.
  // The land cap matches MAX_FARM_SIZE_ACRES in backend/app/schemas/farm.py.
  const landAcres   = (parseFloat(yf.landSize) || 0) * (LAND_UNIT_TO_ACRES[yf.landUnit] ?? 1);
  const avgYieldNum = parseFloat(yf.avgYield) || 0;
  const landTooBig  = landAcres > MAX_LAND_ACRES;
  const yieldTooBig = avgYieldNum > MAX_YIELD_PER_ACRE_KG;
  const ownYieldNum = parseFloat(ownYield) || 0;
  const estTooBig   = ownYieldNum > MAX_TOTAL_YIELD_KG;

  const yieldValid = yf.crop && landAcres > 0 && avgYieldNum > 0 && !landTooBig && !yieldTooBig;
  const estimated  = yieldValid ? landAcres * avgYieldNum * (yf.germRate / 100) : 0;
  const harvestKg  = ownYieldNum > 0 && !estTooBig ? ownYieldNum : estimated;

  // ── Price ────────────────────────────────────────────────────────────────
  const costs        = COSTS.map(c => ({ ...c, label: bare(t[c.key]), value: Math.max(0, parseFloat(pf[c.key]) || 0) }));
  const totalCost    = costs.reduce((sum, c) => sum + c.value, 0);
  const margin       = Math.max(0, parseFloat(pf.profitMargin) || 0);
  const profitAmt    = totalCost * (margin / 100);
  const totalRevenue = totalCost + profitAmt;
  const ready        = harvestKg > 0 && totalCost > 0;
  const breakEven    = ready ? totalCost / harvestKg : 0;
  const pricePerKg   = ready ? totalRevenue / harvestKg : 0;

  // Chart slices: each one starts where the previous ended (12 o'clock first).
  let turned = 0;
  const slices = costs.filter(c => c.value > 0).map(c => {
    const share = (c.value / totalCost) * 100;
    const slice = { ...c, share, offset: 25 - turned };
    turned += share;
    return slice;
  });

  const setCost = (key, value) => setPf(p => ({ ...p, [key]: value }));

  return (
    <div className="tu-page tu-tone-amber">
      <ToolSwitcher />

      <section className="tu-hero yp2-hero tu-rise">
        <span className="tu-eyebrow"><ChartLine size={14} />{y.eyebrow}</span>
        <h1>{y.h1a}<br /><span style={{ color: "#7c2d12" }}>{y.h1b}</span> {y.h1c}</h1>
        <p>{y.sub}</p>
      </section>

      <div className="yp2-grid">
        {/* ── Inputs ── */}
        <div className="yp2-col">
          <section className="tu-card tu-rise">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><Sprout size={18} /></span>
              <div><h2>1. {y.s1}</h2><small>{y.s1h}</small></div>
            </div>

            <label className="tu-label">{t.cropName} · {y.common}</label>
            <div className="tu-pills">
              {COMMON_CROPS.map(c => (
                <button key={c} type="button" className="tu-pill" aria-pressed={yf.crop === c} onClick={() => pickCrop(c)}>
                  <span aria-hidden="true">{CROP_EMOJI[c] || "🌱"}</span>{getCropLabel(c, lang)}
                </button>
              ))}
            </div>
            <div className="yp2-gap">
              <label className="tu-label">{y.all}</label>
              <CustomSelect name="crop" value={yf.crop} onChange={e => pickCrop(e.target.value)} data-tour="yp-crop-select">
                <option value="">{t.selectCropPh2}</option>
                {CROPS.map(c => (
                  <option key={c} value={c}>{(CROP_EMOJI[c] || "🌱") + " " + getCropLabel(c, lang)}</option>
                ))}
              </CustomSelect>
            </div>

            <div className="yp2-r3">
              <div data-tour="yp-land-size">
                <label className="tu-label">{t.landSize}</label>
                <input className="tu-input" type="number" min="0" step="0.01" placeholder="2"
                  value={yf.landSize} onChange={e => setYf(p => ({ ...p, landSize: e.target.value }))} />
                {landTooBig && <span className="yp2-hint err">{t.ypTooLarge}</span>}
              </div>
              <div>
                <label className="tu-label">{t.landUnit}</label>
                <div className="tu-seg">
                  {LAND_UNITS.map(u => (
                    <button key={u} type="button" aria-pressed={yf.landUnit === u} onClick={() => setYf(p => ({ ...p, landUnit: u }))}>{u}</button>
                  ))}
                </div>
              </div>
              <div data-tour="yp-germ-rate">
                <label className="tu-label">{t.germRate}</label>
                <div className="tu-seg">
                  {GERM_OPTIONS.map(g => (
                    <button key={g} type="button" aria-pressed={yf.germRate === g} onClick={() => setYf(p => ({ ...p, germRate: g }))}>{g}%</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="yp2-gap">
              <label className="tu-label">{t.avgYieldPerAcre}</label>
              <div className="yp2-slide" style={{ "--k": "#f59e0b" }}>
                <input className="tu-range" type="range" min="0" max={YIELD_SLIDER_MAX} step="100" tabIndex={-1}
                  value={Math.min(YIELD_SLIDER_MAX, avgYieldNum)} style={{ "--p": pctOf(avgYieldNum, YIELD_SLIDER_MAX) }}
                  onChange={e => setYf(p => ({ ...p, avgYield: e.target.value }))} aria-label={t.avgYieldPerAcre} />
                <input className="tu-input" type="number" min="0" step="1" placeholder="kg"
                  value={yf.avgYield} onChange={e => setYf(p => ({ ...p, avgYield: e.target.value }))} />
              </div>
              {yieldTooBig
                ? <span className="yp2-hint err">{t.ypTooLarge}</span>
                : <span className="yp2-hint">{t.yieldPerAcreHint}</span>}
            </div>

            <div className="yp2-own">
              <label className="tu-label">{y.ownYield}</label>
              <input className="tu-input" type="number" min="0" step="1" placeholder="1800"
                value={ownYield} onChange={e => setOwnYield(e.target.value)} />
              {estTooBig
                ? <span className="yp2-hint err">{t.ypTooLarge}</span>
                : <span className="yp2-hint">{y.ownYieldHint}</span>}
            </div>
          </section>

          <section className="tu-card tu-rise tu-tone-violet">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><FlaskConical size={18} /></span>
              <div><h2>2. {y.s2}</h2><small>{y.s2h}</small></div>
            </div>
            <div data-tour="yp-cost-inputs">
              {costs.map(c => (
                <div className="yp2-cost" key={c.key} style={{ "--k": c.color }}>
                  <i />
                  <span>{c.label}</span>
                  <input className="tu-range" type="range" min="0" max={COST_SLIDER_MAX} step="500" tabIndex={-1}
                    value={Math.min(COST_SLIDER_MAX, c.value)} style={{ "--p": pctOf(c.value, COST_SLIDER_MAX) }}
                    onChange={e => setCost(c.key, e.target.value)} aria-label={c.label} />
                  <div className="yp2-money">
                    <span>Rs.</span>
                    <input className="tu-input" type="number" min="0" step="100" placeholder="0"
                      value={pf[c.key]} onChange={e => setCost(c.key, e.target.value)} aria-label={c.label} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="tu-card tu-rise tu-tone-green">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><Coins size={18} /></span>
              <div><h2>3. {y.s3}</h2><small>{y.s3h}</small></div>
              <div className="tu-pills tu-head__end">
                {MARGIN_OPTIONS.map(m => (
                  <button key={m} type="button" className="tu-pill" aria-pressed={pf.profitMargin === String(m)}
                    onClick={() => setPf(p => ({ ...p, profitMargin: String(m) }))}>{m}%</button>
                ))}
              </div>
            </div>
            <div className="yp2-margin" style={{ "--k": "#22c55e" }}>
              <input className="tu-range" type="range" min="0" max="60" step="1" value={Math.min(60, margin)}
                style={{ "--p": pctOf(margin, 60) }} aria-label={bare(t.profitMargin)}
                onChange={e => setPf(p => ({ ...p, profitMargin: e.target.value }))} />
              <div className="tu-tile"><b style={{ color: "var(--tu-green)" }}>{margin}%</b></div>
            </div>
          </section>

          <button className="yp2-reset" type="button" onClick={resetAll}><RotateCcw size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{y.reset}</button>
        </div>

        {/* ── Live results ── */}
        <aside className="yp2-out">
          {ready ? (
            <div className="yp2-big tu-rise" data-tour="yp-calc-price-btn">
              <small>{y.fair}</small>
              <b>Rs. {fmt(pricePerKg)}</b>
              <span>{y.perKg}</span>
            </div>
          ) : (
            <div className="yp2-big yp2-big--idle" data-tour="yp-calc-price-btn">
              <small>{y.fair}</small>
              <b>{y.idleT}</b>
              <span>{y.idleB}</span>
            </div>
          )}

          <div className="yp2-kp">
            <div className="tu-tile" data-tour="yp-calc-yield-btn"><small>{y.harvest}</small><b style={{ color: "var(--tu-gold)" }}>{harvestKg > 0 ? `${fmt(harvestKg)} kg` : "–"}</b></div>
            <div className="tu-tile"><small>{t.totalCost}</small><b style={{ color: "var(--tu-coral)" }}>{totalCost > 0 ? `Rs. ${fmt(totalCost)}` : "–"}</b></div>
            <div className="tu-tile"><small>{y.profit}</small><b style={{ color: "var(--tu-green)" }}>{totalCost > 0 ? `Rs. ${fmt(profitAmt)}` : "–"}</b></div>
          </div>

          <section className="tu-card tu-tone-violet">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><ChartPie size={18} /></span>
              <div><h3>{y.donut}</h3><small>{t.totalRevenue}: {totalCost > 0 ? `Rs. ${fmt(totalRevenue)}` : "–"}</small></div>
            </div>
            <div className="yp2-donut">
              <svg viewBox="0 0 42 42" role="img" aria-label={y.donut}>
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--tu-card2)" strokeWidth="6" />
                {slices.map(sl => (
                  <circle key={sl.key} cx="21" cy="21" r="15.915" fill="none" stroke={sl.color} strokeWidth="6"
                    strokeDasharray={`${sl.share} ${100 - sl.share}`} strokeDashoffset={sl.offset} />
                ))}
                <text x="21" y="19.5" textAnchor="middle" fontSize="2.8" fill="var(--tu-muted)">{t.totalCost}</text>
                <text x="21" y="24.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="var(--tu-text)">
                  {totalCost >= 1000 ? `${fmt(Math.round(totalCost / 1000))}k` : fmt(totalCost)}
                </text>
              </svg>
              <div>
                {slices.length === 0 && <p className="yp2-note">{y.noCosts}</p>}
                {slices.map(sl => (
                  <div className="yp2-lg" key={sl.key}><i style={{ background: sl.color }} /><span>{sl.label}</span><b>{Math.round(sl.share)}%</b></div>
                ))}
              </div>
            </div>
          </section>

          <section className="tu-card tu-tone-green">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><Coins size={18} /></span>
              <div><h3>{y.perKgT}</h3><small>{y.breakEven}: {ready ? `Rs. ${fmt(breakEven)}` : "–"}</small></div>
            </div>
            <div className="yp2-split">
              <div style={{ flexGrow: 100, background: "#fb923c" }}>{y.cost}{ready ? ` Rs. ${fmt(breakEven)}` : ""}</div>
              <div style={{ flexGrow: Math.max(margin, 1), background: "#4ade80" }}>{y.gain}{ready ? ` +${fmt(pricePerKg - breakEven)}` : ""}</div>
            </div>
            <div className="yp2-next">
              <Link className="tu-linkbtn tu-tone-violet" to="/marketplace"><Store size={16} />{y.market}</Link>
              <Link className="tu-linkbtn tu-tone-sky" to="/wx"><CloudSun size={16} />{y.weather}</Link>
            </div>
            <p className="yp2-note" style={{ marginTop: 14 }}>{t.yieldNote} {t.priceNote}</p>
          </section>
        </aside>
      </div>

      <HelpButton label={ypTourT.needHelp} ariaLabel={ypTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={ypTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: ypTourT.next, back: ypTourT.back, skip: ypTourT.skip, done: ypTourT.done }}
      />
    </div>
  );
}
