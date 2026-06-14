/**
 * SmartAgri — Static crop / soil / label data
 * Centralises all constants that were previously duplicated inline.
 */

/** Average yield in kg per acre for each crop under normal Sri Lankan conditions. */
export const CROP_YIELD_PER_ACRE = {
  "Beetroot":                 6000,
  "Big Onion":                8000,
  "Bitter Gourd":             3500,
  "Brinjal (Eggplant)":       5000,
  "Cabbage":                 10000,
  "Capsicum":                 2500,
  "Carrot":                   8000,
  "Cassava":                 12000,
  "Cauliflower (Gowa)":       8000,
  "Chilli":                   1200,
  "Cowpea":                    800,
  "Elabatu (Thai Eggplant)":  4000,
  "Innala":                   3000,
  "Kiri Ala":                 4000,
  "Kohlrabi (Nokol)":         6000,
  "Kurakkan":                  700,
  "Leeks":                    5000,
  "Luffa":                    3000,
  "Maize":                    2000,
  "Mung Bean":                 600,
  "Okra":                     3000,
  "Pathola (Snake Gourd)":    4000,
  "Pigeon Pea":                800,
  "Potato":                   8000,
  "Pumpkin":                  6000,
  "Radish":                   6000,
  "Red Onion":                6000,
  "Sorghum":                  1500,
  "Soybean":                   900,
  "Sunflower":                 700,
  "Sweet Corn":               2500,
  "Tibbatu (Turkey Berry)":   3000,
  "Tomato":                   8000,
  "Winged Bean (Dambala)":    1200,
  "Beans":                    1500,
  "Black Gram":                600,
  "Cucumber":                 5000,
  "Kohila":                   3000,
  "Menari (Proso Millet)":     600,
  "Mustard":                   400,
  "Sweet Potato (Bathala)":   5000,
};

/** Conversion factors to convert any land unit → acres. */
export const LAND_UNIT_TO_ACRES = {
  Acre:    1,
  Perch:   1 / 160,
  Hectare: 2.471,
};


export const SOIL_TYPES = [
  "Alluvial","Alluvial Loam","Bog and Half-Bog Soil","Clay Loam","Clay Soil",
  "Deep Loam","Deep Sandy Loam","Fertile Loam","Humic Gley","Immature Brown Loam",
  "Lateritic Loam","Lateritic Soil","Light Loam","Light Sandy Loam","Loam",
  "Loamy Sand","Low-Humic Gley","Marshy Soil","Mountain Regosol","Non-Calcic Brown Earth",
  "Organic-Rich Loam","Red Loam","Red-Brown Earth","Red-Yellow Latosol",
  "Red-Yellow Podzolic","Reddish-Brown Earth","Reddish-Brown Latosol","Regosol",
  "Sandy Clay Loam","Sandy Loam","Sandy Regosol","Sandy Soil","Silt Loam",
  "Well Drained Loam",
];

export const SOIL_SI_LABELS = {
  "Alluvial":"ඇලූවියල් පස","Alluvial Loam":"ඇලූවියල් ලෝම පස","Bog and Half-Bog Soil":"මඩ සහ අර්ධ මඩ පස","Clay Loam":"මැටි ලෝම පස","Clay Soil":"මැටි පස","Deep Loam":"ගැඹුරු ලෝම පස","Deep Sandy Loam":"ගැඹුරු වැලි ලෝම පස","Fertile Loam":"සරු ලෝම පස","Humic Gley":"හියුමික් ග්ලේ පස","Immature Brown Loam":"අර්ධ වර්ධිත දුඹුරු ලෝම පස","Lateritic Loam":"ලැටරයිට් ලෝම පස","Lateritic Soil":"ලැටරයිට් පස","Light Loam":"සැහැල්ලු ලෝම පස","Light Sandy Loam":"සැහැල්ලු වැලි ලෝම පස","Loam":"ලෝම පස","Loamy Sand":"ලෝම සහිත වැලි පස","Low-Humic Gley":"අඩු හියුමස් ග්ලේ පස","Marshy Soil":"වගුරු පස","Mountain Regosol":"කඳුකර රෙගොසෝල් පස","Non-Calcic Brown Earth":"කැල්සියම් රහිත දුඹුරු පස","Organic-Rich Loam":"කාබනික ද්‍රව්‍ය බහුල ලෝම පස","Red Loam":"රතු ලෝම පස","Red-Brown Earth":"රතු-දුඹුරු පස","Red-Yellow Latosol":"රතු-කහ ලැටොසෝල් පස","Red-Yellow Podzolic":"රතු-කහ පොඩ්සොලික් පස","Reddish-Brown Earth":"රතු පැහැති දුඹුරු පස","Reddish-Brown Latosol":"රතු පැහැති දුඹුරු ලැටොසෝල් පස","Regosol":"රෙගොසෝල් පස","Sandy Clay Loam":"වැලි මැටි ලෝම පස","Sandy Loam":"වැලි ලෝම පස","Sandy Regosol":"වැලි රෙගොසෝල් පස","Sandy Soil":"වැලි පස","Silt Loam":"සිල්ට් ලෝම පස","Well Drained Loam":"හොඳින් ජලය බැස යන ලෝම පස",
};

