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
            <CustomSelect name="crop" value={yf.crop} onChange={e => handleCropChange(e.target.value)}>
              <option value="">{t.selectCropPh2}</option>
              {CROPS.map(c => (
                <option key={c} value={c}>
                  {(CROP_EMOJI[c] || "🌱") + " " + getCropLabel(c, lang)}
                </option>
              ))}
            </CustomSelect>
          </div>

          <div className="yp-field">
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
        <div className="yp-field" style={{ marginBottom: "1rem" }}>
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
          <button className="yp-btn-primary" onClick={calcYield} disabled={!yieldValid}>
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

            <button className="yp-use-yield-btn" onClick={useYieldForPrice}>
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
        <div className="yp-grid" style={{ marginBottom: "1rem" }}>
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
          <button className="yp-btn-primary" onClick={calcPrice} disabled={!priceValid}>
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
    </div>
  );
}
