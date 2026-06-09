import "../styles/About.css";

const ABOUT_T = {
  en: {
    heroBadge:      "About This Project",
    heroTitle:      "About SmartAgri",
    heroSub:        "A smart agriculture decision support system designed to help Sri Lankan farmers and land owners make better crop planning decisions.",
    problemTitle:   "The Problem",
    problemText:    "Many farmers and land owners face difficulty choosing the most suitable crop for their land. They may not know the correct planting season, soil requirements, fertilizer needs, expected yield, production cost, or selling price. Without reliable information, farming decisions can lead to poor harvests and financial loss.",
    solutionTitle:  "Our Solution",
    solutionText:   "SmartAgri supports users with AI-powered crop recommendation, explainable results, step-by-step crop guidance, yield and price estimation, and weather-based farming advice — all tailored for Sri Lankan agro-ecological conditions.",
    modulesTitle:   "System Modules",
    modulesSub:     "Four active tools covering the full crop planning journey",
    teamTitle:      "Project Team",
    teamSub:        "Developed as an academic project for Sri Lankan agriculture",
    techTitle:      "Technology",
    techSub:        "Built with modern, accessible tools",
    comingSoon:     "Coming Soon",
    missionLabel:   "MISSION & VISION",
    missionTitle:   "What drives us",
    missionSub:     "We believe every Sri Lankan farmer deserves access to the best agricultural intelligence.",
    missionCardTitle: "Our Mission",
    missionCardText:  "Empower Sri Lankan farmers and land owners with AI-driven insights to make better crop decisions, reduce losses, and improve livelihoods — for free.",
    visionCardTitle: "Our Vision",
    visionCardText:  "A future where every farmer has the same quality of agricultural intelligence, regardless of where they are or what resources they have.",
    impactLabel:    "IMPACT",
    impactTitle:    "Designed for real-world results",
    impactNums: [
      { num: "4",    suffix: "",  label: "AI-Powered Tools" },
      { num: "5",    suffix: "+", label: "Crop Guidance Modules" },
      { num: "25",   suffix: "+", label: "Sri Lankan Districts" },
      { num: "100",  suffix: "%", label: "Open Source" },
    ],
    contactTitle:   "Contact Us",
    contactSub:     "Have questions or feedback? Reach out to the SmartAgri team.",
    contactEmail:   "Email",
    contactProject: "Project",
    contactProjectVal: "Academic Final Year Project — University of Sri Lanka",
    contactNote:    "SmartAgri is an open-source academic project. Contributions and feedback are welcome.",
  },
  si: {
    heroBadge:      "ව්‍යාපෘතිය ගැන",
    heroTitle:      "SmartAgri ගැන",
    heroSub:        "ශ්‍රී ලාංකික ගොවීන් සහ ඉඩම් හිමියන්ට වඩා හොඳ බෝග සැලසුම් තීරණ ගැනීමට සහාය වීමට නිර්මාණය කරන ලද ස්මාර්ට් කෘෂිකාර්මික තීරණ සහාය පද්ධතිය.",
    problemTitle:   "ගැටළුව",
    problemText:    "බොහෝ ගොවීන් සහ ඉඩම් හිමියන් ඔවුන්ගේ ඉඩමට වඩාත් සුදුසු බෝගය තෝරා ගැනීමේ දුෂ්කරතාවන්ට මුහුණ දෙති. නිවැරදි රෝපණ කාලය, පාංශු අවශ්‍යතා, පොහොර අවශ්‍යතා, අපේක්ෂිත අස්වැන්න, නිෂ්පාදන පිරිවැය හෝ විකිණීමේ මිල ගැන ඔවුන්ට නොදැනෙනු ඇත.",
    solutionTitle:  "අපගේ විසඳුම",
    solutionText:   "SmartAgri, AI-පදනම් බෝග නිර්දේශය, පැහැදිලි ප්‍රතිඵල, ක්‍රමානුකූල බෝග මාර්ගෝපදේශය, අස්වැන්න සහ මිල ගණනය, සහ කාලගුණ-පදනම් ගොවිතැන් උපදෙස් සමඟ ශ්‍රී ලාංකික කෘෂිකාර්මික-පාරිසරික තත්ත්ව සඳහා සකස් කරන ලද සහාය ලබා දෙයි.",
    modulesTitle:   "පද්ධති මොඩියුල",
    modulesSub:     "සම්පූර්ණ බෝග සැලසුම් ගමනාන්තය ආවරණය කරන ක්‍රියාකාරී මෙවලම් හතරක්",
    teamTitle:      "ව්‍යාපෘති කණ්ඩායම",
    teamSub:        "ශ්‍රී ලාංකික කෘෂිකාර්මය සඳහා අධ්‍යයනික ව්‍යාපෘතියක් ලෙස සකස් කරන ලදී",
    techTitle:      "තාක්ෂණය",
    techSub:        "නවීන, ප්‍රවේශ හැකි මෙවලම් සමඟ ගොඩ නගන ලදී",
    comingSoon:     "ළඟදීම",
    missionLabel:   "මෙහෙවර සහ දැක්ම",
    missionTitle:   "අපව ගෙනයන්නේ කුමක්ද",
    missionSub:     "ශ්‍රී ලාංකික සෑම ගොවියෙකුම හොඳම කෘෂිකාර්මික බුද්ධිය ලැබිය යුතු බව අපි විශ්වාස කරමු.",
    missionCardTitle: "අපගේ මෙහෙවර",
    missionCardText:  "ශ්‍රී ලාංකික ගොවීන් සහ ඉඩම් හිමිකරුවන් AI-ධාවිත විශ්ලේෂණ සමඟ සවිබල ගැන්වීම — නොමිලේ.",
    visionCardTitle: "අපගේ දැක්ම",
    visionCardText:  "සෑම ගොවියෙකුටම ඔවුන් සිටින ස්ථානය හෝ ඔවුන් සතු සම්පත් නොසලකා හොඳම කෘෂිකාර්මික බුද්ධිය ලැබෙන අනාගතයක්.",
    impactLabel:    "බලපෑම",
    impactTitle:    "සැබෑ ප්‍රතිඵල සඳහා සැලසුම් කරන ලදී",
    impactNums: [
      { num: "4",    suffix: "",  label: "AI-ශක්‍ය මෙවලම්" },
      { num: "5",    suffix: "+", label: "බෝග මාර්ගෝපදේශ" },
      { num: "25",   suffix: "+", label: "ශ්‍රී ලාංකික දිස්ත්‍රික්ක" },
      { num: "100",  suffix: "%", label: "විවෘත මූලාශ්‍ර" },
    ],
    contactTitle:   "සම්බන්ධ කරගන්න",
    contactSub:     "ප්‍රශ්න හෝ ප්‍රතිපෝෂණ ඇතිද? SmartAgri කණ්ඩායමට සම්බන්ධ වන්න.",
    contactEmail:   "ඊ-තැපෑල",
    contactProject: "ව්‍යාපෘතිය",
    contactProjectVal: "ශ්‍රී ලාංකා විශ්ව විද්‍යාලයේ අධ්‍යයනික අවසාන වසර ව්‍යාපෘතිය",
    contactNote:    "SmartAgri යනු විවෘත-මූලාශ්‍ර අධ්‍යයනික ව්‍යාපෘතියකි. දායකත්ව සහ ප්‍රතිපෝෂණ සාදරයෙන් පිළිගනිමු.",
  },
  ta: {
    heroBadge:      "இந்த திட்டத்தைப் பற்றி",
    heroTitle:      "SmartAgri பற்றி",
    heroSub:        "இலங்கை விவசாயிகள் மற்றும் நில உரிமையாளர்களுக்கு சிறந்த பயிர் திட்டமிடல் முடிவுகளை எடுக்க உதவும் வகையில் வடிவமைக்கப்பட்ட ஸ்மார்ட் வேளாண் முடிவு ஆதரவு அமைப்பு.",
    problemTitle:   "பிரச்சனை",
    problemText:    "பல விவசாயிகள் மற்றும் நில உரிமையாளர்கள் தங்கள் நிலத்திற்கு மிகவும் பொருத்தமான பயிரை தேர்வு செய்வதில் சிரமப்படுகிறார்கள். சரியான நடவு காலம், மண் தேவைகள், உர தேவைகள், எதிர்பார்க்கப்படும் மகசூல், உற்பத்தி செலவு அல்லது விற்பனை விலை பற்றி அவர்களுக்கு தெரியாமல் இருக்கலாம்.",
    solutionTitle:  "எங்கள் தீர்வு",
    solutionText:   "SmartAgri, AI-இயக்கப்படும் பயிர் பரிந்துரை, விளக்கமான முடிவுகள், படிப்படியான பயிர் வழிகாட்டுதல், மகசூல் மற்றும் விலை மதிப்பீடு, மற்றும் வானிலை அடிப்படையிலான விவசாய ஆலோசனை — இலங்கை வேளாண்-சுற்றுச்சூழல் நிலைமைகளுக்கு ஏற்றவாறு வழங்குகிறது.",
    modulesTitle:   "அமைப்பு தொகுதிகள்",
    modulesSub:     "முழு பயிர் திட்டமிடல் பயணத்தை உள்ளடக்கிய நான்கு செயலில் உள்ள கருவிகள்",
    teamTitle:      "திட்ட குழு",
    teamSub:        "இலங்கை வேளாண்மைக்காக ஒரு கல்வி திட்டமாக உருவாக்கப்பட்டது",
    techTitle:      "தொழில்நுட்பம்",
    techSub:        "நவீன, அணுகக்கூடிய கருவிகளுடன் கட்டப்பட்டது",
    comingSoon:     "விரைவில்",
    missionLabel:   "நோக்கம் & தொலைநோக்கு",
    missionTitle:   "எங்களை இயக்குவது என்ன",
    missionSub:     "ஒவ்வொரு இலங்கை விவசாயியும் சிறந்த வேளாண் நுண்ணறிவை அணுக தகுதியானவர் என்று நாங்கள் நம்புகிறோம்.",
    missionCardTitle: "எங்கள் நோக்கம்",
    missionCardText:  "இலங்கை விவசாயிகள் மற்றும் நில உரிமையாளர்களை AI நுண்ணறிவுடன் வலுப்படுத்துவது — இலவசமாக.",
    visionCardTitle: "எங்கள் தொலைநோக்கு",
    visionCardText:  "ஒவ்வொரு விவசாயியும் அவர்கள் இருக்கும் இடம் அல்லது வளங்களைப் பொருட்படுத்தாமல் சிறந்த வேளாண் நுண்ணறிவை பெறும் எதிர்காலம்.",
    impactLabel:    "தாக்கம்",
    impactTitle:    "உண்மையான முடிவுகளுக்கு வடிவமைக்கப்பட்டது",
    impactNums: [
      { num: "4",    suffix: "",  label: "AI கருவிகள்" },
      { num: "5",    suffix: "+", label: "பயிர் வழிகாட்டல்" },
      { num: "25",   suffix: "+", label: "இலங்கை மாவட்டங்கள்" },
      { num: "100",  suffix: "%", label: "திறந்த மூலம்" },
    ],
    contactTitle:   "தொடர்பு கொள்ளுங்கள்",
    contactSub:     "கேள்விகள் அல்லது கருத்துக்கள் உள்ளதா? SmartAgri குழுவை தொடர்பு கொள்ளுங்கள்.",
    contactEmail:   "மின்னஞ்சல்",
    contactProject: "திட்டம்",
    contactProjectVal: "இலங்கை பல்கலைக்கழக கல்வி இறுதி ஆண்டு திட்டம்",
    contactNote:    "SmartAgri ஒரு திறந்த மூல கல்வி திட்டம். பங்களிப்புகளும் கருத்துக்களும் வரவேற்கப்படுகின்றன.",
  },
};