export const SOIL_TA_LABELS = {
  "Alluvial":"ஆற்றுப்படிவு மண்","Alluvial Loam":"ஆற்றுப்படிவு கலிமண்","Bog and Half-Bog Soil":"சதுப்பு மற்றும் அரைச் சதுப்பு மண்","Clay Loam":"களிமண் கலந்த கலிமண்","Clay Soil":"களிமண்","Deep Loam":"ஆழமான கலிமண்","Deep Sandy Loam":"ஆழமான மணற்பாங்கான கலிமண்","Fertile Loam":"வளமான கலிமண்","Humic Gley":"ஹியூமிக் கிளே மண்","Immature Brown Loam":"முழுமையாக வளராத பழுப்பு கலிமண்","Lateritic Loam":"லேட்டரைட் கலிமண்","Lateritic Soil":"லேட்டரைட் மண்","Light Loam":"இலகு கலிமண்","Light Sandy Loam":"இலகு மணற்பாங்கான கலிமண்","Loam":"கலிமண்","Loamy Sand":"கலிமண் கலந்த மணல் மண்","Low-Humic Gley":"குறைந்த ஹியூமஸ் கிளே மண்","Marshy Soil":"சதுப்பு நில மண்","Mountain Regosol":"மலைப்பகுதி ரெகோசோல் மண்","Non-Calcic Brown Earth":"சுண்ணாம்பு இல்லாத பழுப்பு மண்","Organic-Rich Loam":"கரிமப் பொருள் நிறைந்த கலிமண்","Red Loam":"சிவப்பு கலிமண்","Red-Brown Earth":"சிவப்பு-பழுப்பு மண்","Red-Yellow Latosol":"சிவப்பு-மஞ்சள் லேட்டோசோல் மண்","Red-Yellow Podzolic":"சிவப்பு-மஞ்சள் பொட்சோலிக் மண்","Reddish-Brown Earth":"செம்மை கலந்த பழுப்பு மண்","Reddish-Brown Latosol":"செம்மை கலந்த பழுப்பு லேட்டோசோல் மண்","Regosol":"ரெகோசோல் மண்","Sandy Clay Loam":"மணல்-களிமண் கலந்த கலிமண்","Sandy Loam":"மணற்பாங்கான கலிமண்","Sandy Regosol":"மணற்பாங்கான ரெகோசோல் மண்","Sandy Soil":"மணல் மண்","Silt Loam":"வண்டல் கலிமண்","Well Drained Loam":"நன்றாக நீர் வடிகாலாகும் கலிமண்",
};

