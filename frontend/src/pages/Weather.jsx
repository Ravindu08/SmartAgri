import { useState } from "react";
import { ML_BASE_URL } from "../services/api";
import { DISTRICTS } from "../data/districtZones";
import { DISTRICT_LABELS } from "../data/translations";
import CustomSelect from "../components/CustomSelect";
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
    // Empty state
    liveWeatherBadge: "🌦️ Live Weather",
    emptyLabel: "WHAT YOU'LL SEE",
    emptyTitle: "Live weather data for your farm",
    emptySub: "Select your district above to load real-time conditions and receive farming advice tailored to your area.",
    prev1Title: "Current Conditions",
    prev1Desc: "Temperature, humidity, wind speed, and rainfall for your district right now.",
    prev1Tags: ["Temperature", "Humidity", "Wind", "Rainfall"],
    prev2Title: "7-Day Forecast",
    prev2Desc: "Daily forecast with max/min temperatures, conditions, and expected rainfall for the week ahead.",
    prev2Tags: ["Daily forecast", "Rain probability"],
    prev3Title: "Farm Advisory",
    prev3Desc: "Context-aware farming recommendations based on current weather — including risk alerts and action tips.",
    prev3Tags: ["Risk alerts", "Action tips"],
    zonesLabel: "SRI LANKA CLIMATE ZONES",
    zone1Name: "Wet Zone",
    zone1Desc: "Rainfall >2500 mm/yr. Suited for tea, rubber, coconut. High humidity — monitor fungal diseases closely.",
    zone1Districts: "Colombo · Kandy · Galle · Ratnapura · Kegalle",
    zone2Name: "Dry Zone",
    zone2Desc: "Rainfall <1750 mm/yr. Suited for paddy (Maha/Yala), onion, chilli. Irrigation critical in dry months.",
    zone2Districts: "Anuradhapura · Polonnaruwa · Hambantota · Vavuniya · Mannar",
    zone3Name: "Intermediate Zone",
    zone3Desc: "Rainfall 1750–2500 mm/yr. Versatile zone — paddy, vegetables, and cash crops all viable.",
    zone3Districts: "Kurunegala · Matale · Badulla · Moneragala",
    seasonsLabel: "SRI LANKA FARMING SEASONS",
    sea1Name: "Maha Season",
    sea1Months: "Oct — Feb",
    sea1Desc: "Main paddy season. North-East monsoon brings rain. Best for paddy, vegetables in most zones.",
    sea2Name: "Yala Season",
    sea2Months: "Apr — Sep",
    sea2Desc: "Minor paddy season. South-West monsoon. Good for Dry Zone crops. Irrigation more important.",
    sea3Name: "Year-Round",
    sea3Months: "All months",
    sea3Desc: "Vegetables, fruits, and cash crops can be grown year-round in suitable zones with irrigation.",
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
    // Empty state
    liveWeatherBadge: "🌦️ සජීවී කාලගුණ",
    emptyLabel: "ඔබට ලැබෙන දේ",
    emptyTitle: "ඔබේ ගොවිපළ සඳහා සජීවී කාලගුණ දත්ත",
    emptySub: "සජීවී කොන්දේසි ලබාගෙන ඔබේ ප්‍රදේශයට ගැළපෙන ගොවිතැන් උපදෙස් ලබාගැනීමට ඉහතින් ඔබේ දිස්ත්‍රික්කය තෝරන්න.",
    prev1Title: "වත්මන් තත්ත්ව",
    prev1Desc: "ඔබේ දිස්ත්‍රික්කය සඳහා දැන් උෂ්ණත්වය, ආර්ද්‍රතාවය, සුළං වේගය සහ වර්ෂාපතනය.",
    prev1Tags: ["උෂ්ණත්වය", "ආර්ද්‍රතාවය", "සුළඟ", "වර්ෂාව"],
    prev2Title: "දින 7 අනාවැකිය",
    prev2Desc: "ඉදිරි සතිය සඳහා ඉහළ/අවම උෂ්ණය, තත්ත්ව සහ අපේක්ෂිත වර්ෂාව සහිත දෛනික අනාවැකිය.",
    prev2Tags: ["දෛනික අනාවැකිය", "වර්ෂා සම්භාවිතාව"],
    prev3Title: "ගොවිතැන් උපදෙස්",
    prev3Desc: "වත්මන් කාලගුණය මත පදනම් වූ ගොවිතැන් නිර්දේශ — අවදානම් අනතුරු ඇඟවීම් සහ ක්‍රියා ඉඟි.",
    prev3Tags: ["අවදානම් ඇඟවීම්", "ක්‍රියා ඉඟි"],
    zonesLabel: "ශ්‍රී ලංකාවේ දේශගුණ කලාප",
    zone1Name: "තෙත් කලාපය",
    zone1Desc: "වාර්ෂික වර්ෂාව >2500mm. තේ, රබර්, පොල් සඳහා සුදුසු. ඉහළ ආර්ද්‍රතාවය — දිලීර රෝග නිරීක්ෂණය.",
    zone1Districts: "කොළඹ · මහනුවර · ගාල්ල · රත්නපුරය · කේගල්ල",
    zone2Name: "වියළි කලාපය",
    zone2Desc: "වාර්ෂික වර්ෂාව <1750mm. වී, ළූණු, ගම්මිරිස් සඳහා සුදුසු. වියළි මාසවල ජලසේචනය අත්‍යවශ්‍ය.",
    zone2Districts: "අනුරාධපුරය · පොළොන්නරුව · හම්බන්තොට · වව්නියාව · මන්නාරම",
    zone3Name: "අතරමැදි කලාපය",
    zone3Desc: "වාර්ෂික වර්ෂාව 1750–2500mm. බහුකාර්ය කලාපය — වී, එළවළු, මුදල් බෝග.",
    zone3Districts: "කුරුණෑගල · මාතලේ · බදුල්ල · මොනරාගල",
    seasonsLabel: "ශ්‍රී ලංකාවේ ගොවිතැන් කාල",
    sea1Name: "මහා සමය",
    sea1Months: "ඔක්. — පෙබ.",
    sea1Desc: "ප්‍රධාන වී වගා කාලය. ඊසාන දිශා මෝසම. බොහෝ කලාපවල වී, එළවළු සඳහා ශ්‍රේෂ්ඨ.",
    sea2Name: "යල සමය",
    sea2Months: "අප්‍රේ. — සැප්.",
    sea2Desc: "ද්විතීය වී කාලය. නිරිත දිශා මෝසම. වියළි කලාප බෝග. ජලසේචනය වැදගත්.",
    sea3Name: "සෑම කාලෙකම",
    sea3Months: "සියලු මාස",
    sea3Desc: "සුදුසු කලාපවල ජලසේචනයෙන් එළවළු, පළතුරු, මුදල් බෝග සෑම කාලෙකම වගා කළ හැකිය.",
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
    // Empty state
    liveWeatherBadge: "🌦️ நேரடி வானிலை",
    emptyLabel: "நீங்கள் பெறுவது",
    emptyTitle: "உங்கள் பண்ணைக்கான நேரடி வானிலை தகவல்",
    emptySub: "நேரடி நிலைமைகளை பெறவும் மற்றும் உங்கள் பகுதிக்கு ஏற்ற விவசாய ஆலோசனை பெறவும் மேலே உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்.",
    prev1Title: "தற்போதைய நிலைமைகள்",
    prev1Desc: "உங்கள் மாவட்டத்திற்கான இப்போதைய வெப்பநிலை, ஈரப்பதம், காற்று வேகம் மற்றும் மழை.",
    prev1Tags: ["வெப்பநிலை", "ஈரப்பதம்", "காற்று", "மழை"],
    prev2Title: "7 நாள் முன்னறிவிப்பு",
    prev2Desc: "வரும் வாரத்திற்கான அதிக/குறைந்த வெப்பநிலை, நிலைமைகள் மற்றும் எதிர்பார்க்கப்படும் மழையுடன் தினசரி முன்னறிவிப்பு.",
    prev2Tags: ["தினசரி முன்னறிவிப்பு", "மழை நிகழ்தகவு"],
    prev3Title: "விவசாய ஆலோசனை",
    prev3Desc: "தற்போதைய வானிலையை அடிப்படையாக கொண்ட விவசாய பரிந்துரைகள் — ஆபத்து எச்சரிக்கைகள் மற்றும் செயல் குறிப்புகள்.",
    prev3Tags: ["ஆபத்து எச்சரிக்கைகள்", "செயல் குறிப்புகள்"],
    zonesLabel: "இலங்கையின் காலநிலை மண்டலங்கள்",
    zone1Name: "ஈரமான மண்டலம்",
    zone1Desc: "ஆண்டுத் தேவை >2500mm. தேயிலை, ரப்பர், தென்னை பயிர்களுக்கு ஏற்றது. அதிக ஈரப்பதம் — பூஞ்சை நோய் கவனிக்கவும்.",
    zone1Districts: "கொழும்பு · கண்டி · காலி · இரத்தினபுரி · கேகாலை",
    zone2Name: "வறண்ட மண்டலம்",
    zone2Desc: "ஆண்டுத் தேவை <1750mm. நெல், வெங்காயம், மிளகாய் பயிர்களுக்கு ஏற்றது. வறண்ட மாதங்களில் பாசனம் முக்கியம்.",
    zone2Districts: "அனுராதபுரம் · பொலனாறுவை · அம்பாந்தோட்டை · வாவுனியா · மன்னார்",
    zone3Name: "இடைநிலை மண்டலம்",
    zone3Desc: "ஆண்டுத் தேவை 1750–2500mm. பல்துறை மண்டலம் — நெல், காய்கறிகள், பணப்பயிர்கள் அனைத்தும் சாத்தியம்.",
    zone3Districts: "குருணாகல் · மாத்தளை · பதுளை · மொனராகலை",
    seasonsLabel: "இலங்கையின் விவசாய பருவங்கள்",
    sea1Name: "மஹா பருவம்",
    sea1Months: "அக். — பிப்.",
    sea1Desc: "முக்கிய நெல் பருவம். வடகிழக்கு பருவமழை மழையை கொண்டுவருகிறது. பெரும்பாலான மண்டலங்களில் நெல், காய்கறிகளுக்கு சிறந்தது.",
    sea2Name: "யாள பருவம்",
    sea2Months: "ஏப். — செப்.",
    sea2Desc: "இரண்டாம் நெல் பருவம். தென்மேற்கு பருவமழை. வறண்ட மண்டல பயிர்களுக்கு நல்லது. பாசனம் முக்கியம்.",
    sea3Name: "ஆண்டு முழுவதும்",
    sea3Months: "அனைத்து மாதங்களும்",
    sea3Desc: "பொருத்தமான மண்டலங்களில் பாசனத்துடன் காய்கறிகள், பழங்கள் மற்றும் பணப்பயிர்கள் ஆண்டு முழுவதும் வளர்க்கலாம்.",
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

