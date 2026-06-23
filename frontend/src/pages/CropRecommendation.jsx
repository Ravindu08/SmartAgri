import { useState, useEffect, useRef } from "react";
import { ML_BASE_URL } from "../services/api";

import "../styles/CropRecommendation.css";
import { T, DISTRICT_LABELS, ZONE_LABELS, IRR_LABELS, SEA_LABELS, SEA_DESC } from "../data/translations";
import { DISTRICT_TO_ZONES }                                         from "../data/districtZones";
import { SOIL_TYPES, CROP_EMOJI, SOIL_GUIDE_ROWS,
         getSoilLabel, getCropLabel, getSuitability }                from "../data/cropData";

import SuitBar        from "../components/SuitBar";
import XAIFeatureCard from "../components/XAIFeatureCard";
import CalendarCard   from "../components/CalendarCard";
import CompareCard    from "../components/CompareCard";
import HistoryPanel, { saveToHistory, loadHistory, clearHistory }
                      from "../components/HistoryPanel";
import CustomSelect   from "../components/CustomSelect";

const API_BASE = ML_BASE_URL;

// ── Mock fallback (used only when backend is unreachable) ─────────────────────
const MOCK_CROPS = ["Tomato","Chilli","Capsicum","Cabbage","Carrot","Maize","Okra","Soybean","Mung Bean","Cowpea"];
const MOCK_CI    = { crop_duration_min:75,crop_duration_max:100,water_required_min:400,water_required_max:600,rainfall_min:450,rainfall_max:1800,ph_min:5.0,ph_max:7.5,n_min:80,n_max:170,p_min:53,p_max:120,k_min:60,k_max:140,temp_min:20,temp_max:30.5,humidity_min:52,humidity_max:88 };

function mockPredict(soilType, season, irrigation, inputs = {}) {
  const idx  = ((soilType||"").length + (season||"").length + (irrigation||"").length) % MOCK_CROPS.length;
  const crop = MOCK_CROPS[idx];
  const a1   = MOCK_CROPS[(idx + 1) % MOCK_CROPS.length];
  const a2   = MOCK_CROPS[(idx + 2) % MOCK_CROPS.length];
  const conf = 0.72 + Math.random() * 0.15;
  return {
    recommended_crop: crop,
    confidence: conf,
    low_confidence: conf < 0.6,
    top_3: [
      { crop, confidence: conf, crop_info: MOCK_CI },
      { crop: a1, confidence: 0.38 + Math.random() * 0.2, crop_info: MOCK_CI },
      { crop: a2, confidence: 0.14 + Math.random() * 0.15, crop_info: MOCK_CI },
    ],
    explanations: [`Soil: ${soilType}`, `Zone matched`, `Water: ${irrigation}`, `Season: ${season}`],
    xai_features: [
      { feature:"N",        label:"Nitrogen (N)",   label_si:"නයිට්‍රජන් (N)",  label_ta:"நைட்ரஜன் (N)",  score:0.18, direction:"positive", value:parseFloat(inputs.N)||100,  ideal_min:80,  ideal_max:170 },
      { feature:"pH",       label:"Soil pH",        label_si:"පාංශු pH",         label_ta:"மண் pH",         score:0.15, direction:"positive", value:parseFloat(inputs.ph)||6.3, ideal_min:5.0, ideal_max:7.5 },
      { feature:"Rainfall", label:"Rainfall",       label_si:"වර්ෂාපතනය",        label_ta:"மழைவீழ்ச்சி",    score:0.14, direction:"positive", value:parseFloat(inputs.rain)||1051, ideal_min:450, ideal_max:1800 },
      { feature:"Temperature",label:"Temperature",  label_si:"උෂ්ණත්වය",         label_ta:"வெப்பநிலை",      score:0.12, direction:"positive", value:parseFloat(inputs.temp)||27,  ideal_min:20,  ideal_max:30.5 },
      { feature:"NPK_Sum",  label:"Total nutrients",label_si:"මුළු පෝෂක",        label_ta:"மொத்த ஊட்டச்சத்து",score:0.10,direction:"neutral",  value:null, ideal_min:null, ideal_max:null },
      { feature:"Humidity", label:"Humidity",       label_si:"ආර්ද්‍රතාවය",      label_ta:"ஈரப்பதம்",       score:0.09, direction:"positive", value:parseFloat(inputs.hum)||72,  ideal_min:52,  ideal_max:88  },
    ],
    xai_is_global: false,
    xai_summary: {
      en: `${crop} was recommended because your Nitrogen (${inputs.N||100} kg/ha) and Soil pH (${inputs.ph||6.3}) are within the ideal range for this crop.`,
      si: `${getCropLabel(crop,"si")} නිර්දේශ කරන ලද්දේ ඔබේ නයිට්‍රජන් (${inputs.N||100} kg/ha) සහ pH (${inputs.ph||6.3}) සුදුසු පරාසය තුළ ඇති බැවිනි.`,
      ta: `${getCropLabel(crop,"ta")} பரிந்துரைக்கப்பட்டது ஏனெனில் நைட்ரஜன் (${inputs.N||100} kg/ha) மற்றும் pH (${inputs.ph||6.3}) சரியான வரம்பில் உள்ளது.`,
    },
    warnings: [],
    planting_calendar: season==="Maha"?{plant_start:10,plant_end:1,harvest_start:3,harvest_end:5}
                      :season==="Yala"?{plant_start:4,plant_end:5,harvest_start:8,harvest_end:9}
                      :{plant_start:1,plant_end:12,harvest_start:1,harvest_end:12},
    crop_info: MOCK_CI,
  };
}