export const CROP_SI_LABELS = {
  "Beetroot":"බීට්රූට්","Big Onion":"ලොකු ලූනු","Bitter Gourd":"කරවිල","Brinjal (Eggplant)":"වම්බටු","Cabbage":"ගෝවා","Capsicum":"මාළු මිරිස්","Carrot":"කැරට්","Cassava":"මඤ්ඤොක්කා","Cauliflower (Gowa)":"මල් ගෝවා","Chilli":"මිරිස්","Cowpea":"කව්පි","Elabatu (Thai Eggplant)":"එළබටු","Innala":"ඉන්නල","Kiri Ala":"කිරි අල","Kohlrabi (Nokol)":"නෝකෝල්","Kurakkan":"කුරක්කන්","Leeks":"ලීක්ස්","Luffa":"වැටකොළු","Maize":"බඩ ඉරිඟු","Mung Bean":"මුං ඇට","Okra":"බණ්ඩක්කා","Pathola (Snake Gourd)":"පතෝල","Pigeon Pea":"තෝර පරිප්පු","Potato":"අර්තාපල්","Pumpkin":"වට්ටක්කා","Radish":"රාබු","Red Onion":"රතු ලූනු","Sorghum":"ඉදල් ඉරිඟු","Soybean":"සෝයා බෝංචි","Sunflower":"සූරියකාන්ත","Sweet Corn":"මිහිරි බඩ ඉරිඟු","Tibbatu (Turkey Berry)":"තිබ්බටු","Tomato":"තක්කාලි","Winged Bean (Dambala)":"දඹල",
  "Beans":"බෝංචි","Black Gram":"උඳු","Cucumber":"පිපිඤ්ඤා","Kohila":"කොහිල","Menari (Proso Millet)":"මෙනේරි","Mustard":"අබ","Sweet Potato (Bathala)":"බතල",
};

export const CROP_TA_LABELS = {
  "Beetroot":"பீட்ரூட்","Big Onion":"பெரிய வெங்காயம்","Bitter Gourd":"பாகற்காய்","Brinjal (Eggplant)":"கத்தரிக்காய்","Cabbage":"முட்டைக்கோஸ்","Capsicum":"குடைமிளகாய்","Carrot":"கேரட்","Cassava":"மரவள்ளிக்கிழங்கு","Cauliflower (Gowa)":"காலிஃபிளவர்","Chilli":"மிளகாய்","Cowpea":"காராமணி","Elabatu (Thai Eggplant)":"எலபட்டு","Innala":"இன்னலா","Kiri Ala":"கிரி அலை","Kohlrabi (Nokol)":"நூல்கோல்","Kurakkan":"கேழ்வரகு","Leeks":"லீக்ஸ்","Luffa":"பீர்க்கங்காய்","Maize":"மக்காச்சோளம்","Mung Bean":"பச்சைப்பயறு","Okra":"வெண்டைக்காய்","Pathola (Snake Gourd)":"புடலங்காய்","Pigeon Pea":"துவரை","Potato":"உருளைக்கிழங்கு","Pumpkin":"பூசணிக்காய்","Radish":"முள்ளங்கி","Red Onion":"சிவப்பு வெங்காயம்","Sorghum":"சோளம்","Soybean":"சோயாபீன்","Sunflower":"சூரியகாந்தி","Sweet Corn":"இனிப்பு மக்காச்சோளம்","Tibbatu (Turkey Berry)":"சுண்டைக்காய்","Tomato":"தக்காளி","Winged Bean (Dambala)":"சிறகுப்பயறு",
  "Beans":"பீன்ஸ்","Black Gram":"உளுந்து","Cucumber":"வெள்ளரிக்காய்","Kohila":"கோஹிலா","Menari (Proso Millet)":"பனிவரகு","Mustard":"கடுகு","Sweet Potato (Bathala)":"சர்க்கரைவள்ளிக்கிழங்கு",
};

export const CROP_EMOJI = {
  "Tomato":"🍅","Carrot":"🥕","Potato":"🥔","Chilli":"🌶️","Capsicum":"🫑",
  "Cabbage":"🥬","Maize":"🌽","Sweet Corn":"🌽","Pumpkin":"🎃","Bitter Gourd":"🥒",
  "Okra":"🌿","Soybean":"🫘","Mung Bean":"🫘","Cowpea":"🫘","Kurakkan":"🌾",
  "Sorghum":"🌾","Sunflower":"🌻","Big Onion":"🧅","Red Onion":"🧅",
  "Brinjal (Eggplant)":"🍆","Radish":"🌱","Leeks":"🌿","Beetroot":"🟣",
  "Cassava":"🌿","Luffa":"🥒","Pigeon Pea":"🫘","Innala":"🌱","Kiri Ala":"🌿",
  "Kohlrabi (Nokol)":"🥬","Pathola (Snake Gourd)":"🥒","Elabatu (Thai Eggplant)":"🍆",
  "Cauliflower (Gowa)":"🥦","Tibbatu (Turkey Berry)":"🌿","Winged Bean (Dambala)":"🫘",
  "Beans":"🫘","Black Gram":"🫘","Cucumber":"🥒","Kohila":"🌿","Menari (Proso Millet)":"🌾","Mustard":"🌼","Sweet Potato (Bathala)":"🍠",
};

