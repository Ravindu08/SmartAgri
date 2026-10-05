import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { BookOpen, CalendarDays, Check, CloudRain, Droplets, Info, MapPin, ShieldAlert, Sparkles, Thermometer, TriangleAlert, Wind } from "lucide-react";
import { ML_BASE_URL } from "../services/api";
import { DISTRICTS } from "../data/districtZones";
import { DISTRICT_LABELS, SEA_LABELS } from "../data/translations";
import ToolSwitcher from "../components/ToolSwitcher";
import ToolIntro from "../components/ToolIntro";
import "../styles/tool-wx.css";
import SpotlightTour   from "../components/tour/SpotlightTour";
import HelpButton      from "../components/tour/HelpButton";

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

const WX_TOUR_T = {
  en: {
    steps: [
      { target: 'wx-district-select', title: 'Pick your district', body: 'Choose a district and fetch live weather — you’ll get current conditions, farming advisory and a 7-day forecast.' },
      { target: 'wx-empty-zones', title: 'Sri Lanka’s climate zones', body: 'Not sure which zone you’re in? This reference shows the Wet, Dry and Intermediate zones and their typical districts.' },
      { target: 'wx-current', title: 'Current conditions', body: 'Live temperature, humidity, wind and rainfall for your district, updated in real time.' },
      { target: 'wx-advice', title: 'Farming advice', body: "Alerts and tips generated from today's weather — like when to delay spraying or watch for heat stress." },
      { target: 'wx-forecast', title: '7-day forecast', body: 'Plan ahead with daily highs, lows, and expected rainfall for the week.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'wx-district-select', title: 'ඔබේ දිස්ත්‍රික්කය තෝරන්න', body: 'දිස්ත්‍රික්කයක් තෝරා සජීවී කාලගුණය ලබාගන්න — වත්මන් තත්ත්වයන්, ගොවිතැන් උපදෙස් සහ දින 7ක අනාවැකියක් ලැබෙනු ඇත.' },
      { target: 'wx-empty-zones', title: 'ශ්‍රී ලංකාවේ දේශගුණ කලාප', body: 'ඔබ සිටින කලාපය කුමක්දැයි විශ්වාස නැද්ද? මෙම යොමුව තෙත්, වියළි සහ අතරමැදි කලාප සහ ඒවායේ සාමාන්‍ය දිස්ත්‍රික්ක පෙන්වයි.' },
      { target: 'wx-current', title: 'වත්මන් තත්ත්වයන්', body: 'ඔබේ දිස්ත්‍රික්කය සඳහා සජීවී උෂ්ණත්වය, ආර්ද්‍රතාවය, සුළඟ සහ වර්ෂාපතනය තථ්‍ය කාලීනව යාවත්කාලීන වේ.' },
      { target: 'wx-advice', title: 'ගොවිතැන් උපදෙස්', body: 'අද කාලගුණයෙන් ජනනය කරන ලද ඇඟවීම් සහ ඉඟි — ඉසීම ප්‍රමාද කළ යුතු වේලාව හෝ තාප පීඩනය ගැන අවධානය වැනි.' },
      { target: 'wx-forecast', title: 'දින 7ක අනාවැකිය', body: 'සතිය සඳහා දෛනික ඉහළ, පහළ උෂ්ණත්වයන් සහ අපේක්ෂිත වර්ෂාපතනය සමඟ කලින් සැලසුම් කරන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'wx-district-select', title: 'உங்கள் மாவட்டத்தைத் தேர்வு செய்யுங்கள்', body: 'ஒரு மாவட்டத்தைத் தேர்ந்தெடுத்து நேரடி வானிலையைப் பெறுங்கள் — தற்போதைய நிலைமைகள், விவசாய ஆலோசனை மற்றும் 7 நாள் முன்னறிவிப்பு கிடைக்கும்.' },
      { target: 'wx-empty-zones', title: 'இலங்கையின் காலநிலை மண்டலங்கள்', body: 'நீங்கள் எந்த மண்டலத்தில் இருக்கிறீர்கள் என்று உறுதியாக தெரியவில்லையா? இந்த குறிப்பு ஈரப்பதம், வறண்ட மற்றும் இடைநிலை மண்டலங்களையும் அவற்றின் வழக்கமான மாவட்டங்களையும் காட்டுகிறது.' },
      { target: 'wx-current', title: 'தற்போதைய நிலைமைகள்', body: 'உங்கள் மாவட்டத்திற்கான நேரடி வெப்பநிலை, ஈரப்பதம், காற்று மற்றும் மழைப்பொழிவு நிகழ்நேரத்தில் புதுப்பிக்கப்படும்.' },
      { target: 'wx-advice', title: 'விவசாய ஆலோசனை', body: 'இன்றைய வானிலையிலிருந்து உருவாக்கப்பட்ட எச்சரிக்கைகள் மற்றும் குறிப்புகள் — தெளிப்பதை தாமதப்படுத்த வேண்டிய நேரம் அல்லது வெப்ப அழுத்தத்தை கவனிக்க வேண்டியது போன்றவை.' },
      { target: 'wx-forecast', title: '7 நாள் முன்னறிவிப்பு', body: 'வாரத்திற்கான தினசரி அதிகபட்ச, குறைந்தபட்ச வெப்பநிலை மற்றும் எதிர்பார்க்கப்படும் மழையுடன் முன்கூட்டியே திட்டமிடுங்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

// Text for the redesigned layout; the rest still comes from WT above.
const WX2 = {
  en: {
    pickTitle: "Choose your district", pickSub: "Tap a district to load its live weather",
    live: "Live", today: "Today", rainToday: "Rain today", rainTomorrow: "Rain tomorrow",
    points: ["Live conditions", "7-day forecast", "Farm advice", "Season rainfall"],
    daysSub: "Tap a day for its details · bars show rainfall",
    rainChance: "Rain chance", high: "High", low: "Low",
    adviceSub: "Most urgent first",
    tags: { danger: "Urgent", warning: "Warning", risk: "Risk", action: "Do this", info: "Good to know" },
    seasonTitle: "season so far", seasonSub: "Compared with a normal season in",
    rainSoFar: "Rain so far", normalTotal: "Normal total", ofNormal: "Of normal rain",
    avgTemp: "Average temp", avgHum: "Avg humidity",
    refTitle: "Know your zone and season", refSub: "Your district's zone and the current season are highlighted",
    yourZone: "Your zone", zone: "Zone", now: "Now",
  },
  si: {
    pickTitle: "ඔබේ දිස්ත්‍රික්කය තෝරන්න", pickSub: "සජීවී කාලගුණය බැලීමට දිස්ත්‍රික්කයක් තට්ටු කරන්න",
    live: "සජීවී", today: "අද", rainToday: "අද වර්ෂාව", rainTomorrow: "හෙට වර්ෂාව",
    points: ["සජීවී තත්ත්ව", "දින 7 අනාවැකිය", "ගොවි උපදෙස්", "කන්නයේ වර්ෂාපතනය"],
    daysSub: "විස්තර සඳහා දිනයක් තට්ටු කරන්න · තීරු වර්ෂාපතනය පෙන්වයි",
    rainChance: "වැසි සම්භාවිතාව", high: "උපරිම", low: "අවම",
    adviceSub: "හදිසිම දේ පළමුව",
    tags: { danger: "හදිසි", warning: "අවවාදයයි", risk: "අවදානම", action: "මෙය කරන්න", info: "දැනගන්න" },
    seasonTitle: "කන්නය මේ දක්වා", seasonSub: "සාමාන්‍ය කන්නයක් සමඟ සසඳා —",
    rainSoFar: "මේ දක්වා වර්ෂාව", normalTotal: "සාමාන්‍ය මුළු අගය", ofNormal: "සාමාන්‍ය වර්ෂාවෙන්",
    avgTemp: "සාමාන්‍ය උෂ්ණත්වය", avgHum: "සාමාන්‍ය ආර්ද්‍රතාව",
    refTitle: "ඔබේ කලාපය සහ කන්නය දැනගන්න", refSub: "ඔබේ දිස්ත්‍රික්කයේ කලාපය සහ වත්මන් කන්නය උද්දීපනය කර ඇත",
    yourZone: "ඔබේ කලාපය", zone: "කලාපය", now: "දැන්",
  },
  ta: {
    pickTitle: "உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்", pickSub: "நேரடி வானிலையைக் காண ஒரு மாவட்டத்தைத் தட்டவும்",
    live: "நேரடி", today: "இன்று", rainToday: "இன்றைய மழை", rainTomorrow: "நாளைய மழை",
    points: ["நேரடி நிலைமைகள்", "7 நாள் முன்னறிவிப்பு", "பண்ணை ஆலோசனை", "பருவ மழைவீழ்ச்சி"],
    daysSub: "விவரங்களுக்கு ஒரு நாளைத் தட்டவும் · பட்டைகள் மழையைக் காட்டுகின்றன",
    rainChance: "மழை வாய்ப்பு", high: "அதிகபட்சம்", low: "குறைந்தபட்சம்",
    adviceSub: "மிக அவசரமானது முதலில்",
    tags: { danger: "அவசரம்", warning: "எச்சரிக்கை", risk: "அபாயம்", action: "இதைச் செய்யுங்கள்", info: "தெரிந்துகொள்ளுங்கள்" },
    seasonTitle: "பருவம் இதுவரை", seasonSub: "சாதாரண பருவத்துடன் ஒப்பீடு —",
    rainSoFar: "இதுவரை மழை", normalTotal: "சாதாரண மொத்தம்", ofNormal: "சாதாரண மழையில்",
    avgTemp: "சராசரி வெப்பநிலை", avgHum: "சராசரி ஈரப்பதம்",
    refTitle: "உங்கள் மண்டலத்தையும் பருவத்தையும் அறியுங்கள்", refSub: "உங்கள் மாவட்டத்தின் மண்டலமும் தற்போதைய பருவமும் சிறப்பித்துக் காட்டப்படுகின்றன",
    yourZone: "உங்கள் மண்டலம்", zone: "மண்டலம்", now: "இப்போது",
  },
};

// A district's broad climate zone. Listed by hand because a district's
// agro-ecological zones (districtZones.js) often span more than one of these;
// this is the zone most of the district falls in, matching the cards below.
const WET = ["Colombo", "Gampaha", "Kalutara", "Galle", "Matara", "Ratnapura", "Kegalle", "Kandy", "Nuwara Eliya"];
const INTERMEDIATE = ["Kurunegala", "Matale", "Badulla", "Monaragala"];
const zoneGroup = d => (WET.includes(d) ? "wet" : INTERMEDIATE.includes(d) ? "inter" : "dry");
const GROUPS = [
  { key: "wet",   dot: "#38bdf8", nameKey: "zone1Name" },
  { key: "dry",   dot: "#f59e0b", nameKey: "zone2Name" },
  { key: "inter", dot: "#22c55e", nameKey: "zone3Name" },
];

// How each kind of advice is shown, and the order it is listed in.
const ADVICE_LOOK = {
  danger:  { tone: "red",    Icon: TriangleAlert, rank: 0 },
  warning: { tone: "amber",  Icon: ShieldAlert,   rank: 1 },
  risk:    { tone: "violet", Icon: ShieldAlert,   rank: 2 },
  action:  { tone: "green",  Icon: Check,         rank: 3 },
  info:    { tone: "sky",    Icon: Info,          rank: 4 },
};

// WMO weather code -> the colour mood of the "now" card.
const skyMood = code => (code >= 95 ? "storm" : code >= 51 ? "rain" : code >= 2 ? "cloud" : "clear");

const LOCALE = { en: "en-GB", si: "si-LK", ta: "ta-LK" };
const num = (v, d = 0) => (v == null ? "–" : Number(v).toFixed(d));

const API_BASE = ML_BASE_URL;

export default function Weather({ lang, onWeatherFetched }) {
  const t = WT[lang] || WT.en;
  const x = WX2[lang] || WX2.en;
  const dl = DISTRICT_LABELS[lang] || {};
  const wxTourT = WX_TOUR_T[lang] || WX_TOUR_T.en;
  const [tourOpen, setTourOpen] = useState(false);
  const [district, setDistrict] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);

  const fetchWeather = async (d) => {
    if (!d) return;
    setLoading(true);
    setError(null);
    setData(null);
    setDayIndex(0);
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

  const pick = (d) => {
    setDistrict(d);
    fetchWeather(d);
  };

  // /wx?district=Kandy opens with that district loaded, so other tools can link
  // straight to a district's weather.
  const [params] = useSearchParams();
  useEffect(() => {
    const d = params.get("district");
    if (d && DISTRICTS.includes(d)) pick(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locale = LOCALE[lang] || LOCALE.en;
  const dayName = (iso, i) => (i === 0 ? x.today : new Date(iso).toLocaleDateString(locale, { weekday: "short" }));
  const forecast = data?.forecast || [];
  const maxRain = Math.max(1, ...forecast.map(d => d.rain_mm || 0));
  const day = forecast[dayIndex];
  const tomorrow = forecast[1];
  const advice = [...(data?.advice || [])].sort(
    (a, b) => (ADVICE_LOOK[a.type]?.rank ?? 9) - (ADVICE_LOOK[b.type]?.rank ?? 9));

  const seasonKey = data?.season_name;
  const normal = data?.seasonal_rainfall?.[seasonKey];
  const soFar = data?.season_actual_mm;
  const pctOfNormal = normal && soFar != null ? Math.round((soFar / normal) * 100) : null;
  const myGroup = district ? zoneGroup(district) : null;

  const ZONES = [
    { key: "wet",   dot: "#38bdf8", name: t.zone1Name, desc: t.zone1Desc, list: t.zone1Districts },
    { key: "dry",   dot: "#f59e0b", name: t.zone2Name, desc: t.zone2Desc, list: t.zone2Districts },
    { key: "inter", dot: "#22c55e", name: t.zone3Name, desc: t.zone3Desc, list: t.zone3Districts },
  ];
  const SEASONS = [
    { key: "Maha",       dot: "var(--tu-sky)", name: t.sea1Name, months: t.sea1Months, desc: t.sea1Desc },
    { key: "Yala",       dot: "var(--tu-sky)", name: t.sea2Name, months: t.sea2Months, desc: t.sea2Desc },
    { key: "Year-round", dot: "var(--tu-sky)", name: t.sea3Name, months: t.sea3Months, desc: t.sea3Desc },
  ];

  return (
    <div className="tu-page tu-tone-sky">
      <ToolSwitcher />
      <ToolIntro tool="wx" />

      <div className={data ? "wx2-top" : "wx2-top wx2-top--solo"}>
        {/* ── Now, or the intro before a district is picked ── */}
        {data ? (
          <section className={`wx2-now wx2-now--${skyMood(data.current.weather_code)} tu-rise`} data-tour="wx-current">
            <div>
              <span className="tu-eyebrow"><MapPin size={14} />{dl[data.district] || data.district} · {x.live}</span>
              <div className="wx2-temp">
                <b>{num(data.current.temperature)}°</b>
                <span className="wx2-glyph" aria-hidden="true">{data.current.condition_icon}</span>
                <span>{data.current.condition}
                  <small>{new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</small>
                </span>
              </div>
            </div>
            <div className="wx2-stats">
              <div><small><Droplets size={14} />{t.humidity}</small><b>{num(data.current.humidity)}%</b></div>
              <div><small><Wind size={14} />{t.wind}</small><b>{num(data.current.wind_kph, 1)} km/h</b></div>
              <div><small><CloudRain size={14} />{x.rainToday}</small><b>{num(data.current.rainfall_mm, 1)} mm</b></div>
              <div><small><TriangleAlert size={14} />{x.rainTomorrow}</small><b>{tomorrow ? `${Math.round(tomorrow.precip_prob || 0)}%` : "–"}</b></div>
            </div>
          </section>
        ) : null}

        {/* ── District picker ── */}
        <section className="tu-card wx2-pick tu-rise" data-tour="wx-district-select">
          <div className="tu-head" style={{ marginBottom: 2 }}>
            <span className="tu-ic tu-ic--sm"><MapPin size={18} /></span>
            <div><h2>{x.pickTitle}</h2><small>{x.pickSub}</small></div>
          </div>
          {GROUPS.map(g => (
            <div className="wx2-group" key={g.key} style={{ "--dot": g.dot }}>
              <span className="tu-label"><i />{t[g.nameKey]}</span>
              <div className="tu-pills">
                {DISTRICTS.filter(d => zoneGroup(d) === g.key).map(d => (
                  <button key={d} type="button" className="tu-pill" aria-pressed={district === d} disabled={loading} onClick={() => pick(d)}>
                    {dl[d] || d}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      {loading && (
        <div className="tu-card tu-sec wx2-state"><span className="wx2-spin" />{t.loading}</div>
      )}

      {error && (
        <div className="tu-card tu-sec wx2-state tu-tone-red">
          <TriangleAlert size={22} color="var(--tu-red)" />
          <span><b style={{ color: "var(--tu-text)" }}>{t.errorTitle}</b><br />{error}</span>
          <button className="wx2-retry" onClick={() => fetchWeather(district)}>{t.retry}</button>
        </div>
      )}

      {data && (
        <>
          {/* ── 7 days ── */}
          <section className="tu-sec tu-rise" data-tour="wx-forecast">
            <div className="tu-head">
              <span className="tu-ic tu-ic--sm"><CalendarDays size={18} /></span>
              <div><h2>{t.forecast}</h2><small>{x.daysSub}</small></div>
            </div>
            <div className="wx2-days">
              {forecast.map((d, i) => (
                <button key={d.date} type="button" className="wx2-day" aria-pressed={dayIndex === i} onClick={() => setDayIndex(i)}>
                  <small>{dayName(d.date, i)}</small>
                  <span className="wx2-day__ic" aria-hidden="true">{d.icon}</span>
                  <b>{num(d.max_temp)}°</b>
                  <div className="wx2-rng"><span>{num(d.min_temp)}°</span><i /><span>{num(d.max_temp)}°</span></div>
                  <div className="wx2-rain"><i style={{ height: `${Math.round(((d.rain_mm || 0) / maxRain) * 100)}%` }} /></div>
                  <em>{num(d.rain_mm, 1)} mm · {Math.round(d.precip_prob || 0)}%</em>
                </button>
              ))}
            </div>
            {day && (
              <div className="wx2-detail">
                <div className="tu-tile"><small>{t.condition}</small><b>{day.condition}</b></div>
                <div className="tu-tile"><small>{x.high}</small><b>{num(day.max_temp, 1)}°C</b></div>
                <div className="tu-tile"><small>{x.low}</small><b>{num(day.min_temp, 1)}°C</b></div>
                <div className="tu-tile"><small>{t.rainfall}</small><b>{num(day.rain_mm, 1)} mm</b></div>
                <div className="tu-tile"><small>{x.rainChance}</small><b>{Math.round(day.precip_prob || 0)}%</b></div>
                <div className="tu-tile"><small>{t.humidity}</small><b>{num(day.humidity)}%</b></div>
              </div>
            )}
          </section>

          <div className="wx2-two tu-sec">
            {/* ── Advice ── */}
            <section className="tu-card tu-rise" data-tour="wx-advice">
              <div className="tu-head">
                <span className="tu-ic tu-ic--sm"><Sparkles size={18} /></span>
                <div><h2>{t.advice}</h2><small>{x.adviceSub}</small></div>
              </div>
              {advice.map((item, i) => {
                const look = ADVICE_LOOK[item.type] || ADVICE_LOOK.info;
                return (
                  <div className={`wx2-adv tu-tone-${look.tone}`} key={i}>
                    <span className="tu-ic"><look.Icon size={20} /></span>
                    <div><b>{item.title}</b><p>{item.detail}</p></div>
                    <span className="tu-tag">{x.tags[item.type] || x.tags.info}</span>
                  </div>
                );
              })}
            </section>

            {/* ── Season so far ── */}
            <section className="tu-card tu-rise">
              <div className="tu-head">
                <span className="tu-ic tu-ic--sm"><Thermometer size={18} /></span>
                <div>
                  <h2>{SEA_LABELS[lang]?.[seasonKey] || seasonKey} · {x.seasonTitle}</h2>
                  <small>{x.seasonSub} {dl[data.district] || data.district}</small>
                </div>
              </div>
              <div className="wx2-cmp">
                <span>{x.rainSoFar}</span>
                <div className="tu-bar"><i style={{ width: `${Math.min(100, pctOfNormal ?? 0)}%`, background: "linear-gradient(90deg,#2563eb,#67e8f9)" }} /></div>
                <b>{num(soFar)} mm</b>
              </div>
              <div className="wx2-cmp">
                <span>{x.normalTotal}</span>
                <div className="tu-bar"><i style={{ width: "100%", background: "var(--tu-dim)" }} /></div>
                <b>{normal != null ? `${normal} mm` : "–"}</b>
              </div>
              <div className="wx2-tiles">
                <div className="tu-tile"><small>{x.ofNormal}</small><b>{pctOfNormal != null ? `${pctOfNormal}%` : "–"}</b></div>
                <div className="tu-tile"><small>{x.avgTemp}</small><b>{num(data.season_avg_temp, 1)}°</b></div>
                <div className="tu-tile"><small>{x.avgHum}</small><b>{num(data.season_avg_humidity)}%</b></div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* ── Zones and seasons: always shown, highlighted once there is data ── */}
      <section className="tu-sec" data-tour="wx-empty-zones">
        <div className="tu-head">
          <span className="tu-ic tu-ic--sm"><BookOpen size={18} /></span>
          <div><h2>{x.refTitle}</h2><small>{x.refSub}</small></div>
        </div>
        <div className="wx2-refs">
          {ZONES.map(z => (
            <div key={z.key} className={`wx2-ref${myGroup === z.key ? " wx2-ref--on" : ""}`} style={{ "--dot": z.dot }}>
              <span>{myGroup === z.key ? x.yourZone : x.zone}</span>
              <h3>{z.name}</h3><p>{z.desc}</p><small>{z.list}</small>
            </div>
          ))}
          {SEASONS.map(se => (
            <div key={se.key} className={`wx2-ref${seasonKey === se.key ? " wx2-ref--on" : ""}`} style={{ "--dot": se.dot }}>
              <span>{seasonKey === se.key ? `${x.now} · ${se.months}` : se.months}</span>
              <h3>{se.name}</h3><p>{se.desc}</p>
            </div>
          ))}
        </div>
        {data && (
          <p className="wx2-source">{t.source}: <a href="https://open-meteo.com" target="_blank" rel="noreferrer">{data.source}</a></p>
        )}
      </section>

      <HelpButton label={wxTourT.needHelp} ariaLabel={wxTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={wxTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: wxTourT.next, back: wxTourT.back, skip: wxTourT.skip, done: wxTourT.done }}
      />
    </div>
  );
}