// ── Soil Guide Modal ──────────────────────────────────────────────────────────
const SOIL_MODAL_T = {
  en: {
    title: '🪨 How to Identify Your Soil Type',
    intro: 'Perform these simple field tests to identify your soil. Collect a sample from 10–20 cm depth. Moisten it slightly before testing.',
    close: 'Close',
    colType: 'Soil Type', colColour: 'Colour', colTexture: 'Texture / Feel',
    colDrainage: 'Drainage', colIdentify: '🔍 How to Identify in the Field',
    testTip: '💡 Field Test Tip',
    testDesc: 'Take a small moist handful → squeeze it hard → open your palm and observe. Then roll it between your palms to form a ribbon.',
  },
  si: {
    title: '🪨 ඔබේ පාංශු වර්ගය හඳුනාගන්නේ කෙසේද',
    intro: 'ඔබේ පාංශු හඳුනාගැනීමට මෙම සරල ක්ෂේත්‍ර පරීක්ෂා සිදු කරන්න. 10-20 cm ගැඹුරෙන් සාම්පලයක් රැගෙන, ටිකක් තෙත් කිරීමෙන් පසු පරීක්ෂා කරන්න.',
    close: 'වසන්න',
    colType: 'පාංශු වර්ගය', colColour: 'වර්ණය', colTexture: 'ස්ථාරය / රූ ගතිය',
    colDrainage: 'ජල බැස්ම', colIdentify: '🔍 ක්ෂේත්‍රයේ හඳුනාගන්නේ කෙසේද',
    testTip: '💡 ක්ෂේත්‍ර පරීක්ෂා ඉඟිය',
    testDesc: 'තෙත් ගොඩක් ගන්න → ශක්තිමත්ව මිරිකන්න → අත ඇරෙන්න නිරීක්ෂා කරන්න. ඉන්පසු රිබොනයක් සෑදීමට ළිවේ.',
  },
  ta: {
    title: '🪨 உங்கள் மண் வகையை எவ்வாறு அடையாளம் காண்பது',
    intro: 'உங்கள் மண்ணை அடையாளம் காண இந்த எளிய வயல் சோதனைகளை மேற்கொள்ளுங்கள். 10-20 செ.மீ ஆழத்தில் மாதிரி எடுக்கவும்.',
    close: 'மூடு',
    colType: 'மண் வகை', colColour: 'நிறம்', colTexture: 'தன்மை / உணர்வு',
    colDrainage: 'நீர் வடிகால்', colIdentify: '🔍 வயலில் எப்படி அடையாளம் காண்பது',
    testTip: '💡 வயல் சோதனை குறிப்பு',
    testDesc: 'ஈரமான ஒரு கைப்பிடி மண் எடுக்கவும் → உறுதியாக அழுத்துங்கள் → உள்ளங்கையை திறந்து கவனியுங்கள்.',
  },
};

