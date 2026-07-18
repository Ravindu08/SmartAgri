import { useState } from "react";
import { T } from "../data/translations";
import {
  CROP_YIELD_PER_ACRE,
  LAND_UNIT_TO_ACRES,
  CROP_EMOJI,
  getCropLabel,
} from "../data/cropData";
import CustomSelect from "../components/CustomSelect";
import "../styles/YieldPrice.css";
import SpotlightTour   from "../components/tour/SpotlightTour";
import useAutoOpenOnce from "../components/tour/useAutoOpenOnce";
import HelpButton      from "../components/tour/HelpButton";

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
const LAND_UNITS = ["Acre", "Perch", "Hectare"];
const GERM_OPTIONS = [70, 80, 90, 95];

const DEFAULT_YIELD = {
  crop: "",
  landSize: "",
  landUnit: "Acre",
  avgYield: "",
  seedQty: "",
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

function fmt(n) {
  return Number(n).toLocaleString("en-LK", { maximumFractionDigits: 2 });
}

export default function YieldPrice({ lang }) {
  const t = T[lang] || T.en;
  const ypTourT = YP_TOUR_T[lang] || YP_TOUR_T.en;
  const [tourOpen, setTourOpen] = useAutoOpenOnce('sa_tour_yieldprice_seen_v1', true);

  // ── Yield form state ─────────────────────────────────────────────────────
  const [yf, setYf] = useState(DEFAULT_YIELD);
  const [yieldResult, setYieldResult] = useState(null);

  // ── Price form state ─────────────────────────────────────────────────────
  const [pf, setPf] = useState(DEFAULT_PRICE);
  const [priceEstYield, setPriceEstYield] = useState("");
  const [priceResult, setPriceResult] = useState(null);

  // ── Yield handlers ───────────────────────────────────────────────────────
  function handleCropChange(crop) {
    setYf(prev => ({
      ...prev,
      crop,
      avgYield: crop ? String(CROP_YIELD_PER_ACRE[crop] ?? "") : "",
    }));
    setYieldResult(null);
  }

  function calcYield() {
    const landSizeNum  = parseFloat(yf.landSize);
    const avgYieldNum  = parseFloat(yf.avgYield);
    if (!yf.crop || isNaN(landSizeNum) || landSizeNum <= 0 || isNaN(avgYieldNum) || avgYieldNum <= 0) return;

    const acres      = landSizeNum * (LAND_UNIT_TO_ACRES[yf.landUnit] ?? 1);
    const germFactor = yf.germRate / 100;
    const estimated  = acres * avgYieldNum * germFactor;

    setYieldResult({ acres, germFactor, avgYieldNum, estimated });
  }

  function resetYield() {
    setYf(DEFAULT_YIELD);
    setYieldResult(null);
    setPriceEstYield("");
    setPriceResult(null);
  }

  // ── Price handlers ───────────────────────────────────────────────────────
  function useYieldForPrice() {
    if (yieldResult) {
      setPriceEstYield(String(yieldResult.estimated.toFixed(2)));
      setPriceResult(null);
    }
  }

  function calcPrice() {
    const yieldKg = parseFloat(priceEstYield);
    if (isNaN(yieldKg) || yieldKg <= 0) return;

    const costs = [
      parseFloat(pf.seedCost) || 0,
      parseFloat(pf.fertCost) || 0,
      parseFloat(pf.pestCost) || 0,
      parseFloat(pf.laborCost) || 0,
      parseFloat(pf.irrigCost) || 0,
      parseFloat(pf.transportCost) || 0,
      parseFloat(pf.otherCost) || 0,
    ];
    const totalCost    = costs.reduce((s, c) => s + c, 0);
    const margin       = parseFloat(pf.profitMargin) || 0;
    const profitAmt    = totalCost * (margin / 100);
    const totalRevenue = totalCost + profitAmt;
    const pricePerKg   = totalRevenue / yieldKg;

    setPriceResult({ totalCost, profitAmt, totalRevenue, pricePerKg, yieldKg });
  }

  function resetPrice() {
    setPf(DEFAULT_PRICE);
    setPriceEstYield("");
    setPriceResult(null);
  }

  // ── Yield form validity ──────────────────────────────────────────────────
  const yieldValid = yf.crop && parseFloat(yf.landSize) > 0 && parseFloat(yf.avgYield) > 0;
  const priceValid = parseFloat(priceEstYield) > 0;

  return (
    <div className="page-wrapper">
    <div className="yp-page-wrapper">
      {/* ── Hero ── */}
      <div className="yp-hero">
        <div className="yp-hero-inner">
          <div className="yp-hero-badge">{t.yieldHeroBadge || "📊 Yield & Price Estimator"}</div>
          <h1 className="yp-hero-title">{t.yieldPriceTitle || <><span>Yield</span> &amp; Price Estimator</>}</h1>
          <p className="yp-hero-sub">
            {t.yieldPriceSub || "Estimate expected harvest, farming cost, selling price, and profit using simple land and crop details."}
          </p>
        </div>
      </div>
      <div className="yp-hero-wave" />

      <div className="yp-body">

      {/* ── Step 1: Yield Estimation ───────────────────────────────────── */}
      <div className="yp-card">
        <div className="yp-card-header">
          <div className="yp-card-header-left">
            <div className="yp-card-icon">🌾</div>
            <div>
              <div className="yp-card-title">{t.yieldSection}</div>
              <div className="yp-card-sub">{t.yieldSectionSub || "Enter land and crop details to estimate harvest"}</div>
            </div>
          </div>
        </div>

        <div className="yp-card-body">
        {/* Row 1: Crop + Land size + Unit */}
        <div className="yp-grid-3" style={{ marginBottom: "1rem" }}>
          <div className="yp-field">
            <label>{t.cropName}</label>
            <CustomSelect name="crop" value={yf.crop} onChange={e => handleCropChange(e.target.value)} data-tour="yp-crop-select">
              <option value="">{t.selectCropPh2}</option>
              {CROPS.map(c => (
                <option key={c} value={c}>
                  {(CROP_EMOJI[c] || "🌱") + " " + getCropLabel(c, lang)}
                </option>
              ))}
            </CustomSelect>
          </div>

          <div className="yp-field" data-tour="yp-land-size">
            <label>{t.landSize}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={yf.landSize}
              onChange={e => setYf(p => ({ ...p, landSize: e.target.value }))}
              placeholder="e.g. 2"
            />
          </div>

          <div className="yp-field">
            <label>{t.landUnit}</label>
            <CustomSelect name="land_unit" value={yf.landUnit} onChange={e => setYf(p => ({ ...p, landUnit: e.target.value }))}>
              {LAND_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </CustomSelect>
          </div>
        </div>

        {/* Row 2: Avg yield + Seed qty */}
        <div className="yp-grid" style={{ marginBottom: "1rem" }}>
          <div className="yp-field">
            <label>{t.avgYieldPerAcre}</label>
            <input
              type="number"
              min="0"
              step="1"
              value={yf.avgYield}
              onChange={e => setYf(p => ({ ...p, avgYield: e.target.value }))}
              placeholder="kg / acre"
            />
            <span className="yp-hint">{t.yieldPerAcreHint}</span>
          </div>

          <div className="yp-field">
            <label>{t.seedQty}</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={yf.seedQty}
              onChange={e => setYf(p => ({ ...p, seedQty: e.target.value }))}
              placeholder="e.g. 5"
            />
          </div>
        </div>

        {/* Row 3: Germination rate */}
        <div className="yp-field" style={{ marginBottom: "1rem" }} data-tour="yp-germ-rate">
          <label>{t.germRate}</label>
          <div className="yp-pills">
            {GERM_OPTIONS.map(g => (
              <button
                key={g}
                type="button"
                className={`yp-pill${yf.germRate === g ? " active" : ""}`}
                onClick={() => setYf(p => ({ ...p, germRate: g }))}
              >
                {g}%
              </button>
            ))}
          </div>
        </div>

        <div className="yp-btn-row">
          <button className="yp-btn-primary" onClick={calcYield} disabled={!yieldValid} data-tour="yp-calc-yield-btn">
            {t.calcYield}
          </button>
          <button className="yp-btn-ghost" onClick={resetYield}>{t.resetYield}</button>
        </div>

        {/* Result */}
        {yieldResult && (
          <div className="yp-result">
            <div className="yp-result-main">
              <span className="yp-result-label">{t.estYieldResult}:</span>
              <span className="yp-result-value">{fmt(yieldResult.estimated)}</span>
              <span className="yp-result-unit">kg</span>
            </div>

            <details className="yp-breakdown">
              <summary>{t.yieldBreakdown}</summary>
              <div className="yp-breakdown-rows">
                <div className="yp-breakdown-row">
                  <span>Land ({fmt(yieldResult.acres)} acres) × Avg yield ({fmt(yieldResult.avgYieldNum)} kg/acre)</span>
                  <span>{fmt(yieldResult.acres * yieldResult.avgYieldNum)} kg</span>
                </div>
                <div className="yp-breakdown-row">
                  <span>× Germination ({yf.germRate}%)</span>
                  <span>× {yieldResult.germFactor.toFixed(2)}</span>
                </div>
              </div>
            </details>

            <button className="yp-use-yield-btn" onClick={useYieldForPrice} data-tour="yp-use-yield-btn">
              {t.useForPrice}
            </button>

            <p className="yp-note">{t.yieldNote}</p>
          </div>
        )}
        </div>
      </div>

      {/* ── Step 2: Selling Price Estimation ──────────────────────────── */}
      <div className="yp-card">
        <div className="yp-card-header">
          <div className="yp-card-header-left">
            <div className="yp-card-icon yp-card-icon-yellow">💰</div>
            <div>
              <div className="yp-card-title">{t.priceSection}</div>
              <div className="yp-card-sub">{t.priceSectionSub || "Enter farming costs to calculate selling price and profit"}</div>
            </div>
          </div>
          {priceEstYield && (
            <span className="yp-yield-badge">
              🌾 {fmt(priceEstYield)} kg
            </span>
          )}
        </div>

        <div className="yp-card-body">
        {/* Estimated yield input */}
        <div className="yp-field" style={{ marginBottom: "1rem" }}>
          <label>{t.estYieldResult} (kg)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={priceEstYield}
            onChange={e => { setPriceEstYield(e.target.value); setPriceResult(null); }}
            placeholder="e.g. 1800"
          />
        </div>

        {/* Cost inputs */}
        <div className="yp-grid" style={{ marginBottom: "1rem" }} data-tour="yp-cost-inputs">
          {[
            ["seedCost",      t.seedCost],
            ["fertCost",      t.fertCost],
            ["pestCost",      t.pestCost],
            ["laborCost",     t.laborCost],
            ["irrigCost",     t.irrigCost],
            ["transportCost", t.transportCost],
            ["otherCost",     t.otherCost],
          ].map(([key, label]) => (
            <div className="yp-field" key={key}>
              <label>{label}</label>
              <input
                type="number"
                min="0"
                step="100"
                value={pf[key]}
                onChange={e => { setPf(p => ({ ...p, [key]: e.target.value })); setPriceResult(null); }}
                placeholder="0"
              />
            </div>
          ))}

          <div className="yp-field">
            <label>{t.profitMargin}</label>
            <div className="yp-pills">
              {[10, 15, 20, 25].map(m => (
                <button
                  key={m}
                  type="button"
                  className={`yp-pill${pf.profitMargin === String(m) ? " active" : ""}`}
                  onClick={() => { setPf(p => ({ ...p, profitMargin: String(m) })); setPriceResult(null); }}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="yp-btn-row">
          <button className="yp-btn-primary" onClick={calcPrice} disabled={!priceValid} data-tour="yp-calc-price-btn">
            {t.calcPrice}
          </button>
          <button className="yp-btn-ghost" onClick={resetPrice}>{t.resetPrice}</button>
        </div>

        {/* Price result */}
        {priceResult && (
          <div className="yp-price-result">
            <div className="yp-price-rows">
              <div className="yp-price-row">
                <span className="yp-price-row-label">{t.totalCost}</span>
                <span className="yp-price-row-value">Rs. {fmt(priceResult.totalCost)}</span>
              </div>
              <div className="yp-price-row">
                <span className="yp-price-row-label">{t.profitAmount} ({pf.profitMargin}%)</span>
                <span className="yp-price-row-value">Rs. {fmt(priceResult.profitAmt)}</span>
              </div>
              <div className="yp-price-row">
                <span className="yp-price-row-label">{t.totalRevenue}</span>
                <span className="yp-price-row-value">Rs. {fmt(priceResult.totalRevenue)}</span>
              </div>
              <div className="yp-price-row">
                <span className="yp-price-row-label">{t.estYieldResult}</span>
                <span className="yp-price-row-value">{fmt(priceResult.yieldKg)} kg</span>
              </div>
            </div>

            <div className="yp-price-hero">
              <span className="yp-price-hero-label">{t.suggestedPrice}:</span>
              <span className="yp-price-hero-value">Rs. {fmt(priceResult.pricePerKg)}</span>
              <span className="yp-price-hero-unit">/ kg</span>
            </div>

            <p className="yp-note">{t.priceNote}</p>
          </div>
        )}
        </div>
      </div>
      </div>

      <HelpButton label={ypTourT.needHelp} ariaLabel={ypTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={ypTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey="sa_tour_yieldprice_seen_v1"
        labels={{ next: ypTourT.next, back: ypTourT.back, skip: ypTourT.skip, done: ypTourT.done }}
      />
    </div>
    </div>
  );
}
