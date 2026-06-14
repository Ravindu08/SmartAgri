import { useState } from "react";
import { DISTRICTS } from "../data/districtZones";
import "../styles/Weather.css";

const WT = {
  en: {
    title: "Weather & Farm Advisory",
    subtitle: "Live weather data with smart farming advice for your district",
    selectDistrict: "Select your district",
    selectPrompt: "Choose a district…",
    fetchBtn: "Get Weather",
    loading: "Fetching weather data…",
    current: "Current Conditions",
    temp: "Temperature",
    humidity: "Humidity",
    wind: "Wind Speed",
    rainfall: "Rainfall",
    condition: "Condition",
    forecast: "7-Day Forecast",
    advice: "Farming Advisory",
    source: "Data source",
    errorTitle: "Could not load weather",
    retry: "Try Again",
    date: "Date",
    max: "Max",
    min: "Min",
    rain: "Rain",
  },
  si: {
    title: "කාලගුණය සහ ගොවිතැන් උපදෙස්",
    subtitle: "ඔබේ දිස්ත්‍රික්කය සඳහා සජීව කාලගුණ දත්ත සහ ගොවිතැන් උපදෙස්",
    selectDistrict: "ඔබේ දිස්ත්‍රික්කය තෝරන්න",
    selectPrompt: "දිස්ත්‍රික්කයක් තෝරන්න…",
    fetchBtn: "කාලගුණය ලබාගන්න",
    loading: "කාලගුණ දත්ත ලබාගනිමින්…",
    current: "වත්මන් තත්වය",
    temp: "උෂ්ණත්වය",
    humidity: "ආර්ද්‍රතාව",
    wind: "සුළං වේගය",
    rainfall: "වර්ෂාපතනය",
    condition: "තත්වය",
    forecast: "දින 7 පිළිබඳ අනාවැකිය",
    advice: "ගොවිතැන් උපදෙස්",
    source: "දත්ත මූලාශ්‍රය",
    errorTitle: "කාලගුණය ලබාගත නොහැකි විය",
    retry: "නැවත උත්සාහ කරන්න",
    date: "දිනය",
    max: "උපරිම",
    min: "අවම",
    rain: "වර්ෂාව",
  },
  ta: {
    title: "வானிலை & விவசாய ஆலோசனை",
    subtitle: "உங்கள் மாவட்டத்திற்கான நேரடி வானிலை தகவல் மற்றும் விவசாய ஆலோசனை",
    selectDistrict: "உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்",
    selectPrompt: "மாவட்டத்தை தேர்ந்தெடுக்கவும்…",
    fetchBtn: "வானிலை பெறவும்",
    loading: "வானிலை தகவல் பெறுகிறது…",
    current: "தற்போதைய நிலைமைகள்",
    temp: "வெப்பநிலை",
    humidity: "ஈரப்பதம்",
    wind: "காற்று வேகம்",
    rainfall: "மழை",
    condition: "நிலைமை",
    forecast: "7 நாள் முன்னறிவிப்பு",
    advice: "விவசாய ஆலோசனை",
    source: "தரவு மூலம்",
    errorTitle: "வானிலை தகவல் பெற முடியவில்லை",
    retry: "மீண்டும் முயற்சிக்கவும்",
    date: "தேதி",
    max: "அதிகபட்சம்",
    min: "குறைந்தபட்சம்",
    rain: "மழை",
  },
};