function SoilGuideModal({ lang, t, onClose }) {
  const [search, setSearch] = useState('');
  const mt = SOIL_MODAL_T[lang] || SOIL_MODAL_T.en;
  const filtered = search.trim()
    ? SOIL_GUIDE_ROWS.filter(r => r.type.toLowerCase().includes(search.toLowerCase()))
    : SOIL_GUIDE_ROWS;

  return (
    <div className="soil-overlay" onClick={onClose}>
      <div className="soil-modal soil-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="soil-modal-hdr">
          <div className="soil-modal-title">{mt.title}</div>
          <button className="soil-modal-close" onClick={onClose}>{mt.close}</button>
        </div>
        <p className="soil-modal-intro">{mt.intro}</p>
        <div className="soil-test-tip">
          <strong>{mt.testTip}:</strong> {mt.testDesc}
        </div>
        <input
          className="soil-modal-search"
          type="text"
          placeholder={lang === 'si' ? 'හොයන්න…' : lang === 'ta' ? 'தேடுங்கள்…' : 'Search soil type…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="soil-cards-list">
          {filtered.map(row => (
            <div key={row.type} className="soil-info-card">
              <div className="soil-info-card__header">
                <span className="soil-info-card__name">{row.type}</span>
                <span className="soil-info-card__drainage">{mt.colDrainage}: <strong>{row.drainage}</strong></span>
              </div>
              <div className="soil-info-card__meta">
                <div><span className="soil-meta-label">{mt.colColour}:</span> {row.colour}</div>
                <div><span className="soil-meta-label">{mt.colTexture}:</span> {row.texture}</div>
              </div>
              {(row.identify_en || row.identify_si || row.identify_ta) && (
                <div className="soil-info-card__identify">
                  <span className="soil-identify-label">{mt.colIdentify}:</span>
                  <p>{lang === 'si' && row.identify_si ? row.identify_si : lang === 'ta' && row.identify_ta ? row.identify_ta : row.identify_en}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CropRecommendation({ lang, setLang, setPage, weather, setWeather }) {
  const [mode,       setMode]       = useState("full");
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [isMock,     setIsMock]     = useState(false);
  const [showGuide,  setShowGuide]  = useState(false);
  const [history,    setHistory]    = useState(() => loadHistory());
  const resRef = useRef(null);

  const t   = T[lang];
  const dl  = DISTRICT_LABELS[lang];
  const zl  = ZONE_LABELS[lang];
  const il  = IRR_LABELS[lang];
  const sl  = SEA_LABELS[lang];
  const zLabel = z => zl[z] || z;

  // ── Persisted form state (sessionStorage) ──
  const ss = typeof sessionStorage !== "undefined" ? sessionStorage : null;
  const ssGet = (k, d = "") => { try { return ss?.getItem(k) || d; } catch { return d; } };
  const ssSet = (k, v)      => { try { ss?.setItem(k, v); } catch {} };

  const [district,   setDistrictRaw]   = useState(() => ssGet("sa_district"));
  const [avZones,    setAvZones]       = useState([]);
  const [agroZone,   setAgroZoneRaw]   = useState(() => ssGet("sa_zone"));
  const [soilType,   setSoilTypeRaw]   = useState(() => ssGet("sa_soil"));
  const [irrigation, setIrrigationRaw] = useState(() => ssGet("sa_irr"));
  const [season,     setSeasonRaw]     = useState(() => ssGet("sa_season"));
  const [N,   setNRaw]    = useState(() => ssGet("sa_N")    || "100");
  const [P,   setPRaw]    = useState(() => ssGet("sa_P")    || "60");
  const [K,   setKRaw]    = useState(() => ssGet("sa_K")    || "91");
  const [temp,setTempRaw] = useState(() => ssGet("sa_temp") || "27");
  const [rain,setRainRaw] = useState(() => ssGet("sa_rain") || "1051");
  const [ph,  setPhRaw]   = useState(() => ssGet("sa_ph")   || "6.3");
  const [hum, setHumRaw]  = useState(() => ssGet("sa_hum")  || "72");

  const mkSet = (raw, key) => v => { raw(v); ssSet(key, v); };
  const setDistrict   = mkSet(setDistrictRaw,   "sa_district");
  const setAgroZone   = mkSet(setAgroZoneRaw,   "sa_zone");
  const setSoilType   = mkSet(setSoilTypeRaw,   "sa_soil");
  const setIrrigation = mkSet(setIrrigationRaw, "sa_irr");
  const setSeason     = mkSet(setSeasonRaw,     "sa_season");
  const setN   = mkSet(setNRaw,    "sa_N");
  const setP   = mkSet(setPRaw,    "sa_P");
  const setK   = mkSet(setKRaw,    "sa_K");
  const setTemp= mkSet(setTempRaw, "sa_temp");
  const setRain= mkSet(setRainRaw, "sa_rain");
  const setPh  = mkSet(setPhRaw,   "sa_ph");
  const setHum = mkSet(setHumRaw,  "sa_hum");

  // Update available zones when district changes
  useEffect(() => {
    if (!district) { setAvZones([]); setAgroZone(""); return; }
    const z = DISTRICT_TO_ZONES[district] || [];
    setAvZones(z);
    setAgroZone(z.length === 1 ? z[0] : "");
  }, [district]);

  // Fetch seasonal weather when district or season changes.
  // Passes the selected season so the archive window matches what the model was trained on.
  const [wxLoading, setWxLoading] = useState(false);
  useEffect(() => {
    if (!district) { setWxFilled(false); return; }
    setWxLoading(true);
    const url = season
      ? `${API_BASE}/weather?district=${encodeURIComponent(district)}&season=${encodeURIComponent(season)}`
      : `${API_BASE}/weather?district=${encodeURIComponent(district)}`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setWeather?.(data))
      .catch(() => {})
      .finally(() => setWxLoading(false));
  }, [district, season]);

  // Auto-fill climate fields from weather when district matches
  const [wxFilled, setWxFilled] = useState(false);
  useEffect(() => {
    if (!weather || !district) { setWxFilled(false); return; }
    if (weather.district !== district) { setWxFilled(false); return; }
    const c = weather.current;
    // Use season-to-date averages from archive — matches what the model trained on.
    // Falls back to current live reading if archive values aren't available yet.
    setTemp(String(
      weather.season_avg_temp != null ? weather.season_avg_temp : c.temperature.toFixed(1)
    ));
    setHum(String(
      weather.season_avg_humidity != null ? weather.season_avg_humidity : c.humidity
    ));
    // Rainfall: use actual season-to-date accumulation from Open-Meteo archive.
    // Falls back to climatological seasonal lookup if archive not available.
    const actualMm = weather.season_actual_mm;
    const sr       = weather.seasonal_rainfall || {};
    const seasonKey = weather.season_name || season || "Year-round";
    const fallback  = sr[seasonKey] ?? sr["Year-round"] ?? null;
    const rainfallMm = (actualMm != null && actualMm > 0) ? actualMm : fallback;
    if (rainfallMm !== null) setRain(String(rainfallMm));
    setWxFilled(true);
  }, [district, weather, season]);

  const baseOk   = district && agroZone && soilType && irrigation && season;
  const fullOk   = baseOk && N && P && K && temp && rain && ph && hum;
  // Simple mode is always submittable once base fields are filled; weather fields are optional bonuses
  const canSubmit = mode === "simple" ? baseOk : fullOk;

  // Suitability classes for numeric inputs
  const ci = result?.crop_info;
  const suit = ci ? {
    N: getSuitability(N, ci.n_min, ci.n_max),
    P: getSuitability(P, ci.p_min, ci.p_max),
    K: getSuitability(K, ci.k_min, ci.k_max),
    temp: getSuitability(temp, ci.temp_min, ci.temp_max),
    rain: getSuitability(rain, ci.rainfall_min, ci.rainfall_max),
    ph:   getSuitability(ph,   ci.ph_min,       ci.ph_max),
    hum:  getSuitability(hum,  ci.humidity_min, ci.humidity_max),
  } : {};
  const sClass = s => s === "ok" ? "ok" : s === "below" ? "warn" : s === "above" ? "err" : "";

  const resetForm = () => {
    setDistrictRaw(""); setAgroZoneRaw(""); setSoilTypeRaw("");
    setIrrigationRaw(""); setSeasonRaw("");
    setNRaw(""); setPRaw(""); setKRaw(""); setTempRaw("");
    setRainRaw(""); setPhRaw(""); setHumRaw("");
    setResult(null); setError(null); setIsMock(false);
    ["sa_district","sa_zone","sa_soil","sa_irr","sa_season",
     "sa_N","sa_P","sa_K","sa_temp","sa_rain","sa_ph","sa_hum"]
      .forEach(k => { try { ss?.removeItem(k); } catch {} });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setLoading(true); setError(null); setResult(null); setIsMock(false);
    try {
      const endpoint = mode === "simple" ? "/predict/simple" : "/predict/full";
      const body = mode === "simple"
        ? {
            Soil_Type: soilType, Agro_Zone: agroZone, Irrigation: irrigation,
            Season: season, District: district || undefined,
            // Include weather values when available — boosts accuracy from ~47% to ~67%
            ...(temp ? { Temperature: +temp } : {}),
            ...(rain ? { Rainfall:    +rain } : {}),
            ...(hum  ? { Humidity:    +hum  } : {}),
          }
        : { N: +N, P: +P, K: +K, Temperature: +temp, Rainfall: +rain, pH: +ph, Humidity: +hum,
            Soil_Type: soilType, Agro_Zone: agroZone, Irrigation: irrigation, Season: season };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Error ${res.status}`);
      }

      const json = await res.json();
      setResult(json.data);

      // Persist to history
      saveToHistory({
        crop:       json.data.recommended_crop,
        confidence: json.data.confidence,
        mode,
        zone:   agroZone,
        season,
        soil:   soilType,
      });
      setHistory(loadHistory());

    } catch (e) {
      await new Promise(r => setTimeout(r, 1300));
      setResult(mockPredict(soilType, season, irrigation, { N, P, K, temp, rain, ph, hum }));
      setIsMock(true);
    }

    setLoading(false);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const pct = result ? Math.round(result.confidence * 100) : 0;
  const maxScore = result?.xai_features?.length > 0 ? result.xai_features[0].score : 1;

  const numFields = [
    { key:"N",    label:t.nitrogen,    val:N,    set:setN,    unit:"kg/ha", ph:"100",  min:0,   max:300  },
    { key:"P",    label:t.phosphorus,  val:P,    set:setP,    unit:"kg/ha", ph:"60",   min:0,   max:200  },
    { key:"K",    label:t.potassium,   val:K,    set:setK,    unit:"kg/ha", ph:"91",   min:0,   max:300  },
    { key:"temp", label:t.temperature, val:temp, set:setTemp, unit:"°C",    ph:"27",   min:5,   max:45   },
    { key:"rain", label:t.rainfall,    val:rain, set:setRain, unit:"mm",    ph:"1051", min:0,   max:5000 },
    { key:"ph",   label:t.soilPh,      val:ph,   set:setPh,   unit:"pH",    ph:"6.3",  min:3,   max:10,  step:"0.1" },
    { key:"hum",  label:t.humidity,    val:hum,  set:setHum,  unit:"%",     ph:"72",   min:0,   max:100  },
  ];

  return (
    <div className="page-wrapper">
      <div className="app">

        {/* ── Hero banner (compact) ────────────────────────────────────── */}
        <div className="hero hero--compact">
          <div className="hero-inner">
            <div className="hero-badge">{t.aiPoweredBadge}</div>
            <h1 className="hero-title">
              {lang === "si" ? <>AI <span>බෝග නිර්දේශය</span></> :
               lang === "ta" ? <>AI <span>பயிர் பரிந்துரை</span></> :
               <>AI Crop <span>Recommendation</span></>}
            </h1>
            <p className="hero-sub hero-sub--compact">
              {lang === "si"
                ? "ශ්‍රී ලංකාවේ කලාප, පාංශු වර්ග සහ ඍතු රටාවන්ට ගැලපෙන AI නිර්දේශ."
                : lang === "ta"
                ? "இலங்கையின் மண், தட்பவெப்பம் மற்றும் பருவத்திற்கு ஏற்ற AI பரிந்துரை."
                : "Full-parameter AI analysis tailored for Sri Lanka's agro-climatic zones and seasonal patterns."}
            </p>
          </div>
        </div>
        <div className="hero-wave" />

        {/* ── History panel (above form) ──────────────────────────────────── */}
        <HistoryPanel
          history={history}
          onClear={() => { clearHistory(); setHistory([]); }}
          lang={lang}
          t={t}
        />

        {/* Mode is fixed to "full" — toggle hidden */}

        {/* ── Form card ───────────────────────────────────────────────────── */}
        <div className="card">
          <div className="ci">
            <div className="ch">
              <div className={`cico ${mode === "simple" ? "cig" : "cia"}`}>
                {mode === "simple" ? "🌱" : "🔬"}
              </div>
              <div>
                <div className="ct">{mode === "simple" ? t.titleSimple : t.titleFull}</div>
                <div className="cs">{mode === "simple" ? t.subSimple : t.subFull}</div>
              </div>
            </div>

            <div className="cb">
              {/* Location */}
              <div className="sec">{t.secLocation}</div>
              <div className="g2">
                <div className="fl">
                  <label className="flb">{t.district}</label>
                  <CustomSelect name="district" value={district} onChange={e => setDistrict(e.target.value)}>
                    <option value="">{t.selectDistrict}</option>
                    {Object.keys(DISTRICT_TO_ZONES).map(d => (
                      <option key={d} value={d}>{dl[d] || d}</option>
                    ))}
                  </CustomSelect>
                </div>
                <div className="fl">
                  <label className="flb">{t.agroZone}</label>
                  {avZones.length === 1
                    ? <div className="zone-auto">✓ {zLabel(avZones[0])}</div>
                    : avZones.length > 1
                      ? <>
                          <CustomSelect name="agro_zone" value={agroZone} onChange={e => setAgroZone(e.target.value)}>
                            <option value="">{t.selectZone} {dl[district] || district}…</option>
                            {avZones.map(z => <option key={z} value={z}>{zLabel(z)}</option>)}
                          </CustomSelect>
                          <span className="fhint">{dl[district] || district} {t.spansZones} {avZones.length} {t.zonesNote}</span>
                        </>
                      : <CustomSelect name="agro_zone" value="" onChange={() => {}} disabled>
                          <option value="">{t.selectDistrictFirst}</option>
                        </CustomSelect>
                  }
                </div>
              </div>

              {/* Farm conditions */}
              <div className="fsec">
                <div className="sec">{t.secFarm}</div>
                <div className="g3">
                  {/* Soil type with guide link */}
                  <div className="fl">
                    <label className="flb">
                      {t.soilType}
                      <button className="soil-guide-btn" type="button" onClick={() => setShowGuide(true)}>
                        ℹ {t.soilGuideBtn}
                      </button>
                    </label>
                    <CustomSelect name="soil_type" value={soilType} onChange={e => setSoilType(e.target.value)}>
                      <option value="">{t.selectSoil}</option>
                      {SOIL_TYPES.map(s => <option key={s} value={s}>{getSoilLabel(s, lang)}</option>)}
                    </CustomSelect>
                  </div>
                  <div className="fl">
                    <label className="flb">{t.irrigation}</label>
                    <CustomSelect name="irrigation" value={irrigation} onChange={e => setIrrigation(e.target.value)}>
                      <option value="">{t.select}</option>
                      {["Rainfed","Irrigated","Supplemental"].map(i => (
                        <option key={i} value={i}>{il[i]}</option>
                      ))}
                    </CustomSelect>
                  </div>
                  <div className="fl">
                    <label className="flb">{t.season}</label>
                    <CustomSelect name="season" value={season} onChange={e => setSeason(e.target.value)}>
                      <option value="">{t.select}</option>
                      {["Maha","Yala","Year-round"].map(s => (
                        <option key={s} value={s}>{sl[s]}</option>
                      ))}
                    </CustomSelect>
                    {season && SEA_DESC[lang]?.[season] && (
                      <div className="fhint">{SEA_DESC[lang][season]}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weather auto-fill section (simple mode) */}
              {mode === "simple" && (
                <div className="fsec">
                  <div className="sec">{t.secWeatherSimple}</div>
                  {wxFilled ? (
                    <div className="wx-autofill-badge">
                      🌦️ {t.wxAutoFillBadge} <strong>{district}</strong>. {t.wxAutoFillAdjust}
                    </div>
                  ) : wxLoading ? (
                    <div className="wx-autofill-hint">
                      ⏳ {t.wxFetchingHint || "Fetching live weather for"} <strong>{district}</strong>…
                    </div>
                  ) : (
                    <div className="wx-autofill-hint">
                      💡 {district ? (t.wxSelectDistrictDone || "Weather data will appear here automatically.") : (t.wxSelectDistrictHint || "Select your district above to auto-fill live weather data.")}
                    </div>
                  )}
                  <div className="g3">
                    {[
                      { key:"temp", label:t.temperature, val:temp, set:setTemp, unit:"°C",  ph:"27",   min:5,   max:45  },
                      { key:"rain", label:t.rainfall,    val:rain, set:setRain, unit:"mm",  ph:"1050", min:0,   max:5000 },
                      { key:"hum",  label:t.humidity,    val:hum,  set:setHum,  unit:"%",   ph:"72",   min:0,   max:100 },
                    ].map(({ key, label, val, set, unit, ph: ph_, min, max }) => (
                      <div className="fl" key={key}>
                        <label className="flb">
                          {label}
                          {wxFilled && <span className="wx-live-tag">🌦 {t.wxLiveTag}</span>}
                        </label>
                        <div className="iw">
                          <input
                            className={`fi${wxFilled && val ? " wx-filled" : ""}`}
                            type="number"
                            step="0.1"
                            placeholder={ph_}
                            value={val}
                            onChange={e => set(e.target.value)}
                            min={min}
                            max={max}
                            aria-label={label}
                          />
                          <span className="iunit">{unit}</span>
                        </div>
                        <span className="fhint">{t.wxOptional} · {t.rangeHint}: {min}–{max} {unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numeric inputs (full mode only) */}
              {mode === "full" && (
                <div className="fsec">
                  <div className="sec">{t.secNutrients}</div>
                  {wxFilled && (
                    <div className="wx-autofill-badge">
                      🌦️ {t.wxAutoFillBadge} <strong>{district}</strong>. {t.wxAutoFillAdjust}
                    </div>
                  )}
                  {!wxFilled && district && mode === "full" && (
                    <div className="wx-autofill-hint">
                      {wxLoading
                        ? <>⏳ {t.wxFetchingHint || "Fetching live weather for"} <strong>{district}</strong>…</>
                        : <>💡 {t.wxSelectDistrictHint || "Select your district to auto-fill live weather data."}</>}
                    </div>
                  )}
                  <div className="g3">
                    {numFields.map(({ key, label, val, set, unit, ph: ph_, min, max, step }) => {
                      const sc = ci ? sClass(suit[key]) : "";
                      const sv = ci ? suit[key] : null;
                      return (
                        <div className="fl" key={key}>
                          <label className="flb">{label}</label>
                          <div className="iw">
                            <input
                              className={`fi${sc ? " " + sc : ""}`}
                              type="number"
                              step={step || "1"}
                              placeholder={ph_}
                              value={val}
                              onChange={e => set(e.target.value)}
                              min={min}
                              max={max}
                              aria-label={label}
                            />
                            <span className="iunit">{unit}</span>
                          </div>
                          {ci && sv === "below" && <span className="fwarn">▼ {t.belowRange}</span>}
                          {ci && sv === "above" && <span className="ferr">▲ {t.aboveRange}</span>}
                          {!ci && <span className="fhint">{t.rangeHint}: {min}–{max} {unit}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button className="btn" onClick={submit} disabled={!canSubmit || loading}>
                {loading ? <><div className="spin" />{t.btnAnalyse}</> : t.btnSubmit}
              </button>

              {result && (
                <button className="btn-reset" onClick={resetForm}>{t.btnReset}</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert-bar">
            <div className="alert-error">⚠️ {error}</div>
          </div>
        )}

        {/* Demo mode — shown prominently when backend was unreachable */}
        {isMock && (
          <div className="alert-bar">
            <div className="alert-demo">
              <div className="alert-demo-title">{t.demoTitle}</div>
              <div className="alert-demo-body">{t.demoDesc}</div>
            </div>
          </div>
        )}

        {/* Input out-of-range warnings */}
        {result?.warnings?.length > 0 && (
          <div className="alert-bar">
            <div className="alert-warn">
              <div className="alert-warn-title">{t.warningsTitle}</div>
              {result.warnings.map((w, i) => (
                <div className="alert-warn-item" key={i}>
                  • {lang === "si" ? w.message_si : lang === "ta" ? w.message_ta : w.message_en}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Result card ─────────────────────────────────────────────────── */}
        {result && (
          <div className="rw" ref={resRef}>
            <div className="res">
              <div className="res-sparkles" />
              <div className="res-top-row">
                <div className="rl">{t.resultLabel}</div>
                <button className="btn-print" onClick={() => window.print()} title={t.btnPrint}>
                  🖨 {t.btnPrint}
                </button>
              </div>

              <div className="rc">
                <span className="re">{CROP_EMOJI[result.recommended_crop] || "🌿"}</span>
                {getCropLabel(result.recommended_crop, lang)}
              </div>

              <div className="rcf">
                <span>{pct}% {t.confidence}</span>
                <div className="ctr"><div className="cf" style={{ width: `${pct}%` }} /></div>
              </div>

              {result.low_confidence && <div className="low-conf">⚠ {t.lowConfWarn}</div>}

              {result.top_3?.length > 1 && (
                <div className="t3r">
                  <span className="also-consider-lbl">{t.alsoConsider}</span>
                  {result.top_3.slice(1).map((c, i) => (
                    <div className="t3c" key={i}>
                      {CROP_EMOJI[c.crop] || "🌿"} {getCropLabel(c.crop, lang)}
                      <span className="cp">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {result.explanations?.length > 0 && (
                <div className="eg">
                  {result.explanations.map((e, i) => (
                    <div className="ei" key={i}><div className="ed" /><span>{e}</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── XAI card ────────────────────────────────────────────────────── */}
        {result?.xai_features?.length > 0 && (
          <div className="xai-card">
            <div className="xai-inner">
              <div className="xai-hdr">
                <div className="xai-hdr-icon">🧠</div>
                <div>
                  <div className="xai-title">{t.xaiTitle}</div>
                  {/* Correct subtitle depending on whether XAI is per-prediction or global */}
                  <div className="xai-sub">
                    {result.xai_is_global ? t.xaiSubtitleGlobal : t.xaiSubtitle}
                  </div>
                </div>
              </div>
              <div className="xai-body">
                {result.xai_summary && (
                  <div className="xai-summary-box">
                    <div className="xai-summary-icon">💬</div>
                    <div>
                      <div className="xai-summary-label">{t.xaiSummaryLabel}</div>
                      <div className="xai-summary-text">
                        {lang==="si" ? result.xai_summary.si
                        :lang==="ta" ? result.xai_summary.ta
                        :              result.xai_summary.en}
                      </div>
                    </div>
                  </div>
                )}
                <div className="xai-grid">
                  {result.xai_features.map((f, i) => (
                    <XAIFeatureCard key={i} feat={f} maxScore={maxScore} lang={lang} t={t} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Planting calendar ───────────────────────────────────────────── */}
        {result?.planting_calendar && (
          <CalendarCard cal={result.planting_calendar} season={season} lang={lang} t={t} />
        )}

        {/* ── Crop info ───────────────────────────────────────────────────── */}
        {result?.crop_info && (
          <div className="ci-card">
            <div className="ci-inner">
              <div className="ci-hdr">
                <span className="ci-emoji">{CROP_EMOJI[result.recommended_crop] || "🌿"}</span>
                <div className="ci-title">
                  {getCropLabel(result.recommended_crop, lang)} — {t.cropInfoTitle}
                </div>
              </div>
              <div className="ci-body">
                <div className="info-grid">
                  {[
                    { label:t.duration,     val:`${ci.crop_duration_min}–${ci.crop_duration_max}`, sub:t.days    },
                    { label:t.water,        val:`${ci.water_required_min}–${ci.water_required_max}`, sub:t.mmSeason },
                    { label:t.rainfallRange,val:`${ci.rainfall_min}–${ci.rainfall_max}`,            sub:"mm"      },
                    { label:t.phRange,      val:`${ci.ph_min}–${ci.ph_max}`,                        sub:"pH"      },
                    { label:t.tempRange,    val:`${ci.temp_min}–${ci.temp_max}`,                    sub:"°C"      },
                    { label:t.humidityRange,val:`${ci.humidity_min}–${ci.humidity_max}`,            sub:"%"       },
                    { label:t.nRange,       val:`${ci.n_min}–${ci.n_max}`,                          sub:t.kgHa    },
                    { label:t.pRange,       val:`${ci.p_min}–${ci.p_max}`,                          sub:t.kgHa    },
                    { label:t.kRange,       val:`${ci.k_min}–${ci.k_max}`,                          sub:t.kgHa    },
                  ].map(({ label, val, sub }) => (
                    <div className="ip" key={label}>
                      <div className="ip-label">{label}</div>
                      <div className="ip-val">{val}</div>
                      <div className="ip-sub">{sub}</div>
                    </div>
                  ))}
                </div>

                {mode === "full" && (
                  <div className="suit-section">
                    <div className="suit-title">{t.suitabilityTitle}</div>
                    <div className="suit-rows">
                      <SuitBar label={t.nitrogen}    value={N}    min={ci.n_min}        max={ci.n_max}        t={t} />
                      <SuitBar label={t.phosphorus}  value={P}    min={ci.p_min}        max={ci.p_max}        t={t} />
                      <SuitBar label={t.potassium}   value={K}    min={ci.k_min}        max={ci.k_max}        t={t} />
                      <SuitBar label={t.temperature} value={temp} min={ci.temp_min}     max={ci.temp_max}     t={t} />
                      <SuitBar label={t.rainfall}    value={rain} min={ci.rainfall_min} max={ci.rainfall_max} t={t} />
                      <SuitBar label={t.soilPh}      value={ph}   min={ci.ph_min}       max={ci.ph_max}       t={t} />
                      <SuitBar label={t.humidity}    value={hum}  min={ci.humidity_min} max={ci.humidity_max} t={t} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Crop comparison ─────────────────────────────────────────────── */}
        {result?.top_3 && <CompareCard top3={result.top_3} lang={lang} t={t} />}

      </div>

      {/* ── Soil identification guide modal ─────────────────────────────── */}
      {showGuide && <SoilGuideModal lang={lang} t={t} onClose={() => setShowGuide(false)} />}
    </div>
  );
}