const API_BASE = ML_BASE_URL;

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
      const res = await fetch(`${API_BASE}/weather?district=${encodeURIComponent(d)}&lang=${lang}`);
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
    <div className="page-wrapper">
    <div className="wx-page">
      {/* Hero */}
      <div className="wx-hero">
        <div className="wx-hero-inner">
          <div className="wx-hero-badge">{t.liveWeatherBadge}</div>
          <h1 className="wx-hero-title">{t.title}</h1>
          <p className="wx-hero-sub">{t.subtitle}</p>
        </div>
      </div>

      <div className="wx-body">
        {/* District selector */}
        <div className="wx-selector-card">
          <label className="wx-selector-label">📍 {t.selectDistrict}</label>
          <div className="wx-selector-row">
            <CustomSelect name="district" value={district} onChange={handleSelect}>
              <option value="">{t.selectPrompt}</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{DISTRICT_LABELS[lang]?.[d] || d}</option>
              ))}
            </CustomSelect>
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
            <div className="wx-info-header">
              <div className="wx-info-label">{t.emptyLabel}</div>
              <h2 className="wx-info-title">{t.emptyTitle}</h2>
              <p className="wx-info-sub">{t.emptySub}</p>
            </div>

            <div className="wx-preview-grid">
              <div className="wx-preview-card">
                <div className="wx-preview-icon">🌡️</div>
                <div className="wx-preview-title">{t.prev1Title}</div>
                <div className="wx-preview-desc">{t.prev1Desc}</div>
                <div className="wx-preview-tags">
                  {t.prev1Tags.map(tag => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="wx-preview-card">
                <div className="wx-preview-icon">📅</div>
                <div className="wx-preview-title">{t.prev2Title}</div>
                <div className="wx-preview-desc">{t.prev2Desc}</div>
                <div className="wx-preview-tags">
                  {t.prev2Tags.map(tag => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="wx-preview-card">
                <div className="wx-preview-icon">🌾</div>
                <div className="wx-preview-title">{t.prev3Title}</div>
                <div className="wx-preview-desc">{t.prev3Desc}</div>
                <div className="wx-preview-tags">
                  {t.prev3Tags.map(tag => <span key={tag}>{tag}</span>)}
                </div>
              </div>
            </div>

            {/* Climate zones info */}
            <div className="wx-zones-section">
              <div className="wx-info-label" style={{marginBottom:"12px"}}>{t.zonesLabel}</div>
              <div className="wx-zones-grid">
                <div className="wx-zone-card wx-zone-wet">
                  <div className="wx-zone-icon">🌧️</div>
                  <div className="wx-zone-name">{t.zone1Name}</div>
                  <div className="wx-zone-desc">{t.zone1Desc}</div>
                  <div className="wx-zone-districts">{t.zone1Districts}</div>
                </div>
                <div className="wx-zone-card wx-zone-dry">
                  <div className="wx-zone-icon">☀️</div>
                  <div className="wx-zone-name">{t.zone2Name}</div>
                  <div className="wx-zone-desc">{t.zone2Desc}</div>
                  <div className="wx-zone-districts">{t.zone2Districts}</div>
                </div>
                <div className="wx-zone-card wx-zone-inter">
                  <div className="wx-zone-icon">🌤️</div>
                  <div className="wx-zone-name">{t.zone3Name}</div>
                  <div className="wx-zone-desc">{t.zone3Desc}</div>
                  <div className="wx-zone-districts">{t.zone3Districts}</div>
                </div>
              </div>
            </div>

            {/* Farming calendar strip */}
            <div className="wx-season-strip">
              <div className="wx-info-label" style={{marginBottom:"12px"}}>{t.seasonsLabel}</div>
              <div className="wx-season-grid">
                <div className="wx-season-card">
                  <div className="wx-season-icon">🌱</div>
                  <div className="wx-season-name">{t.sea1Name}</div>
                  <div className="wx-season-months">{t.sea1Months}</div>
                  <div className="wx-season-desc">{t.sea1Desc}</div>
                </div>
                <div className="wx-season-card">
                  <div className="wx-season-icon">☀️</div>
                  <div className="wx-season-name">{t.sea2Name}</div>
                  <div className="wx-season-months">{t.sea2Months}</div>
                  <div className="wx-season-desc">{t.sea2Desc}</div>
                </div>
                <div className="wx-season-card">
                  <div className="wx-season-icon">🥬</div>
                  <div className="wx-season-name">{t.sea3Name}</div>
                  <div className="wx-season-months">{t.sea3Months}</div>
                  <div className="wx-season-desc">{t.sea3Desc}</div>
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
                  <div className="wx-stat-icon">{data.current.condition_icon}</div>
                  <div className="wx-stat-body">
                    <div className="wx-stat-label">{t.condition}</div>
                    <div className="wx-stat-value">{data.current.condition}</div>
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
    </div>
  );
}