const MODULES = [
  {
    icon: "🌱",
    en: { name: "Crop Recommendation", desc: "Suggests suitable crops using soil type, nutrient levels, climate, season, irrigation, and agro-zone inputs. Powered by a machine learning model with explainable AI." },
    si: { name: "බෝග නිර්දේශය", desc: "පාංශු වර්ගය, පෝෂක මට්ටම්, කාලගුණය, කන්නය, ජලය සැපයීම සහ කලාප දත්ත භාවිත කර සුදුසු බෝග යෝජනා කරයි." },
    ta: { name: "பயிர் பரிந்துரை", desc: "மண் வகை, ஊட்டச்சத்து அளவுகள், காலநிலை, பருவகாலம், நீர்ப்பாசனம் மற்றும் மண்டல உள்ளீடுகளைப் பயன்படுத்தி பொருத்தமான பயிர்களை பரிந்துரைக்கிறது." },
    ready: true,
  },
  {
    icon: "📋",
    en: { name: "Crop Guidance", desc: "Provides stage-wise farming guidance including growth stages, activities, fertilization schedule, irrigation, disease and pest management, and harvest information." },
    si: { name: "බෝග මාර්ගෝපදේශය", desc: "වර්ධන අදියර, ක්‍රියාකාරකම්, පොහොර කාලසටහන, ජලය, රෝග සහ කෘමි කළමනාකරණය, සහ අස්වනු නෙළීමේ තොරතුරු ඇතුළු ක්‍රමවත් ගොවිතැන් මාර්ගෝපදේශය." },
    ta: { name: "பயிர் வழிகாட்டி", desc: "வளர்ச்சி நிலைகள், நடவடிக்கைகள், உர அட்டவணை, நீர்ப்பாசனம், நோய் மற்றும் பூச்சி மேலாண்மை, மற்றும் அறுவடை தகவல் உட்பட படிப்படியான விவசாய வழிகாட்டுதல்." },
    ready: true,
  },
  {
    icon: "📊",
    en: { name: "Yield & Price Estimation", desc: "Estimates expected harvest quantity based on land size, crop type, germination rate, and conditions. Also calculates production cost, selling price, and expected profit." },
    si: { name: "අස්වැන්න සහ මිල ගණනය", desc: "ඉඩම් ප්‍රමාණය, බෝග වර්ගය, ශාකෝදේ වීජ අනුපාතය සහ කොන්දේසි මත අපේක්ෂිත අස්වැන්න ගණනය කරයි. නිෂ්පාදන පිරිවැය, විකිණීමේ මිල සහ ලාභය ද ගණනය කරයි." },
    ta: { name: "மகசூல் & விலை மதிப்பீடு", desc: "நில அளவு, பயிர் வகை, முளைப்பு வீதம் மற்றும் நிலைமைகளின் அடிப்படையில் எதிர்பார்க்கப்படும் மகசூலை மதிப்பிடுகிறது. உற்பத்தி செலவு, விற்பனை விலை மற்றும் லாபத்தையும் கணக்கிடுகிறது." },
    ready: true,
  },
  {
    icon: "🌤️",
    en: { name: "Weather Advice", desc: "Fetches live weather data for Sri Lankan districts and provides farming-relevant advice including temperature, humidity, rainfall forecast, and risk alerts." },
    si: { name: "කාලගුණ උපදෙස්", desc: "ශ්‍රී ලාංකික දිස්ත්‍රික්ක සඳහා සජීවී කාලගුණ දත්ත ලබා ගෙන උෂ්ණත්වය, ආර්ද්‍රතාවය, වර්ෂාපතන අනාවැකිය සහ අවදානම් ඇඟවීම් ඇතුළු ගොවිතැනට අදාළ උපදෙස් ලබා දෙයි." },
    ta: { name: "வானிலை ஆலோசனை", desc: "இலங்கை மாவட்டங்களுக்கான நேரடி வானிலை தரவை பெற்று வெப்பநிலை, ஈரப்பதம், மழை முன்னறிவிப்பு மற்றும் ஆபத்து எச்சரிக்கைகள் உட்பட விவசாயம் தொடர்பான ஆலோசனைகளை வழங்குகிறது." },
    ready: true,
  },
  {
    icon: "🏪",
    en: { name: "Market Prices", desc: "Will display current market prices for agricultural products across Sri Lanka to help farmers make informed selling decisions." },
    si: { name: "වෙළඳපොල මිල", desc: "ගොවීන්ට දැනුවත් විකිණීමේ තීරණ ගැනීමට ශ්‍රී ලංකාව පුරා කෘෂිකාර්මික නිෂ්පාදන සඳහා වත්මන් වෙළඳපොල මිල ප්‍රදර්ශනය කරනු ඇත." },
    ta: { name: "சந்தை விலைகள்", desc: "விவசாயிகளுக்கு தெரிவுசெய்யப்பட்ட விற்பனை முடிவுகளை எடுக்க இலங்கை முழுவதும் விவசாய பொருட்களுக்கான தற்போதைய சந்தை விலைகளை காண்பிக்கும்." },
    ready: false,
  },
];