/** All 41 crops used in the SmartAgri ML model, sorted alphabetically. */
export const ALL_CROPS = Object.keys(CROP_YIELD_PER_ACRE).sort();

export const FEAT_ICONS = {
  "N":"🌿","P":"⚗️","K":"💧","Temperature":"🌡️","Rainfall":"🌧️",
  "pH":"🧪","Humidity":"💨","NPK_Sum":"🌱","N_P_Ratio":"⚖️",
  "N_K_Ratio":"⚖️","P_K_Ratio":"⚖️","Rainfall_Temp_Ratio":"🌤️","pH_Squared":"🔬",
};

export const MONTH_EN = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTH_SI = ["","ජන","පෙබ","මාර්","අප්‍ර","මැයි","ජූනි","ජූලි","අගෝ","සැප්","ඔක්","නොවැ","දෙසැ"];
export const MONTH_TA = ["","ஜன","பிப்","மார்","ஏப்","மே","ஜூன்","ஜூலை","ஆக","செப்","அக்","நவ","டிச"];

export function getSoilLabel(s, lang) {
  if (lang === "si") return SOIL_SI_LABELS[s] || s;
  if (lang === "ta") return SOIL_TA_LABELS[s] || s;
  return s;
}

export function getCropLabel(c, lang) {
  if (lang === "si") return CROP_SI_LABELS[c] || c;
  if (lang === "ta") return CROP_TA_LABELS[c] || c;
  return c;
}

export function monthName(m, lang) {
  return lang === "si" ? MONTH_SI[m] : lang === "ta" ? MONTH_TA[m] : MONTH_EN[m];
}

export function getSuitability(v, min, max) {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  if (n < min) return "below";
  if (n > max) return "above";
  return "ok";
}

/** Natural language sentence explaining a feature's status (trilingual). */
export function xaiSentence(feat, lang) {
  const lbl = lang === "si" ? (feat.label_si || feat.label)
            : lang === "ta" ? (feat.label_ta || feat.label)
            : feat.label;
  const v = feat.value, mn = feat.ideal_min, mx = feat.ideal_max;
  if (v === null || v === undefined || mn === null) return null;
  const vf = typeof v === "number" ? v.toFixed(1) : v;
  const mnf = mn.toFixed(1), mxf = mx.toFixed(1);
  if (v >= mn && v <= mx) {
    if (lang === "si") return `${lbl} අගය (${vf}) සුදුසු පරාසය (${mnf}–${mxf}) තුළ ඇත`;
    if (lang === "ta") return `${lbl} மதிப்பு (${vf}) சரியான வரம்பில் (${mnf}–${mxf}) உள்ளது`;
    return `${lbl} (${vf}) is within ideal range (${mnf}–${mxf})`;
  }
  if (v < mn) {
    if (lang === "si") return `${lbl} (${vf}) සුදුසු අවම (${mnf}) ට වඩා අඩු ය`;
    if (lang === "ta") return `${lbl} (${vf}) குறைந்தபட்ச வரம்புக்கு (${mnf}) கீழே உள்ளது`;
    return `${lbl} (${vf}) is below the ideal minimum (${mnf})`;
  }
  if (lang === "si") return `${lbl} (${vf}) සුදුසු උපරිම (${mxf}) ට වඩා වැඩි ය`;
  if (lang === "ta") return `${lbl} (${vf}) அதிகபட்ச வரம்புக்கு (${mxf}) மேலே உள்ளது`;
  return `${lbl} (${vf}) exceeds the ideal maximum (${mxf})`;
}

/**
 * Soil identification guide for farmers — Sri Lankan context.
 * Each entry includes colour, texture, drainage and field-test identification tips.
 */
