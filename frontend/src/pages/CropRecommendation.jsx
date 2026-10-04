import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, BookOpen, ChartLine, Check, CloudSun, Info, MapPin, Printer, Sparkles, Sprout, TriangleAlert } from "lucide-react";
import { ML_BASE_URL } from "../services/api";
import { celebrate } from "../utils/celebrate";

import "../styles/CropRecommendation.css";
import "../styles/tool-rec.css";
import ToolSwitcher from "../components/ToolSwitcher";
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
import SpotlightTour   from "../components/tour/SpotlightTour";
import HelpButton      from "../components/tour/HelpButton";

const API_BASE = ML_BASE_URL;

const CR_TOUR_T = {
  en: {
    steps: [
      { target: 'cr-history', title: 'Your past predictions', body: 'Every recommendation you run is saved here so you can revisit it later.' },
      { target: 'cr-district-select', title: 'Pick your district', body: 'Your district determines the agro-ecological zone and unlocks live weather auto-fill below.' },
      { target: 'cr-soil-select', title: 'Soil type', body: 'Not sure what soil you have? Use the "Identify my soil" guide next to this field.' },
      { target: 'cr-nutrient-fields', title: 'Soil & climate values', body: 'Enter your N/P/K and climate readings, or let weather auto-fill do it for you once a district is picked.' },
      { target: 'cr-predict-btn', title: 'Get your recommendation', body: 'Run the full AI analysis — you’ll get a recommended crop, confidence score, and an explanation of why.' },
      { target: 'cr-result-card', title: 'Your result appears here', body: 'The recommended crop, alternatives, and a planting calendar will show up in this area.' },
      { target: 'cr-xai-card', title: 'Understand why', body: 'See exactly which factors — soil, climate, season — drove this recommendation, and how much each one mattered.' },
      { target: 'cr-crop-info-card', title: 'Full crop profile', body: 'Ideal duration, water needs, and nutrient ranges for the recommended crop — see how your own values compare.' },
      { target: 'cr-compare-card', title: 'Compare top picks', body: 'See how the top 3 recommended crops stack up side by side before you decide.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'cr-history', title: 'ඔබේ පෙර නිර්දේශ', body: 'ඔබ ධාවනය කරන සෑම නිර්දේශයක්ම පසුව නැවත බැලීමට මෙහි සුරැකේ.' },
      { target: 'cr-district-select', title: 'ඔබේ දිස්ත්‍රික්කය තෝරන්න', body: 'ඔබේ දිස්ත්‍රික්කය කෘෂි-පාරිසරික කලාපය තීරණය කර පහත සජීවී කාලගුණ ස්වයං-පිරවීම විවෘත කරයි.' },
      { target: 'cr-soil-select', title: 'පස වර්ගය', body: 'ඔබේ පස කුමක්දැයි විශ්වාස නැද්ද? මෙම ක්ෂේත්‍රය අසල ඇති "මගේ පස හඳුනාගන්න" මාර්ගෝපදේශය භාවිතා කරන්න.' },
      { target: 'cr-nutrient-fields', title: 'පස සහ දේශගුණ අගයන්', body: 'ඔබේ N/P/K සහ දේශගුණ කියැවීම් ඇතුළත් කරන්න, නැතහොත් දිස්ත්‍රික්කයක් තෝරූ පසු කාලගුණ ස්වයං-පිරවීමට ඉඩ දෙන්න.' },
      { target: 'cr-predict-btn', title: 'ඔබේ නිර්දේශය ලබාගන්න', body: 'සම්පූර්ණ AI විශ්ලේෂණය ධාවනය කරන්න — ඔබට නිර්දේශිත බෝගයක්, විශ්වාස ලකුණු, සහ එය මන්දැයි පැහැදිලි කිරීමක් ලැබෙනු ඇත.' },
      { target: 'cr-result-card', title: 'ඔබේ ප්‍රතිඵලය මෙහි පෙන්වයි', body: 'නිර්දේශිත බෝගය, විකල්ප, සහ වගා දින දර්ශනයක් මෙම ප්‍රදේශයේ පෙන්වනු ඇත.' },
      { target: 'cr-xai-card', title: 'මන්දැයි තේරුම් ගන්න', body: 'පස, දේශගුණය, කන්නය වැනි කුමන සාධක මෙම නිර්දේශයට හේතු වූයේද, සහ එක් එක් සාධකයේ බලපෑම කොපමණද යන්න බලන්න.' },
      { target: 'cr-crop-info-card', title: 'සම්පූර්ණ බෝග පැතිකඩ', body: 'නිර්දේශිත බෝගය සඳහා පරමාදර්ශී කාලසීමාව, ජල අවශ්‍යතාව, සහ පෝෂක පරාසයන් — ඔබේ අගයන් සමඟ සසඳන්න.' },
      { target: 'cr-compare-card', title: 'ඉහළම තේරීම් සසඳන්න', body: 'තීරණය කිරීමට පෙර ඉහළම බෝග 3 එකිනෙකට සසඳා බලන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'cr-history', title: 'உங்கள் முந்தைய பரிந்துரைகள்', body: 'நீங்கள் இயக்கும் ஒவ்வொரு பரிந்துரையும் பின்னர் பார்வையிட இங்கே சேமிக்கப்படும்.' },
      { target: 'cr-district-select', title: 'உங்கள் மாவட்டத்தைத் தேர்வு செய்யுங்கள்', body: 'உங்கள் மாவட்டம் வேளாண்-சுற்றுச்சூழல் மண்டலத்தை நிர்ணயித்து கீழே நேரடி வானிலை தானியங்கி-நிரப்புதலைத் திறக்கும்.' },
      { target: 'cr-soil-select', title: 'மண் வகை', body: 'உங்கள் மண் என்னவென்று உறுதியாக தெரியவில்லையா? இந்த புலத்திற்கு அருகில் உள்ள "என் மண்ணை அடையாளம் காணுங்கள்" வழிகாட்டியைப் பயன்படுத்துங்கள்.' },
      { target: 'cr-nutrient-fields', title: 'மண் மற்றும் காலநிலை மதிப்புகள்', body: 'உங்கள் N/P/K மற்றும் காலநிலை அளவீடுகளை உள்ளிடுங்கள், அல்லது மாவட்டம் தேர்ந்தெடுத்தவுடன் வானிலை தானாக நிரப்பட்டும்.' },
      { target: 'cr-predict-btn', title: 'உங்கள் பரிந்துரையைப் பெறுங்கள்', body: 'முழு AI பகுப்பாய்வை இயக்குங்கள் — பரிந்துரைக்கப்பட்ட பயிர், நம்பகத்தன்மை மதிப்பெண் மற்றும் ஏன் என்பதற்கான விளக்கத்தைப் பெறுவீர்கள்.' },
      { target: 'cr-result-card', title: 'உங்கள் முடிவு இங்கே தோன்றும்', body: 'பரிந்துரைக்கப்பட்ட பயிர், மாற்றுகள் மற்றும் நடவு நாட்காட்டி இந்தப் பகுதியில் தோன்றும்.' },
      { target: 'cr-xai-card', title: 'ஏன் என்பதை புரிந்துகொள்ளுங்கள்', body: 'மண், காலநிலை, பருவகாலம் போன்ற எந்த காரணிகள் இந்த பரிந்துரையை உருவாக்கின, ஒவ்வொரு காரணியின் தாக்கம் எவ்வளவு என்பதைப் பாருங்கள்.' },
      { target: 'cr-crop-info-card', title: 'முழுமையான பயிர் விவரம்', body: 'பரிந்துரைக்கப்பட்ட பயிருக்கான சிறந்த காலஅளவு, நீர் தேவை, மற்றும் ஊட்டச்சத்து வரம்புகள் — உங்கள் மதிப்புகளுடன் ஒப்பிடுங்கள்.' },
      { target: 'cr-compare-card', title: 'சிறந்த தேர்வுகளை ஒப்பிடுங்கள்', body: 'முடிவெடுப்பதற்கு முன் சிறந்த 3 பயிர்களை பக்கத்திற்குப் பக்கம் ஒப்பிட்டுப் பாருங்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

// Form field key -> the name the API uses for the same feature.
const API_FIELD = {
  N: "N", P: "P", K: "K",
  temp: "Temperature", rain: "Rainfall", ph: "pH", hum: "Humidity",
};

// Used only until /meta answers. The server is the authority on these bounds —
// see NUMERIC_RANGES in backend/ml_service/app.py — so this is a starting value,
// not a second source of truth.
//
// These are the range of the TRAINING DATA, not what is physically possible.
// Outside it the model has no evidence and returns a confident guess, so the
// form refuses the value rather than asking for one.
const FALLBACK_RANGES = {
  N:           { min: 10,   max: 226,  step: 1   },
  P:           { min: 12,   max: 151,  step: 1   },
  K:           { min: 22,   max: 217,  step: 1   },
  Temperature: { min: 13.6, max: 35.5, step: 0.1 },
  Rainfall:    { min: 25,   max: 3663, step: 1   },
  pH:          { min: 4.9,  max: 8.2,  step: 0.1 },
  Humidity:    { min: 45,   max: 97,   step: 1   },
};

// Label key + unit per form field, shared by the inputs and the clamp notice.
const NUM_FIELD_META = {
  N:    { labelKey: "nitrogen",    unit: "kg/ha", placeholder: "100"  },
  P:    { labelKey: "phosphorus",  unit: "kg/ha", placeholder: "60"   },
  K:    { labelKey: "potassium",   unit: "kg/ha", placeholder: "91"   },
  temp: { labelKey: "temperature", unit: "°C",    placeholder: "27"   },
  rain: { labelKey: "rainfall",    unit: "mm",    placeholder: "1051" },
  ph:   { labelKey: "soilPh",      unit: "pH",    placeholder: "6.3"  },
  hum:  { labelKey: "humidity",    unit: "%",     placeholder: "72"   },
};

// Drop a trailing ".0" so hints read "0–300", not "0.0–300.0".
const fmtBound = n => (Number.isInteger(Number(n)) ? String(Number(n)) : String(n));

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

// Text for the redesigned layout. Field labels, errors and result wording still
// come from the shared T table.
const CR2_T = {
  en: {
    eyebrow: "AI Crop Recommendation", h1a: "Find the crop your land is", h1b: "made for.",
    sub: "Tell us about your location, farm and soil. The model compares them against Sri Lanka's agro-climatic zones and explains every result.",
    chipParams: "parameters analysed", chipMatches: "ranked matches", chipWhy: "Explains why",
    s1: "Location", s1h: "Where is the farm?",
    s2: "Farm conditions", s2h: "Soil, water and season",
    s3: "Soil nutrients and climate", s3h: "Drag a slider or type a value",
    done: "Complete", todo: "To do", typical: "Use typical values",
    quick: "Common soils", allSoils: "All soil types",
    cta: "Get my crop recommendation",
    best: "Best match", match: "match", second: "2nd choice", third: "3rd choice",
    guide: "Open growing guide", yield: "Estimate yield and price", print: "Print",
    emptyT: "Your recommendation appears here",
    emptyB: "Complete the three steps, then press the button. You will get:",
    e1: "The best crop with a confidence score", e2: "Two alternatives to compare",
    e3: "The factors behind the choice", e4: "A planting calendar and crop profile",
    progress: "steps complete", details: "Full details", detailsSub: "Calendar, crop profile and comparison",
    tipsT: "For the most accurate result", tipsS: "Three quick checks",
    tip1: "Use a recent soil test for nitrogen, phosphorus and potassium if you have one.",
    tip2: "Choose the season you will actually plant in. It changes the weather values used.",
    tip3: "Not sure about the soil? Open \"Identify my soil\" for a simple field test.",
  },
  si: {
    eyebrow: "AI බෝග නිර්දේශය", h1a: "ඔබේ ඉඩමට වඩාත්ම", h1b: "ගැලපෙන බෝගය සොයන්න.",
    sub: "ඔබේ ස්ථානය, ගොවිපළ සහ පස ගැන අපට කියන්න. ආකෘතිය ඒවා ශ්‍රී ලංකාවේ කෘෂි-දේශගුණික කලාප සමඟ සසඳා සෑම ප්‍රතිඵලයක්ම පැහැදිලි කරයි.",
    chipParams: "පරාමිති විශ්ලේෂණය", chipMatches: "ශ්‍රේණිගත ගැලපීම්", chipWhy: "හේතුව පැහැදිලි කරයි",
    s1: "ස්ථානය", s1h: "ගොවිපළ කොහේද?",
    s2: "ගොවිපළ තත්ත්ව", s2h: "පස, ජලය සහ කන්නය",
    s3: "පාංශු පෝෂක සහ දේශගුණය", s3h: "ස්ලයිඩරය අදින්න හෝ අගයක් ටයිප් කරන්න",
    done: "සම්පූර්ණයි", todo: "ඉතිරියි", typical: "සාමාන්‍ය අගයන් යොදන්න",
    quick: "බහුල පස් වර්ග", allSoils: "සියලු පස් වර්ග",
    cta: "මගේ බෝග නිර්දේශය ලබාගන්න",
    best: "හොඳම ගැලපීම", match: "ගැලපීම", second: "2 වන තේරීම", third: "3 වන තේරීම",
    guide: "වගා මාර්ගෝපදේශය විවෘත කරන්න", yield: "අස්වැන්න සහ මිල ඇස්තමේන්තු කරන්න", print: "මුද්‍රණය",
    emptyT: "ඔබේ නිර්දේශය මෙහි දිස්වේ",
    emptyB: "පියවර තුන සම්පූර්ණ කර බොත්තම ඔබන්න. ඔබට ලැබෙන්නේ:",
    e1: "විශ්වාස ලකුණු සහිත හොඳම බෝගය", e2: "සංසන්දනය සඳහා විකල්ප දෙකක්",
    e3: "තේරීමට හේතු වූ සාධක", e4: "වගා දින දර්ශනයක් සහ බෝග පැතිකඩ",
    progress: "පියවර සම්පූර්ණයි", details: "සම්පූර්ණ විස්තර", detailsSub: "දින දර්ශනය, බෝග පැතිකඩ සහ සංසන්දනය",
    tipsT: "වඩාත් නිවැරදි ප්‍රතිඵලයක් සඳහා", tipsS: "ඉක්මන් පරීක්ෂා තුනක්",
    tip1: "ඔබ සතුව මෑත පාංශු පරීක්ෂණයක් තිබේ නම් නයිට්‍රජන්, පොස්පරස් සහ පොටෑසියම් සඳහා එය භාවිතා කරන්න.",
    tip2: "ඔබ සැබවින්ම වගා කරන කන්නය තෝරන්න. භාවිතා කරන කාලගුණ අගයන් ඒ අනුව වෙනස් වේ.",
    tip3: "පස ගැන විශ්වාස නැද්ද? සරල ක්ෂේත්‍ර පරීක්ෂණයක් සඳහා \"මගේ පස හඳුනාගන්න\" විවෘත කරන්න.",
  },
  ta: {
    eyebrow: "AI பயிர் பரிந்துரை", h1a: "உங்கள் நிலத்திற்கு", h1b: "ஏற்ற பயிரைக் கண்டறியுங்கள்.",
    sub: "உங்கள் இடம், பண்ணை மற்றும் மண் பற்றி சொல்லுங்கள். மாதிரி அவற்றை இலங்கையின் வேளாண்-காலநிலை மண்டலங்களுடன் ஒப்பிட்டு ஒவ்வொரு முடிவையும் விளக்குகிறது.",
    chipParams: "அளவுருக்கள் பகுப்பாய்வு", chipMatches: "தரவரிசைப் பொருத்தங்கள்", chipWhy: "ஏன் என்பதை விளக்குகிறது",
    s1: "இடம்", s1h: "பண்ணை எங்கே உள்ளது?",
    s2: "பண்ணை நிலைமைகள்", s2h: "மண், நீர் மற்றும் பருவம்",
    s3: "மண் ஊட்டச்சத்து மற்றும் காலநிலை", s3h: "ஸ்லைடரை இழுக்கவும் அல்லது மதிப்பை தட்டச்சு செய்யவும்",
    done: "முடிந்தது", todo: "நிலுவையில்", typical: "வழக்கமான மதிப்புகளைப் பயன்படுத்து",
    quick: "பொதுவான மண் வகைகள்", allSoils: "அனைத்து மண் வகைகள்",
    cta: "எனது பயிர் பரிந்துரையைப் பெறு",
    best: "சிறந்த பொருத்தம்", match: "பொருத்தம்", second: "2வது தேர்வு", third: "3வது தேர்வு",
    guide: "வளர்ப்பு வழிகாட்டியைத் திற", yield: "மகசூல் மற்றும் விலையை மதிப்பிடு", print: "அச்சிடு",
    emptyT: "உங்கள் பரிந்துரை இங்கே தோன்றும்",
    emptyB: "மூன்று படிகளையும் முடித்து பொத்தானை அழுத்துங்கள். உங்களுக்குக் கிடைப்பவை:",
    e1: "நம்பிக்கை மதிப்பெண்ணுடன் சிறந்த பயிர்", e2: "ஒப்பிட இரண்டு மாற்றுகள்",
    e3: "தேர்வுக்கான காரணிகள்", e4: "நடவு நாட்காட்டி மற்றும் பயிர் விவரம்",
    progress: "படிகள் முடிந்தன", details: "முழு விவரங்கள்", detailsSub: "நாட்காட்டி, பயிர் விவரம் மற்றும் ஒப்பீடு",
    tipsT: "மிகத் துல்லியமான முடிவுக்கு", tipsS: "மூன்று விரைவான சரிபார்ப்புகள்",
    tip1: "சமீபத்திய மண் பரிசோதனை இருந்தால் நைட்ரஜன், பாஸ்பரஸ், பொட்டாசியத்திற்கு அதைப் பயன்படுத்துங்கள்.",
    tip2: "நீங்கள் உண்மையில் நடவு செய்யும் பருவத்தைத் தேர்ந்தெடுங்கள். பயன்படுத்தப்படும் வானிலை மதிப்புகள் அதற்கேற்ப மாறும்.",
    tip3: "மண் பற்றி உறுதியில்லையா? எளிய வயல் சோதனைக்கு \"என் மண்ணை அடையாளம் காண்\" என்பதைத் திறக்கவும்.",
  },
};

// Colour and short tag for each numeric field's slider.
const FIELD_LOOK = {
  N:    { color: "#22c55e", tag: "N"  },
  P:    { color: "#fb923c", tag: "P"  },
  K:    { color: "#c084fc", tag: "K"  },
  temp: { color: "#f87171", tag: "°C" },
  rain: { color: "#38bdf8", tag: "mm" },
  ph:   { color: "#2dd4bf", tag: "pH" },
  hum:  { color: "#818cf8", tag: "%"  },
};

// Offered as one-tap chips; every soil stays available in the dropdown.
const COMMON_SOILS = ["Loam", "Sandy Loam", "Clay Loam", "Red Loam", "Alluvial", "Reddish-Brown Earth"];

// The values the form starts with — mid-range readings the model handles well.
const TYPICAL = { N: "100", P: "60", K: "91", temp: "27", rain: "1051", ph: "6.3", hum: "72" };

function ConfidenceRing({ pct, size = 104, stroke = 10, color = "#fff3b0", track = "rgba(0,0,0,.25)", label, textColor = "#fff" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="cr2-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none" }} role="img" aria-label={`${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle className="arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y={label ? "48%" : "50%"} textAnchor="middle" dominantBaseline="middle" fill={textColor} fontWeight="800" fontSize={size * 0.23}>{pct}%</text>
      {label && <text x="50%" y="68%" textAnchor="middle" fill={textColor} fontSize={size * 0.09} opacity=".85">{label}</text>}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CropRecommendation({ lang, setLang, setPage, weather, setWeather }) {
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [isMock,     setIsMock]     = useState(false);
  const [ranges,     setRanges]     = useState(FALLBACK_RANGES);
  const [touched,    setTouched]    = useState({});
  const [showGuide,  setShowGuide]  = useState(false);
  const [history,    setHistory]    = useState(() => loadHistory());
  const resRef = useRef(null);
  const navigate = useNavigate();
  const crTourT = CR_TOUR_T[lang] || CR_TOUR_T.en;
  const [tourOpen, setTourOpen] = useState(false);

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

  // Pull the accepted ranges from the server so the form cannot drift from what
  // the model will actually accept. Falls back to FALLBACK_RANGES if /meta fails.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/meta`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(m => { if (!cancelled && m?.numeric_ranges) setRanges(m.numeric_ranges); })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

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
    // Guarded: switching district twice in quick succession could otherwise let
    // the first (slower) response land last and fill the form with the wrong
    // district's weather.
    let cancelled = false;
    setWxLoading(true);
    const url = season
      ? `${API_BASE}/weather?district=${encodeURIComponent(district)}&season=${encodeURIComponent(season)}`
      : `${API_BASE}/weather?district=${encodeURIComponent(district)}`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (!cancelled) setWeather?.(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setWxLoading(false); });
    return () => { cancelled = true; };
  }, [district, season]);

  // Auto-fill climate fields from weather when district matches
  const [wxFilled,   setWxFilled]   = useState(false);
  const [wxClamped,  setWxClamped]  = useState([]);
  useEffect(() => {
    if (!weather || !district) { setWxFilled(false); setWxClamped([]); return; }
    if (weather.district !== district) { setWxFilled(false); setWxClamped([]); return; }
    const c = weather.current;

    // A live reading can sit outside the range the model was trained on — a hot
    // day in Kilinochchi, a humid morning in Matara. Blocking the form over a
    // number the app filled in itself would be baffling, so the value is pulled
    // to the nearest bound and the adjustment is named in the UI. Only ever
    // applied to machine-supplied readings, never to what the user typed.
    const clamped = [];
    const fit = (key, raw) => {
      const r = ranges[API_FIELD[key]];
      const n = Number(raw);
      if (!r || !Number.isFinite(n)) return raw;
      if (n < r.min) { clamped.push({ key, actual: n, used: r.min }); return r.min; }
      if (n > r.max) { clamped.push({ key, actual: n, used: r.max }); return r.max; }
      return raw;
    };

    // Use season-to-date averages from archive — matches what the model trained on.
    // Falls back to current live reading if archive values aren't available yet.
    setTemp(String(fit("temp",
      weather.season_avg_temp != null ? weather.season_avg_temp : c.temperature.toFixed(1)
    )));
    setHum(String(fit("hum",
      weather.season_avg_humidity != null ? weather.season_avg_humidity : c.humidity
    )));
    // Rainfall: use actual season-to-date accumulation from Open-Meteo archive.
    // Falls back to climatological seasonal lookup if archive not available.
    const actualMm = weather.season_actual_mm;
    const sr       = weather.seasonal_rainfall || {};
    const seasonKey = weather.season_name || season || "Year-round";
    const fallback  = sr[seasonKey] ?? sr["Year-round"] ?? null;
    const rainfallMm = (actualMm != null && actualMm > 0) ? actualMm : fallback;
    if (rainfallMm !== null) setRain(String(fit("rain", rainfallMm)));

    setWxClamped(clamped);
    setWxFilled(true);
  }, [district, weather, season, ranges]);

  const baseOk = district && agroZone && soilType && irrigation && season;

  // Range-check every numeric field against the server's bounds. The min/max
  // attributes on <input type="number"> are advisory only — nothing enforces
  // them, because submit is a button click rather than a form submit.
  const numValues = { N, P, K, temp, rain, ph, hum };
  const fieldErrors = {};
  for (const key of Object.keys(API_FIELD)) {
    const raw = numValues[key];
    const r = ranges[API_FIELD[key]];
    if (raw === "" || raw == null)            { fieldErrors[key] = t.errRequired; continue; }
    const n = Number(raw);
    if (!Number.isFinite(n))                  { fieldErrors[key] = t.errNotNumber; continue; }
    if (!r) continue;
    if (n < r.min || n > r.max) {
      fieldErrors[key] = `${t.errOutOfRange} ${fmtBound(r.min)}–${fmtBound(r.max)}`;
    }
  }
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

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
    setResult(null); setError(null); setIsMock(false); setTouched({});
    ["sa_district","sa_zone","sa_soil","sa_irr","sa_season",
     "sa_N","sa_P","sa_K","sa_temp","sa_rain","sa_ph","sa_hum"]
      .forEach(k => { try { ss?.removeItem(k); } catch {} });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Puts the nutrient and pH sliders back to the starting values. Climate fields
  // are left alone when live weather filled them, since those are real readings.
  const applyTypical = () => {
    setN(TYPICAL.N); setP(TYPICAL.P); setK(TYPICAL.K); setPh(TYPICAL.ph);
    if (!wxFilled) { setTemp(TYPICAL.temp); setRain(TYPICAL.rain); setHum(TYPICAL.hum); }
    setTouched({});
  };

  // FastAPI returns 422 as detail: [{loc, msg}, ...] and 4xx from HTTPException
  // as detail: "<string>". Flatten either into one readable sentence.
  const formatApiDetail = (detail, status) => {
    if (Array.isArray(detail)) {
      const parts = detail.map(d => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        const msg = String(d.msg || "").replace(/^Value error,\s*/, "");
        return field && !msg.startsWith(String(field)) ? `${field}: ${msg}` : msg;
      }).filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
    if (typeof detail === "string" && detail) return detail;
    return `Error ${status}`;
  };

  const submit = async () => {
    // Guard the button being enabled by anything other than a real click.
    if (!baseOk || hasFieldErrors) {
      setTouched(Object.fromEntries(Object.keys(API_FIELD).map(k => [k, true])));
      setError(t.errFixFields);
      return;
    }

    setLoading(true); setError(null); setResult(null); setIsMock(false);

    const body = { N: +N, P: +P, K: +K, Temperature: +temp, Rainfall: +rain, pH: +ph, Humidity: +hum,
          Soil_Type: soilType, Agro_Zone: agroZone, Irrigation: irrigation, Season: season };

    let res;
    try {
      res = await fetch(`${API_BASE}/predict/full`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // fetch() only rejects when the request never got an answer — a dead
      // server, DNS failure or CORS block. This is the ONLY case that means
      // "backend unreachable", and so the only one the demo fallback may serve.
      await new Promise(r => setTimeout(r, 1300));
      setResult(mockPredict(soilType, season, irrigation, { N, P, K, temp, rain, ph, hum }));
      setIsMock(true);
      setLoading(false);
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }

    // The server answered. Whatever it said, it is reachable — so a rejection
    // is reported as a rejection and never replaced with a fabricated result.
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(formatApiDetail(body.detail, res.status));
      setLoading(false);
      return;
    }

    try {
      const json = await res.json();
      setResult(json.data);
      if (!json.data?.low_confidence) celebrate();

      // Persist to history
      saveToHistory({
        crop:       json.data.recommended_crop,
        confidence: json.data.confidence,
        mode:   "full",
        zone:   agroZone,
        season,
        soil:   soilType,
      });
      setHistory(loadHistory());
    } catch {
      setError(`Error ${res.status}: malformed response from the server.`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const pct = result ? Math.round(result.confidence * 100) : 0;
  const maxScore = result?.xai_features?.length > 0 ? result.xai_features[0].score : 1;

  // min/max/step come from `ranges` (i.e. from /meta) so the form always shows
  // and enforces exactly what the server accepts.
  const numFields = [
    { key:"N",    val:N,    set:setN    },
    { key:"P",    val:P,    set:setP    },
    { key:"K",    val:K,    set:setK    },
    { key:"temp", val:temp, set:setTemp },
    { key:"rain", val:rain, set:setRain },
    { key:"ph",   val:ph,   set:setPh   },
    { key:"hum",  val:hum,  set:setHum  },
  ].map(f => {
    const r    = ranges[API_FIELD[f.key]] || FALLBACK_RANGES[API_FIELD[f.key]];
    const meta = NUM_FIELD_META[f.key];
    return {
      ...f,
      label: t[meta.labelKey], unit: meta.unit, ph: meta.placeholder,
      min: r.min, max: r.max, step: String(r.step ?? 1),
    };
  });

  const c2 = CR2_T[lang] || CR2_T.en;
  const stepDone = [Boolean(district && agroZone), Boolean(soilType && irrigation && season), !hasFieldErrors];
  const doneCount = stepDone.filter(Boolean).length;
  const stepBadge = ok => (
    <span className={`tu-tag tu-head__end ${ok ? "tu-tone-green" : "tu-tone-amber"}`}>
      {ok && <Check size={12} strokeWidth={3} />}{ok ? c2.done : c2.todo}
    </span>
  );
  const xaiLabel = f => (lang === "si" ? f.label_si : lang === "ta" ? f.label_ta : f.label) || f.label;
  const altColors = ["#fb923c", "#38bdf8"];

  return (
    <div className="tu-page tu-tone-green">
      <ToolSwitcher />

      <section className="tu-hero tu-rise">
        <span className="tu-eyebrow"><Sparkles size={14} />{c2.eyebrow}</span>
        <h1>{c2.h1a}<br /><span style={{ color: "#fff3b0" }}>{c2.h1b}</span></h1>
        <p>{c2.sub}</p>
        <div className="tu-chips">
          <div className="tu-chip"><b>11</b>{c2.chipParams}</div>
          <div className="tu-chip"><b>3</b>{c2.chipMatches}</div>
          <div className="tu-chip"><Check size={16} strokeWidth={3} />{c2.chipWhy}</div>
        </div>
      </section>

      {error && (
        <div className="cr2-alert tu-tone-red"><TriangleAlert size={18} /><span>{error}</span></div>
      )}
      {isMock && (
        <div className="cr2-alert tu-tone-amber"><Info size={18} /><span><b>{t.demoTitle}</b>{t.demoDesc}</span></div>
      )}
      {result?.warnings?.length > 0 && (
        <div className="cr2-alert tu-tone-amber">
          <TriangleAlert size={18} />
          <span>
            <b>{t.warningsTitle}</b>
            {result.warnings.map((w, i) => (
              <div key={i}>• {lang === "si" ? w.message_si : lang === "ta" ? w.message_ta : w.message_en}</div>
            ))}
          </span>
        </div>
      )}

      <div className="cr2-grid">
        {/* ── Inputs ── */}
        <div className="cr2-steps">
          <section className="tu-card cr2-step tu-tone-sky tu-rise">
            <div className="tu-head">
              <span className="cr2-num">1</span>
              <div><h2>{c2.s1}</h2><small>{c2.s1h}</small></div>
              {stepBadge(stepDone[0])}
            </div>
            <div className="cr2-row2">
              <div>
                <label className="tu-label">{t.district}</label>
                <CustomSelect name="district" value={district} onChange={e => setDistrict(e.target.value)} data-tour="cr-district-select">
                  <option value="">{t.selectDistrict}</option>
                  {Object.keys(DISTRICT_TO_ZONES).map(d => (
                    <option key={d} value={d}>{dl[d] || d}</option>
                  ))}
                </CustomSelect>
              </div>
              <div>
                <label className="tu-label">{t.agroZone}</label>
                {avZones.length === 1
                  ? <div className="cr2-auto"><MapPin size={16} />{zLabel(avZones[0])}</div>
                  : avZones.length > 1
                    ? <>
                        <CustomSelect name="agro_zone" value={agroZone} onChange={e => setAgroZone(e.target.value)}>
                          <option value="">{t.selectZone} {dl[district] || district}…</option>
                          {avZones.map(z => <option key={z} value={z}>{zLabel(z)}</option>)}
                        </CustomSelect>
                        <span className="cr2-hint">{dl[district] || district} {t.spansZones} {avZones.length} {t.zonesNote}</span>
                      </>
                    : <CustomSelect name="agro_zone" value="" onChange={() => {}} disabled>
                        <option value="">{t.selectDistrictFirst}</option>
                      </CustomSelect>
                }
              </div>
            </div>
          </section>

          <section className="tu-card cr2-step tu-tone-amber tu-rise">
            <div className="tu-head">
              <span className="cr2-num">2</span>
              <div><h2>{c2.s2}</h2><small>{c2.s2h}</small></div>
              {stepBadge(stepDone[1])}
            </div>

            <div className="cr2-soilhead">
              <label className="tu-label">{t.soilType} · {c2.quick}</label>
              <button className="cr2-guide" type="button" onClick={() => setShowGuide(true)}>{t.soilGuideBtn}</button>
            </div>
            <div className="tu-pills">
              {COMMON_SOILS.map(soil => (
                <button key={soil} type="button" className="tu-pill" aria-pressed={soilType === soil} onClick={() => setSoilType(soil)}>
                  {getSoilLabel(soil, lang)}
                </button>
              ))}
            </div>
            <div className="cr2-gap">
              <label className="tu-label">{c2.allSoils}</label>
              <CustomSelect name="soil_type" value={soilType} onChange={e => setSoilType(e.target.value)} data-tour="cr-soil-select">
                <option value="">{t.selectSoil}</option>
                {SOIL_TYPES.map(soil => <option key={soil} value={soil}>{getSoilLabel(soil, lang)}</option>)}
              </CustomSelect>
            </div>

            <div className="cr2-row2 cr2-gap">
              <div>
                <label className="tu-label">{t.irrigation}</label>
                <div className="tu-seg">
                  {["Rainfed", "Irrigated", "Supplemental"].map(i => (
                    <button key={i} type="button" aria-pressed={irrigation === i} onClick={() => setIrrigation(i)}>{il[i]}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="tu-label">{t.season}</label>
                <div className="tu-seg">
                  {["Maha", "Yala", "Year-round"].map(se => (
                    <button key={se} type="button" aria-pressed={season === se} onClick={() => setSeason(se)}>{sl[se]}</button>
                  ))}
                </div>
                {season && SEA_DESC[lang]?.[season] && <span className="cr2-hint">{SEA_DESC[lang][season]}</span>}
              </div>
            </div>
          </section>

          <section className="tu-card cr2-step tu-tone-green tu-rise">
            <div className="tu-head">
              <span className="cr2-num">3</span>
              <div><h2>{c2.s3}</h2><small>{c2.s3h}</small></div>
              <button className="cr2-typical tu-head__end" type="button" onClick={applyTypical}><Sparkles size={14} />{c2.typical}</button>
            </div>

            {wxFilled && (
              <div className="cr2-note tu-tone-sky">
                <CloudSun size={18} />
                <span>{t.wxAutoFillBadge} <strong>{dl[district] || district}</strong>. {t.wxAutoFillAdjust}</span>
              </div>
            )}
            {wxFilled && wxClamped.length > 0 && (
              <div className="cr2-note tu-tone-amber">
                <TriangleAlert size={18} />
                <span>
                  {t.wxClampedNote}
                  <ul>
                    {wxClamped.map(({ key, actual, used }) => {
                      const f = NUM_FIELD_META[key];
                      return <li key={key}><strong>{t[f.labelKey]}</strong>: {actual}{f.unit} → {used}{f.unit}</li>;
                    })}
                  </ul>
                </span>
              </div>
            )}
            {!wxFilled && district && (
              <div className="cr2-note tu-tone-sky">
                <CloudSun size={18} />
                <span>
                  {wxLoading
                    ? <>{t.wxFetchingHint || "Fetching live weather for"} <strong>{dl[district] || district}</strong>…</>
                    : (t.wxSelectDistrictHint || "Select your district to auto-fill live weather data.")}
                </span>
              </div>
            )}

            <div data-tour="cr-nutrient-fields">
              {numFields.map(({ key, label, val, set, unit, ph: ph_, min, max, step }) => {
                // An invalid value outranks the post-result suitability tint:
                // the field is wrong, not merely outside the crop's ideal band.
                const invalid = touched[key] && fieldErrors[key];
                const sv = ci ? suit[key] : null;
                const sc = invalid ? "err" : (ci ? sClass(sv) : "");
                const look = FIELD_LOOK[key];
                // The slider can only sit inside the range; an out-of-range typed
                // value still shows in the box, where it is flagged.
                const n = Number(val);
                const pos = Number.isFinite(n) && val !== "" ? Math.min(max, Math.max(min, n)) : min;
                return (
                  <div className="cr2-field" key={key} style={{ "--k": look.color }}>
                    <div className="cr2-fname"><span className="cr2-fic">{look.tag}</span>{label}</div>
                    <div className="cr2-track">
                      <input className="tu-range" type="range" min={min} max={max} step={step || "1"} value={pos}
                        style={{ "--p": `${((pos - min) / (max - min)) * 100}%` }}
                        onChange={e => set(e.target.value)} aria-label={label} tabIndex={-1} />
                      <div className="cr2-ends"><span>{fmtBound(min)}</span><span>{fmtBound(max)}</span></div>
                    </div>
                    <div className="cr2-box">
                      <input className={sc} type="number" step={step || "1"} placeholder={ph_} value={val} min={min} max={max}
                        onChange={e => set(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, [key]: true }))}
                        aria-label={label} aria-invalid={invalid ? "true" : undefined} />
                      <span>{unit}</span>
                    </div>
                    {invalid
                      ? <div className="cr2-fmsg err">{fieldErrors[key]} {unit}</div>
                      : <>
                          {sv === "below" && <div className="cr2-fmsg warn">▼ {t.belowRange}</div>}
                          {sv === "above" && <div className="cr2-fmsg err">▲ {t.aboveRange}</div>}
                        </>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stays clickable while only the numeric fields are wrong, so the
              click can reveal which ones rather than leaving a dead button. */}
          <div>
            <button className="tu-cta" onClick={submit} disabled={!baseOk || loading} data-tour="cr-predict-btn">
              {loading ? <><span className="cr2-spin" />{t.btnAnalyse}</> : <><Sparkles size={20} />{c2.cta}</>}
            </button>
            {result && <button className="cr2-reset" onClick={resetForm}>{t.btnReset}</button>}
          </div>

          <div className="cr2-history">
            <HistoryPanel history={history} onClear={() => { clearHistory(); setHistory([]); }} lang={lang} t={t} />
          </div>
        </div>

        {/* ── Result ── */}
        <aside className="cr2-res" ref={resRef} data-tour="cr-result-card">
          {!result && (
            <div className="tu-card cr2-empty tu-rise">
              <div className="cr2-empty__ic"><Sprout size={38} /></div>
              <h3>{c2.emptyT}</h3>
              <p>{c2.emptyB}</p>
              <ul>
                {[c2.e1, c2.e2, c2.e3, c2.e4].map(line => (
                  <li key={line}><Check size={16} strokeWidth={3} />{line}</li>
                ))}
              </ul>
              <div className="cr2-prog">
                <small>{doneCount} / 3 {c2.progress}</small>
                <div className="tu-bar"><i style={{ width: `${(doneCount / 3) * 100}%`, background: "var(--tu-g-green)" }} /></div>
              </div>
            </div>
          )}

          {!result && (
            <div className="tu-card tu-rise tu-tone-amber">
              <div className="tu-head">
                <span className="tu-ic tu-ic--sm"><Info size={18} /></span>
                <div><h3>{c2.tipsT}</h3><small>{c2.tipsS}</small></div>
              </div>
              <div className="cr2-tips">
                {[c2.tip1, c2.tip2, c2.tip3].map((tip, i) => (
                  <div className="cr2-tip" key={i}><i>{i + 1}</i><span>{tip}</span></div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="cr2-best tu-rise">
                <div className="cr2-best__top">
                  <ConfidenceRing pct={pct} label={c2.match} />
                  <div style={{ minWidth: 0 }}>
                    <span className="cr2-badge">{c2.best}</span>
                    <h2><span aria-hidden="true">{CROP_EMOJI[result.recommended_crop] || "🌿"}</span>{getCropLabel(result.recommended_crop, lang)}</h2>
                    <div style={{ opacity: .92, fontSize: 13 }}>{pct}% {t.confidence}</div>
                  </div>
                  <button className="cr2-print" onClick={() => window.print()} title={t.btnPrint}><Printer size={14} />{c2.print}</button>
                </div>
                {result.low_confidence && <div className="cr2-low"><TriangleAlert size={16} />{t.lowConfWarn}</div>}
                {result.explanations?.length > 0 && (
                  <div className="cr2-facts">{result.explanations.map((e, i) => <span key={i}>{e}</span>)}</div>
                )}
              </div>

              {result.top_3?.length > 1 && (
                <div className="cr2-alts">
                  {result.top_3.slice(1, 3).map((c, i) => (
                    <div className="cr2-alt tu-rise" key={c.crop}>
                      <ConfidenceRing pct={Math.round(c.confidence * 100)} size={54} stroke={6} color={altColors[i]}
                        track="var(--tu-card2)" textColor="var(--tu-text)" />
                      <div style={{ minWidth: 0 }}>
                        <small>{i === 0 ? c2.second : c2.third}</small>
                        <b>{CROP_EMOJI[c.crop] || "🌿"} {getCropLabel(c.crop, lang)}</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="tu-card tu-rise" data-tour="cr-xai-card">
                {result.xai_features?.length > 0 && (
                  <>
                    <div className="tu-head">
                      <span className="tu-ic tu-ic--sm tu-tone-violet"><Sparkles size={18} /></span>
                      <div><h3>{t.xaiTitle}</h3><small>{result.xai_is_global ? t.xaiSubtitleGlobal : t.xaiSubtitle}</small></div>
                    </div>
                    {result.xai_summary && (
                      <div className="cr2-summary">
                        {lang === "si" ? result.xai_summary.si : lang === "ta" ? result.xai_summary.ta : result.xai_summary.en}
                      </div>
                    )}
                    {result.xai_features.map((f, i) => {
                      const negative = f.direction === "negative";
                      return (
                        <div className="cr2-factor" key={i}>
                          <span>{xaiLabel(f)}</span>
                          <div className="tu-bar">
                            <i style={{
                              width: `${Math.max(6, (f.score / maxScore) * 100)}%`,
                              background: negative ? "var(--tu-g-red)" : f.direction === "neutral" ? "var(--tu-dim)" : "var(--tu-g-green)",
                            }} />
                          </div>
                          <b style={{ color: negative ? "var(--tu-coral)" : "var(--tu-green)" }}>{negative ? "−" : "+"}{Math.round(f.score * 100)}</b>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="cr2-acts">
                  <button className="tu-linkbtn tu-tone-teal" onClick={() => navigate(`/crop-guidance?crop=${encodeURIComponent(result.recommended_crop)}`)}><BookOpen size={16} />{c2.guide}</button>
                  <button className="tu-linkbtn tu-tone-amber" onClick={() => navigate("/yield-price")}><ChartLine size={16} />{c2.yield}</button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── Detail cards (existing components) ── */}
      {result && (
        <section>
          <div className="tu-head">
            <span className="tu-ic tu-ic--sm"><ArrowRight size={18} /></span>
            <div><h2>{c2.details}</h2><small>{c2.detailsSub}</small></div>
          </div>
          <div className="cr2-details">
            {result.xai_features?.length > 0 && (
              <div className="xai-card cr2-wide">
                <div className="xai-inner">
                  <div className="xai-body">
                    <div className="xai-grid">
                      {result.xai_features.map((f, i) => (
                        <XAIFeatureCard key={i} feat={f} maxScore={maxScore} lang={lang} t={t} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.planting_calendar && (
              <CalendarCard cal={result.planting_calendar} season={season} lang={lang} t={t} />
            )}

            {result.top_3 && <CompareCard top3={result.top_3} lang={lang} t={t} />}

            {result.crop_info && (
              <div className="ci-card cr2-wide" data-tour="cr-crop-info-card">
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
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Soil identification guide modal ─────────────────────────────── */}
      {showGuide && <SoilGuideModal lang={lang} t={t} onClose={() => setShowGuide(false)} />}

      <HelpButton label={crTourT.needHelp} ariaLabel={crTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={crTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: crTourT.next, back: crTourT.back, skip: crTourT.skip, done: crTourT.done }}
      />
    </div>
  );
}