const TEAM = [
  { name: "Induwara", role: "Full-Stack Developer & ML Integration", initial: "I" },
];

const TECH_STACK = [
  { icon: "⚛️",  name: "React 18",    desc: "Frontend framework" },
  { icon: "⚡",  name: "Vite",        desc: "Build tool" },
  { icon: "🐍",  name: "Python / Flask", desc: "Backend API" },
  { icon: "🤖",  name: "Scikit-learn", desc: "ML model" },
  { icon: "🌐",  name: "Open-Meteo",  desc: "Weather data" },
  { icon: "🎨",  name: "Plain CSS",   desc: "Design system" },
];

export default function About({ lang }) {
  const t  = ABOUT_T[lang] || ABOUT_T.en;

  return (
    <div className="about-page">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-badge">🌾 {t.heroBadge}</div>
          <h1 className="about-hero-title">{t.heroTitle}</h1>
          <p className="about-hero-sub">{t.heroSub}</p>
        </div>
      </div>
      <div className="about-hero-wave" />

      <div className="about-body">

        {/* ── Mission & Vision ── */}
        <section className="about-section about-mission-section">
          <div className="about-section-label">{t.missionLabel}</div>
          <h2 className="about-section-title">{t.missionTitle}</h2>
          <p className="about-section-sub">{t.missionSub}</p>
          <div className="about-mv-grid">
            <div className="about-mv-card about-mv-card--mission">
              <div className="about-mv-icon">🎯</div>
              <h3 className="about-mv-title">{t.missionCardTitle}</h3>
              <p className="about-mv-text">{t.missionCardText}</p>
            </div>
            <div className="about-mv-card about-mv-card--vision">
              <div className="about-mv-icon">🔭</div>
              <h3 className="about-mv-title">{t.visionCardTitle}</h3>
              <p className="about-mv-text">{t.visionCardText}</p>
            </div>
          </div>
        </section>

        {/* ── Impact Numbers ── */}
        <section className="about-section about-impact-section">
          <div className="about-section-label">{t.impactLabel}</div>
          <h2 className="about-section-title">{t.impactTitle}</h2>
          <div className="about-impact-grid">
            {t.impactNums.map((item, i) => (
              <div key={i} className="about-impact-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="about-impact-num">{item.num}<span className="about-impact-suffix">{item.suffix}</span></div>
                <div className="about-impact-label">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Problem + Solution ── */}
        <div className="about-ps-grid">
          <div className="about-ps-card about-ps-card--problem">
            <div className="about-ps-icon">⚠️</div>
            <h2 className="about-ps-title">{t.problemTitle}</h2>
            <p className="about-ps-text">{t.problemText}</p>
          </div>
          <div className="about-ps-card about-ps-card--solution">
            <div className="about-ps-icon">✅</div>
            <h2 className="about-ps-title">{t.solutionTitle}</h2>
            <p className="about-ps-text">{t.solutionText}</p>
          </div>
        </div>

        {/* ── Modules ── */}
        <section className="about-section">
          <div className="about-section-label">System</div>
          <h2 className="about-section-title">{t.modulesTitle}</h2>
          <p className="about-section-sub">{t.modulesSub}</p>

          <div className="about-modules">
            {MODULES.map((mod, i) => {
              const content = mod[lang] || mod.en;
              return (
                <div key={i} className={`about-module-card${!mod.ready ? " about-module-card--coming" : ""}`}>
                  <div className="about-module-top">
                    <div className="about-module-icon">{mod.icon}</div>
                    <div className="about-module-title">{content.name}</div>
                    {!mod.ready && (
                      <span className="about-module-soon">{t.comingSoon}</span>
                    )}
                  </div>
                  <p className="about-module-desc">{content.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Team ── */}
        <section className="about-section">
          <div className="about-section-label">Team</div>
          <h2 className="about-section-title">{t.teamTitle}</h2>
          <p className="about-section-sub">{t.teamSub}</p>

          <div className="about-team-grid">
            {TEAM.map((member, i) => (
              <div key={i} className="about-team-card">
                <div className="about-team-avatar">{member.initial}</div>
                <div className="about-team-name">{member.name}</div>
                <div className="about-team-role">{member.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Stack ── */}
        <section className="about-section">
          <div className="about-section-label">Stack</div>
          <h2 className="about-section-title">{t.techTitle}</h2>
          <p className="about-section-sub">{t.techSub}</p>

          <div className="about-tech-grid">
            {TECH_STACK.map((tech, i) => (
              <div key={i} className="about-tech-card">
                <div className="about-tech-icon">{tech.icon}</div>
                <div className="about-tech-name">{tech.name}</div>
                <div className="about-tech-desc">{tech.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="about-section about-contact-section">
          <div className="about-section-label">Contact</div>
          <h2 className="about-section-title">{t.contactTitle}</h2>
          <p className="about-section-sub">{t.contactSub}</p>

          <div className="about-contact-grid">
            <div className="about-contact-card">
              <div className="about-contact-icon">📧</div>
              <div className="about-contact-label">{t.contactEmail}</div>
              <a className="about-contact-value" href="mailto:induwara.ihalavithana@gmail.com">
                induwara.ihalavithana@gmail.com
              </a>
            </div>
            <div className="about-contact-card">
              <div className="about-contact-icon">🎓</div>
              <div className="about-contact-label">{t.contactProject}</div>
              <div className="about-contact-value">{t.contactProjectVal}</div>
            </div>
            <div className="about-contact-card">
              <div className="about-contact-icon">💬</div>
              <div className="about-contact-label">GitHub</div>
              <div className="about-contact-value">SmartAgri — Open Source</div>
            </div>
          </div>
          <p className="about-contact-note">{t.contactNote}</p>
        </section>

      </div>
    </div>
  );
}