export const SOIL_GUIDE_ROWS = [
  {
    type: "Sandy Loam",
    colour: "Light brown / reddish-brown",
    texture: "Gritty; crumbles easily when dry",
    drainage: "Fast",
    identify_en: "Squeeze a moist handful — it barely holds a shape and falls apart when released. Rubbing between fingers feels gritty. Most common soil in Sri Lanka's Dry Zone.",
    identify_si: "තෙත් ගොඩක් මිරිකන්න — එය ආකාරයක් ගන්නේ ශීඝ්‍රයෙන් ගිලිහෙනවා. ඇඟිලිවල රූ ගත් විට කැටි ගතිය දැනේ. ශ්‍රී ලංකාවේ වියළි කලාපයේ බහුල පාංශු වර්ගය.",
    identify_ta: "ஈரமான ஒரு கைப்பிடி மண்ணை அழுத்துங்கள் — அது வடிவம் பெறுவதற்கு முன்பே உதிர்ந்துவிடும். விரல்களால் தேய்க்கும்போது கரடுமுரடான உணர்வு. இலங்கையின் வறண்ட மண்டலத்தில் பரவலான மண் வகை.",
  },
  {
    type: "Loam",
    colour: "Dark brown",
    texture: "Smooth yet slightly gritty; ribbons 2–3 cm",
    drainage: "Good",
    identify_en: "The 'perfect' farm soil. Moist loam forms a ball when squeezed, ribbons about 2–3 cm before breaking. Feels neither too gritty nor too sticky. Rich earthy smell after rain.",
    identify_si: "සරලම ගොවිතැන් පාංශු. තෙත් ලෝම් මිරිකූ විට ගෝලයක් සාදයි, 2-3 cm පිළිනය කර කැඩෙයි. ඕනෑවට කැටිනම් ද නොවේ, ඕනෑවට ලාදිරිනම් ද නොවේ. වැස්සෙන් පසු ඉඩම් සුවඳ.",
    identify_ta: "சிறந்த விவசாய மண். ஈரமான களிமண்ணை அழுத்தினால் ஒரு உருண்டை உருவாகும், 2-3 செ.மீ நீண்டு உடைந்துவிடும். மழைக்குப் பிறகு மண் வாசனை.",
  },
  {
    type: "Clay Soil",
    colour: "Grey to dark brown",
    texture: "Very sticky when wet; cracks when dry",
    drainage: "Poor",
    identify_en: "Squeeze a moist sample — it forms a long ribbon (5+ cm) without breaking and feels very smooth, plastic. Sticks to boots when wet. Dries into hard clods with wide cracks. Waterlogging risk is high.",
    identify_si: "තෙත් සාම්පලයක් මිරිකන්න — කිසිදු ගතිය නොමැතිව දිගු පිළිනයක් (5+ cm) ඇති කරයි. තෙත් වූ විට සපාත් ඇලෙයි. වියළෙන විට දළ ශිලා ද දළ ඉරි සහිතව.",
    identify_ta: "ஈரமான மாதிரியை அழுத்துங்கள் — மிக நீண்ட நாடா (5+ செ.மீ) உருவாகும், மிகவும் வழுவழுப்பாக இருக்கும். ஈரத்தில் காலணிகளில் ஒட்டிக்கொள்ளும். உலர்ந்தால் கடினமான கட்டிகளாக விரிசல் படும்.",
  },
  {
    type: "Sandy Soil",
    colour: "Light tan / pale brown",
    texture: "Very gritty; falls apart immediately",
    drainage: "Very fast",
    identify_en: "Cannot form any ball even when moist — falls apart instantly. Rubbing feels like rubbing coarse sand. Dries out very quickly after rain. Water and nutrients leach out fast — requires frequent irrigation.",
    identify_si: "තෙත් වූ විට පවා ගෝලයක් සෑදීමට නොහැකිය — ක්ෂණිකව ගිලිහෙයි. ගෙරි වැලිය ඉෙලනවා ලෙස රූ ගතිය දැනේ. වර්ෂාවෙන් පසු ශීඝ්‍රයෙන් වියළෙයි.",
    identify_ta: "ஈரத்திலும் கூட எந்த உருண்டையும் உருவாக்க முடியாது — உடனடியாக உதிர்ந்துவிடும். கரடுமுரடான மணல் தேய்க்கும் உணர்வு. மழைக்கு பிறகு மிக வேகமாக உலர்ந்துவிடும்.",
  },
  {
    type: "Red-Brown Earth",
    colour: "Deep red or rust-brown",
    texture: "Firm, slightly sticky when wet",
    drainage: "Moderate",
    identify_en: "Unmistakably deep red colour — indicates iron oxides. Forms a firm ball when moist; ribbons about 3–4 cm. Common in Sri Lanka's intermediate and up-country zones. Good for most field crops.",
    identify_si: "ඉතාමත් ගැඹුරු රතු වර්ණය — යකඩ ඔක්සයිඩ් ඇතිබව දක්වයි. තෙත් වූ විට ශක්තිමත් ගෝලයක් සාදයි; 3-4 cm රිබොන්. ශ්‍රී ලංකාවේ අතරමැදි හා කඳුකර කලාපවල දක්නෙ.",
    identify_ta: "ஆழமான சிவப்பு நிறம் — இரும்பு ஆக்சைடு இருப்பதை குறிக்கிறது. ஈரத்தில் ஒரு உறுதியான உருண்டை உருவாகும்; 3-4 செ.மீ நாடா. இலங்கையின் இடைநிலை மற்றும் மலைப்பகுதி மண்டலங்களில் பொதுவானது.",
  },
  {
    type: "Lateritic Soil",
    colour: "Bright red to orange-red",
    texture: "Hard when dry; crumbles into small lumps",
    drainage: "Fast",
    identify_en: "Bright red or orange, often with visible iron/aluminium nodules. Very hard when dry — difficult to break with a spade. Common in the wet and intermediate zones. Low fertility but drains well.",
    identify_si: "දීප්තිමත් රතු හෝ තැඹිලි, බොහෝ විට දෘශ්‍යමාන යකඩ/ඇලුමිනියම් කැට සහිතව. වියළෙන විට ඉතාමත් දෘඩ — ස්කූප් දෑකිල්ලකින් ශෝධනය කිරීමට අපහසු. තෙත් හා අතරමැදි කලාපවල දක්නෙ.",
    identify_ta: "பிரகாசமான சிவப்பு அல்லது ஆரஞ்சு நிறம், பெரும்பாலும் இரும்பு/அலுமினியம் நுண்ணடிகள் தெரியும். உலர்ந்தால் மிகவும் கடினமாக இருக்கும் — மண்வெட்டியால் உடைக்கவே கஷ்டமாக இருக்கும்.",
  },
  {
    type: "Alluvial",
    colour: "Grey-brown to dark brown",
    texture: "Silky / smooth; deposited near rivers",
    drainage: "Variable",
    identify_en: "Found near rivers and floodplains. Layered deposits visible in cut banks. Texture varies — can be sandy to silty. Usually very fertile due to fresh mineral deposits with each flood season.",
    identify_si: "ගංගා හා ගංදිය ආශ්‍රිතව දක්නෙ. කපූ ගොඩවල් වල ස්ථරණය දැකිය හැකිය. ගාංශ්‍රිත — වැලිමිශ්‍රිතයේ සිට සිල්ටි දක්වා. ගංවතුරෙහිදී නොතාතු ඛනිජ ලවණ ලැබෙන හෙයින් ඉතා ශ්‍රේෂ්ඨ.",
    identify_ta: "ஆறுகள் மற்றும் வெள்ளப்பரப்புகளுக்கு அருகில் காணப்படும். வெட்டு கரைகளில் படல படிவுகள் தெரியும். அனைத்து வெள்ளப்பருவத்திலும் புதிய கனிம படிவுகளால் மிகவும் வளமானது.",
  },
  {
    type: "Organic-Rich Loam",
    colour: "Very dark brown / black",
    texture: "Spongy; strong earthy smell",
    drainage: "Good",
    identify_en: "Very dark — almost black. Strong earthy/musty smell when dug up. Feels spongy and lightweight. Found in areas with high organic matter accumulation (forest clearings, compost-rich fields). Excellent fertility.",
    identify_si: "ඉතාමත් අදුරු — කළු ලෙස. කැණීමෙදී ශක්තිමත් ඉඩම් සුවඳ. ස්පොන්ජ් ගතිය සහ සැහල්ලු බව දැනේ. කාබනික ද්‍රව්‍ය රැස්ව ඇති ප්‍රදේශවල (වනාන්තර ඉරිදම, කාබනික ක්ෂේත්‍ර). අති ශ්‍රේෂ්ඨ.",
    identify_ta: "மிகவும் இருண்டது — கிட்டத்தட்ட கருப்பு. தோண்டும்போது வலுவான மண் வாசனை. ஸ்பஞ்ச் போன்ற உணர்வு மற்றும் இலகுவான எடை. கரிமப் பொருள் அதிகமான பகுதிகளில் காணப்படும்.",
  },
  {
    type: "Silt Loam",
    colour: "Grey to light brown",
    texture: "Silky, floury feel; ribbons ~2 cm",
    drainage: "Moderate",
    identify_en: "Rub between fingers — feels silky, almost like flour, not gritty. Forms a smooth ribbon about 2 cm. Holds moisture well. Common in low-lying areas with slow water movement. Good for paddy cultivation.",
    identify_si: "ඇඟිලිවල රූ ගන්නා විට — ආटා ල දිනේ ගතිය, කැටි ගතිය නොවේ. ~2 cm රිබොන් සාදයි. ද්‍රව රදාගැනීම් ශ්‍රේෂ්ඨ. ශ්‍රී ලංකාවේ සහල් ගොවිතැනට ශ්‍රේෂ්ඨ.",
    identify_ta: "விரல்களால் தேய்க்கும்போது — மாவு போன்ற மிருதுவான உணர்வு, கரடுமுரடான உணர்வு இல்லை. ~2 செ.மீ நாடா உருவாகும். ஈரப்பதம் நன்றாக தக்கவைக்கும். நெல் சாகுபடிக்கு சிறந்தது.",
  },
  {
    type: "Clay Loam",
    colour: "Brown to reddish-brown",
    texture: "Moderately sticky; ribbons 3–4 cm",
    drainage: "Moderate–Poor",
    identify_en: "Between clay and loam. Feels sticky when wet but not as plastic as pure clay. Forms a ribbon of about 3–4 cm. Moderate drainage. Good for crops that need moisture retention like sugarcane and vegetables.",
    identify_si: "Clay සහ Loam අතර. තෙත් වූ විට ඇලෙනසුලු නමුත් ශුද්ධ clay ලෙස ප්ලාස්ටික් නොවේ. ~3-4 cm රිබොන් සාදයි. ජල ජාලිකාව සාමාන්‍ය. උක් ශාකය හා එළවළු සඳහා ශ්‍රේෂ්ඨ.",
    identify_ta: "களிமண் மற்றும் களிமண் கலவைக்கு இடையே. ஈரத்தில் ஒட்டும் ஆனால் தூய களிமண் போல் இல்லை. ~3-4 செ.மீ நாடா உருவாகும். கரும்பு மற்றும் காய்கறிகளுக்கு நல்லது.",
  },
  {
    type: "Sandy Clay Loam",
    colour: "Light reddish-brown",
    texture: "Gritty yet slightly sticky",
    drainage: "Moderate",
    identify_en: "Gritty like sandy soil but also slightly sticky — a mix of all three particle sizes. Forms a weak ribbon of 2–3 cm. Versatile soil found in many Sri Lankan farming areas. Good all-round crop soil.",
    identify_si: "Sandy ලෙස කැටි නමුත් තරමක ඇලෙනසුලු — ත්‍රිවිධ ශෝදන ද්‍රව්‍ය මිශ්‍රණ. 2-3 cm ශ්‍රීෂ්ඨ රිබොන් සාදයි. ශ්‍රී ලංකාවේ ගොවිතැන් ක්ෂේත්‍රවල දක්නෙ. සෑම බෝගයකටම ශ්‍රේෂ්ඨ.",
    identify_ta: "மணல் போல் கரடுமுரடானது ஆனால் சிறிது ஒட்டும் — மூன்று துகள் அளவுகளின் கலவை. 2-3 செ.மீ பலவீனமான நாடா உருவாகும். இலங்கையின் பல விவசாய பகுதிகளில் காணப்படும்.",
  },
  {
    type: "Sandy Loam",
    colour: "Light brown / reddish-brown",
    texture: "Gritty; crumbles easily when dry",
    drainage: "Fast",
    identify_en: "Squeeze a moist handful — it barely holds a shape and falls apart when released. Rubbing between fingers feels gritty. Most common soil in Sri Lanka's Dry Zone.",
    identify_si: "තෙත් ගොඩක් මිරිකන්න — ගිලිහෙනවා. ඇඟිලිවල රූ ගත් විට කැටි ගතිය දැනේ.",
    identify_ta: "ஈரமான கைப்பிடி மண்ணை அழுத்துங்கள் — உதிர்ந்துவிடும். விரல்களால் தேய்க்கும்போது கரடுமுரடான உணர்வு.",
  },
];
