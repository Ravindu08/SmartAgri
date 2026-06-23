import { useState, useEffect } from "react";
import { ML_BASE_URL } from "../services/api";
import { DISTRICTS } from "../data/districtZones";
import { DISTRICT_LABELS } from "../data/translations";
import CustomSelect from "./CustomSelect";
import "./WeatherLocationPicker.css";

const API_BASE = ML_BASE_URL;

const SEASONS = ["Maha", "Yala", "Year-round"];
const SEA_LABELS_INLINE = {
  en: { Maha: "Maha (Oct–Feb)", Yala: "Yala (May–Sep)", "Year-round": "Year-round" },
  si: { Maha: "මහ (ඔක්.–පෙබ.)", Yala: "යල (මැයි–සැප්.)", "Year-round": "සෘතු හතරටම" },
  ta: { Maha: "மஹா (அக்.–பிப்.)", Yala: "யாலா (மே–செப்.)", "Year-round": "ஆண்டு முழுவதும்" },
};

export default function WeatherLocationPicker({ weather, onWeatherFetched, t, lang = "en" }) {
  const [district, setDistrict] = useState(weather?.district || "");
  const [season,   setSeason]   = useState(weather?.season_name || "");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Keep district in sync if parent clears weather
  useEffect(() => {
    if (weather?.district && !district) setDistrict(weather.district);
  }, [weather?.district]);

  async function fetchWeather(d, s) {
    if (!d) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ district: d });
      if (s) params.set("season", s);
      const res = await fetch(`${API_BASE}/weather?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      onWeatherFetched(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDistrictChange(e) {
    const d = e.target.value;
    setDistrict(d);
    if (d) fetchWeather(d, season);
    else onWeatherFetched(null);
  }

  function handleSeasonChange(e) {
    const s = e.target.value;
    setSeason(s);
    if (district) fetchWeather(district, s);
  }

  const hasWeather  = weather && weather.district === district;
  const c           = hasWeather ? weather.current : null;
  const seaLabels   = SEA_LABELS_INLINE[lang] || SEA_LABELS_INLINE.en;

  // Seasonal archive averages (populated when season is selected)
  const seasonAvgTemp = hasWeather ? weather.season_avg_temp     : null;
  const seasonAvgHum  = hasWeather ? weather.season_avg_humidity  : null;
  const seasonRainMm  = hasWeather ? weather.season_actual_mm     : null;
  const seasonName    = hasWeather ? weather.season_name          : null;
  const hasSeasonData = seasonAvgTemp != null || seasonAvgHum != null;

  return (
    <div className="wlp-strip">
      {/* ── District + Season selectors ── */}
      <div className="wlp-left">
        <span className="wlp-icon">📍</span>
        <CustomSelect name="district" value={district} onChange={handleDistrictChange}>
          <option value="">{t?.selectDistrictWeather || "Select district…"}</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{DISTRICT_LABELS[lang]?.[d] || d}</option>)}
        </CustomSelect>

        <span className="wlp-icon" style={{ marginLeft: 4 }}>📅</span>
        <CustomSelect name="season" value={season} onChange={handleSeasonChange}>
          <option value="">{t?.season || 'Season'} ({t?.optional || 'optional'})</option>
          {SEASONS.map(s => <option key={s} value={s}>{seaLabels[s]}</option>)}
        </CustomSelect>

        {loading && <span className="wlp-spinner" />}
      </div>

      {/* ── Live current conditions ── */}
      {hasWeather && !loading && c && (
        <div className="wlp-summary">
          <span className="wlp-cond">{c.condition_icon} {c.condition}</span>
          <span className="wlp-divider">·</span>
          <span className={c.temperature > 35 ? "wlp-val wlp-warn" : "wlp-val"}>🌡️ {c.temperature.toFixed(1)}°C</span>
          <span className="wlp-divider">·</span>
          <span className={c.humidity > 80 ? "wlp-val wlp-warn" : "wlp-val"}>💧 {c.humidity}%</span>
          <span className="wlp-divider">·</span>
          <span className={c.wind_kph > 30 ? "wlp-val wlp-warn" : "wlp-val"}>💨 {c.wind_kph.toFixed(0)} km/h</span>
        </div>
      )}

      {/* ── Seasonal archive averages ── */}
      {hasWeather && !loading && hasSeasonData && (
        <div className="wlp-seasonal">
          <span className="wlp-seasonal-label">
            📊 {seasonName || "Seasonal"} avg
          </span>
          {seasonAvgTemp != null && (
            <span className="wlp-seasonal-val">🌡️ {seasonAvgTemp}°C</span>
          )}
          {seasonAvgHum != null && (
            <span className="wlp-seasonal-val">💧 {seasonAvgHum}%</span>
          )}
          {seasonRainMm != null && (
            <span className="wlp-seasonal-val">🌧️ {seasonRainMm} mm</span>
          )}
        </div>
      )}

      {error && <span className="wlp-error">⚠️ {error}</span>}
    </div>
  );
}