function StatCard({ icon, label, value, unit, highlight }) {
  return (
    <div className={`wx-stat-card${highlight ? " wx-stat-highlight" : ""}`}>
      <div className="wx-stat-icon">{icon}</div>
      <div className="wx-stat-body">
        <div className="wx-stat-label">{label}</div>
        <div className="wx-stat-value">
          {value}<span className="wx-stat-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function AdviceCard({ item }) {
  const cls = {
    warning: "wx-advice-warning",
    risk:    "wx-advice-risk",
    danger:  "wx-advice-danger",
    action:  "wx-advice-action",
    info:    "wx-advice-info",
  }[item.type] || "wx-advice-info";

  return (
    <div className={`wx-advice-card ${cls}`}>
      <div className="wx-advice-icon">{item.icon}</div>
      <div className="wx-advice-body">
        <div className="wx-advice-title">{item.title}</div>
        <div className="wx-advice-detail">{item.detail}</div>
      </div>
    </div>
  );
}

function ForecastRow({ day, t }) {
  const date = new Date(day.date);
  const dayName = date.toLocaleDateString("en-LK", { weekday: "short", month: "short", day: "numeric" });
  return (
    <div className="wx-forecast-row">
      <div className="wx-fc-date">{dayName}</div>
      <div className="wx-fc-icon">{day.icon}</div>
      <div className="wx-fc-cond">{day.condition}</div>
      <div className="wx-fc-temps">
        <span className="wx-fc-max">{day.max_temp?.toFixed(1)}°</span>
        <span className="wx-fc-sep">/</span>
        <span className="wx-fc-min">{day.min_temp?.toFixed(1)}°</span>
      </div>
      <div className="wx-fc-rain">
        {day.rain_mm > 0 ? `💧 ${day.rain_mm?.toFixed(1)} mm` : "—"}
        {day.precip_prob > 0 && (
          <span className="wx-fc-prob"> ({Math.round(day.precip_prob)}%)</span>
        )}
      </div>
    </div>
  );
}

// Weather endpoint lives on the ML service (port 8000).
// Use an empty base so Vite's dev-server proxy forwards /weather → port 8000.
const API_BASE = "";

export default function Weather({ lang, onWeatherFetched }) {
  const t = WT[lang] || WT.en;
  const [district, setDistrict] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async (d) => {
    if (!d) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/weather?district=${encodeURIComponent(d)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      onWeatherFetched?.(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e) => {
    const val = e.target.value;
    setDistrict(val);
    setData(null);
    setError(null);
    if (val) fetchWeather(val);
  };

  return (
    <div className="wx-page">
      {/* Hero */}
      <div className="wx-hero">
        <div className="wx-hero-inner">
          <div className="wx-hero-badge">🌦️ Live Weather</div>
          <h1 className="wx-hero-title">{t.title}</h1>
          <p className="wx-hero-sub">{t.subtitle}</p>
        </div>
      </div>

      <div className="wx-body">
        {/* District selector */}
        <div className="wx-selector-card">
          <label className="wx-selector-label">📍 {t.selectDistrict}</label>
          <div className="wx-selector-row">
            <select
              className="wx-select"
              value={district}
              onChange={handleSelect}
            >
              <option value="">{t.selectPrompt}</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              className="wx-fetch-btn"
              disabled={!district || loading}
              onClick={() => fetchWeather(district)}
            >
              {loading ? "⏳" : "🔍"} {t.fetchBtn}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="wx-loading">
            <div className="wx-spinner" />
            <p>{t.loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="wx-error-card">
            <div className="wx-error-icon">⚠️</div>
            <div>
              <div className="wx-error-title">{t.errorTitle}</div>
              <div className="wx-error-detail">{error}</div>
            </div>
            <button className="wx-retry-btn" onClick={() => fetchWeather(district)}>
              {t.retry}
            </button>
          </div>
        )}

        {/* Empty state — shown before any weather is fetched */}
        {!loading && !data && !error && (
          <div className="wx-info-state">
            {/* What you'll see */}
            <div className="wx-info-header">
              <div className="wx-info-label">WHAT YOU'LL SEE</div>
              <h2 className="wx-info-title">Live weather data for your farm</h2>
              <p className="wx-info-sub">Select your district above to load real-time conditions and receive farming advice tailored to your area.</p>
            </div>

            <div className="wx-preview-grid">
              <div className="wx-preview-card">
                <div className="wx-preview-icon">🌡️</div>
                <div className="wx-preview-title">Current Conditions</div>
                <div className="wx-preview-desc">Temperature, humidity, wind speed, and rainfall for your district right now.</div>
                <div className="wx-preview-tags">
                  <span>Temperature</span><span>Humidity</span><span>Wind</span><span>Rainfall</span>
                </div>
              </div>
              <div className="wx-preview-card">
                <div className="wx-preview-icon">📅</div>
                <div className="wx-preview-title">7-Day Forecast</div>
                <div className="wx-preview-desc">Daily forecast with max/min temperatures, conditions, and expected rainfall for the week ahead.</div>
                <div className="wx-preview-tags">
                  <span>Daily forecast</span><span>Rain probability</span>
                </div>
              </div>
              <div className="wx-preview-card">
                <div className="wx-preview-icon">🌾</div>
                <div className="wx-preview-title">Farm Advisory</div>
                <div className="wx-preview-desc">Context-aware farming recommendations based on current weather — including risk alerts and action tips.</div>
                <div className="wx-preview-tags">
                  <span>Risk alerts</span><span>Action tips</span>
                </div>
              </div>
            </div>

            {/* Climate zones info */}
            <div className="wx-zones-section">
              <div className="wx-info-label" style={{marginBottom:"12px"}}>SRI LANKA CLIMATE ZONES</div>
              <div className="wx-zones-grid">
                <div className="wx-zone-card wx-zone-wet">
                  <div className="wx-zone-icon">🌧️</div>
                  <div className="wx-zone-name">Wet Zone</div>
                  <div className="wx-zone-desc">Rainfall &gt;2500 mm/yr. Suited for tea, rubber, coconut. High humidity — monitor fungal diseases closely.</div>
                  <div className="wx-zone-districts">Colombo · Kandy · Galle · Ratnapura · Kegalle</div>
                </div>
                <div className="wx-zone-card wx-zone-dry">
                  <div className="wx-zone-icon">☀️</div>
                  <div className="wx-zone-name">Dry Zone</div>
                  <div className="wx-zone-desc">Rainfall &lt;1750 mm/yr. Suited for paddy (Maha/Yala), onion, chilli. Irrigation critical in dry months.</div>
                  <div className="wx-zone-districts">Anuradhapura · Polonnaruwa · Hambantota · Vavuniya · Mannar</div>
                </div>
                <div className="wx-zone-card wx-zone-inter">
                  <div className="wx-zone-icon">🌤️</div>
                  <div className="wx-zone-name">Intermediate Zone</div>
                  <div className="wx-zone-desc">Rainfall 1750–2500 mm/yr. Versatile zone — paddy, vegetables, and cash crops all viable.</div>
                  <div className="wx-zone-districts">Kurunegala · Matale · Badulla · Moneragala</div>
                </div>
              </div>
            </div>

            {/* Farming calendar strip */}
            <div className="wx-season-strip">
              <div className="wx-info-label" style={{marginBottom:"12px"}}>SRI LANKA FARMING SEASONS</div>
              <div className="wx-season-grid">
                <div className="wx-season-card">
                  <div className="wx-season-icon">🌱</div>
                  <div className="wx-season-name">Maha Season</div>
                  <div className="wx-season-months">Oct — Feb</div>
                  <div className="wx-season-desc">Main paddy season. North-East monsoon brings rain. Best for paddy, vegetables in most zones.</div>
                </div>
                <div className="wx-season-card">
                  <div className="wx-season-icon">☀️</div>
                  <div className="wx-season-name">Yala Season</div>
                  <div className="wx-season-months">Apr — Sep</div>
                  <div className="wx-season-desc">Minor paddy season. South-West monsoon. Good for Dry Zone crops. Irrigation more important.</div>
                </div>
                <div className="wx-season-card">
                  <div className="wx-season-icon">🥬</div>
                  <div className="wx-season-name">Year-Round</div>
                  <div className="wx-season-months">All months</div>
                  <div className="wx-season-desc">Vegetables, fruits, and cash crops can be grown year-round in suitable zones with irrigation.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Current conditions */}
            <section className="wx-section">
              <h2 className="wx-section-title">
                {data.current.condition_icon} {t.current} — {data.district}
              </h2>
              <div className="wx-stats-grid">
                <StatCard icon="🌡️" label={t.temp}     value={data.current.temperature?.toFixed(1)} unit="°C" highlight={data.current.temperature > 35} />
                <StatCard icon="💧" label={t.humidity} value={data.current.humidity}                unit="%" highlight={data.current.humidity > 80} />
                <StatCard icon="💨" label={t.wind}     value={data.current.wind_kph?.toFixed(1)}   unit=" km/h" highlight={data.current.wind_kph > 30} />
                <StatCard icon="🌧️" label={t.rainfall} value={data.current.rainfall_mm?.toFixed(1)} unit=" mm" />
                <div className="wx-stat-card wx-stat-wide">
                  <div className="wx-stat-icon">🌤️</div>
                  <div className="wx-stat-body">
                    <div className="wx-stat-label">{t.condition}</div>
                    <div className="wx-stat-value">{data.current.condition_icon} {data.current.condition}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Farming advice */}
            <section className="wx-section">
              <h2 className="wx-section-title">🌾 {t.advice}</h2>
              <div className="wx-advice-list">
                {data.advice.map((item, i) => (
                  <AdviceCard key={i} item={item} />
                ))}
              </div>
            </section>

            {/* 7-day forecast */}
            <section className="wx-section">
              <h2 className="wx-section-title">📅 {t.forecast}</h2>
              <div className="wx-forecast-table">
                <div className="wx-forecast-header">
                  <div>{t.date}</div>
                  <div></div>
                  <div>{t.condition}</div>
                  <div>{t.max} / {t.min}</div>
                  <div>{t.rain}</div>
                </div>
                {data.forecast.map((day, i) => (
                  <ForecastRow key={i} day={day} t={t} />
                ))}
              </div>
            </section>

            <p className="wx-source">
              {t.source}: <a href="https://open-meteo.com" target="_blank" rel="noreferrer">{data.source}</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
