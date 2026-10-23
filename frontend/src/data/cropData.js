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
  "Beetroot":"பீட்ரூட்","Big Onion":"பெரிய வெங்காயம்","Bitter Gourd":"பாகற்காய்","Brinjal (Eggplant)":"கத்தரிக்காய்","Cabbage":"முட்டைக்கோஸ்","Capsicum":"குடைமிளகாய்","Carrot":"கேரட்","Cassava":"மரவள்ளிக்கிழங்கு","Cauliflower (Gowa)":"காலிஃபிளவர்","Chilli":"மிளகாய்","Cowpea":"காராமணி","Elabatu (Thai Eggplant)":"தாய் கத்தரிக்காய் (எலபட்டு)","Innala":"இன்னலா","Kiri Ala":"கிரி அல (சேம்பு)","Kohlrabi (Nokol)":"நூல்கோல்","Kurakkan":"கேழ்வரகு","Leeks":"லீக்ஸ்","Luffa":"பீர்க்கங்காய்","Maize":"மக்காச்சோளம்","Mung Bean":"பச்சைப்பயறு","Okra":"வெண்டைக்காய்","Pathola (Snake Gourd)":"புடலங்காய்","Pigeon Pea":"துவரை","Potato":"உருளைக்கிழங்கு","Pumpkin":"பூசணிக்காய்","Radish":"முள்ளங்கி","Red Onion":"சிவப்பு வெங்காயம்","Sorghum":"சோளம்","Soybean":"சோயாபீன்","Sunflower":"சூரியகாந்தி","Sweet Corn":"இனிப்பு மக்காச்சோளம்","Tibbatu (Turkey Berry)":"சுண்டைக்காய்","Tomato":"தக்காளி","Winged Bean (Dambala)":"சிறகுப்பயறு",
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
    colour_si: "ලා දුඹුරු / රතු-දුඹුරු",
    colour_ta: "வெளிர் பழுப்பு / சிவப்பு-பழுப்பு",
    texture: "Gritty; crumbles easily when dry",
    texture_si: "රළුයි; වියළි විට පහසුවෙන් කැඩී බිඳේ",
    texture_ta: "கரடுமுரடானது; உலர்ந்தால் எளிதில் உதிரும்",
    drainage: "Fast",
    identify_en: "Squeeze a moist handful — it barely holds a shape and falls apart when released. Rubbing between fingers feels gritty. Most common soil in Sri Lanka's Dry Zone.",
    identify_si: "තෙත් අතුල්ලක් පස් ගෙන මිරිකන්න — එයට හැඩයක් ගත නොහැකි අතර අත ඇරූ විට කැඩී යයි. ඇඟිලි අතර අතුල්ලන විට රළු බවක් දැනේ. ශ්‍රී ලංකාවේ වියළි කලාපයේ වඩාත් බහුල පස මෙයයි.",
    identify_ta: "ஈரமான ஒரு கைப்பிடி மண்ணை அழுத்துங்கள் — அது வடிவம் பிடிக்காமல், கையைத் திறந்ததும் உதிர்ந்துவிடும். விரல்களுக்கு இடையே தேய்த்தால் கரடுமுரடாக இருக்கும். இலங்கையின் வறண்ட மண்டலத்தில் மிகப் பரவலான மண் இதுவே.",
  },
  {
    type: "Loam",
    colour: "Dark brown",
    colour_si: "තද දුඹුරු",
    colour_ta: "அடர் பழுப்பு",
    texture: "Smooth yet slightly gritty; ribbons 2–3 cm",
    texture_si: "සිනිඳුයි, නමුත් මදක් රළුයි; 2–3 cm පටියක් සෑදේ",
    texture_ta: "மென்மையானது, ஆனால் சற்றுக் கரடுமுரடு; 2–3 செ.மீ நாடா உருவாகும்",
    drainage: "Good",
    identify_en: "The 'perfect' farm soil. Moist loam forms a ball when squeezed, ribbons about 2–3 cm before breaking. Feels neither too gritty nor too sticky. Rich earthy smell after rain.",
    identify_si: "'පරිපූර්ණ' ගොවිතැන් පස. තෙත් ලෝම් පස මිරිකූ විට බෝලයක් සෑදෙන අතර කැඩීමට පෙර 2–3 cm පමණ පටියක් සෑදේ. වැඩියෙන් රළු හෝ වැඩියෙන් ඇලෙන සුළු බවක් නොදැනේ. වැස්සෙන් පසු පසේ සුවඳක් හමයි.",
    identify_ta: "சிறந்த விவசாய மண். ஈரமான கலிமண்ணை அழுத்தினால் உருண்டையாகும்; உடையும் முன் 2–3 செ.மீ நாடா போல நீளும். மிகவும் கரடுமுரடாகவோ மிகவும் ஒட்டும் தன்மையுடனோ இருக்காது. மழைக்குப் பிறகு மண் வாசனை வீசும்.",
  },
  {
    type: "Clay Soil",
    colour: "Grey to dark brown",
    colour_si: "අළු සිට තද දුඹුරු දක්වා",
    colour_ta: "சாம்பல் முதல் அடர் பழுப்பு வரை",
    texture: "Very sticky when wet; cracks when dry",
    texture_si: "තෙත් විට ඉතා ඇලෙන සුළුයි; වියළි විට ඉරිතැලේ",
    texture_ta: "ஈரத்தில் மிகவும் ஒட்டும்; உலர்ந்தால் வெடிக்கும்",
    drainage: "Poor",
    identify_en: "Squeeze a moist sample — it forms a long ribbon (5+ cm) without breaking and feels very smooth, plastic. Sticks to boots when wet. Dries into hard clods with wide cracks. Waterlogging risk is high.",
    identify_si: "තෙත් සාම්පලයක් මිරිකන්න — කැඩෙන්නේ නැතිව දිගු පටියක් (5+ cm) සෑදෙන අතර ඉතා සිනිඳු, ප්ලාස්ටික් වැනි බවක් දැනේ. තෙත් විට සපත්තුවල ඇලේ. වියළි විට පළල් ඉරිතැලීම් සහිත තද පිඩැලි බවට පත් වේ. ජලය යටවී පැවතීමේ අවදානම ඉහළයි.",
    identify_ta: "ஈரமான மாதிரியை அழுத்துங்கள் — உடையாமல் நீண்ட நாடா (5+ செ.மீ) உருவாகும்; மிகவும் வழுவழுப்பாக, களிமண் போல இருக்கும். ஈரத்தில் காலணிகளில் ஒட்டிக்கொள்ளும். உலர்ந்தால் அகலமான வெடிப்புகளுடன் கடினமான கட்டிகளாகும். நீர் தேங்கும் அபாயம் அதிகம்.",
  },
  {
    type: "Sandy Soil",
    colour: "Light tan / pale brown",
    colour_si: "ලා කහ-දුඹුරු / ලා දුඹුරු",
    colour_ta: "வெளிர் மஞ்சள்-பழுப்பு",
    texture: "Very gritty; falls apart immediately",
    texture_si: "ඉතා රළුයි; වහාම කැඩී යයි",
    texture_ta: "மிகவும் கரடுமுரடு; உடனே உதிரும்",
    drainage: "Very fast",
    identify_en: "Cannot form any ball even when moist — falls apart instantly. Rubbing feels like rubbing coarse sand. Dries out very quickly after rain. Water and nutrients leach out fast — requires frequent irrigation.",
    identify_si: "තෙත් විට පවා බෝලයක් සෑදිය නොහැක — වහාම කැඩී යයි. ගොරෝසු වැලි අතුල්ලන බවක් දැනේ. වැස්සෙන් පසු ඉතා ඉක්මනින් වියළේ. ජලය සහ පෝෂක ඉක්මනින් සේදී යන බැවින් නිතර ජලය දීම අවශ්‍යයි.",
    identify_ta: "ஈரத்திலும் உருண்டை உருவாக்க முடியாது — உடனே உதிர்ந்துவிடும். கரடுமுரடான மணலைத் தேய்ப்பது போல் இருக்கும். மழைக்குப் பிறகு மிக விரைவாக உலர்ந்துவிடும். நீரும் ஊட்டச்சத்தும் விரைவாக வடிந்துவிடுவதால் அடிக்கடி பாசனம் தேவை.",
  },
  {
    type: "Red-Brown Earth",
    colour: "Deep red or rust-brown",
    colour_si: "තද රතු හෝ මලකඩ-දුඹුරු",
    colour_ta: "அடர் சிவப்பு அல்லது துருப்பழுப்பு",
    texture: "Firm, slightly sticky when wet",
    texture_si: "ස්ථිරයි; තෙත් විට මදක් ඇලෙයි",
    texture_ta: "உறுதியானது; ஈரத்தில் சற்று ஒட்டும்",
    drainage: "Moderate",
    identify_en: "Unmistakably deep red colour — indicates iron oxides. Forms a firm ball when moist; ribbons about 3–4 cm. Common in Sri Lanka's intermediate and up-country zones. Good for most field crops.",
    identify_si: "පැහැදිලිවම තද රතු පැහැයකි — යකඩ ඔක්සයිඩ් ඇති බව පෙන්වයි. තෙත් විට ස්ථිර බෝලයක් සෑදෙන අතර 3–4 cm පමණ පටියක් සෑදේ. ශ්‍රී ලංකාවේ අතරමැදි සහ උඩරට කලාපවල බහුලයි. බොහෝ ක්ෂේත්‍ර බෝග සඳහා සුදුසුයි.",
    identify_ta: "தெளிவாகத் தெரியும் அடர் சிவப்பு நிறம் — இரும்பு ஆக்சைடு இருப்பதைக் காட்டுகிறது. ஈரத்தில் உறுதியான உருண்டையாகும்; 3–4 செ.மீ நாடா உருவாகும். இலங்கையின் இடைநிலை மற்றும் மலைநாட்டு மண்டலங்களில் பொதுவானது. பெரும்பாலான வயல் பயிர்களுக்கு ஏற்றது.",
  },
  {
    type: "Lateritic Soil",
    colour: "Bright red to orange-red",
    colour_si: "දීප්තිමත් රතු සිට තැඹිලි-රතු දක්වා",
    colour_ta: "பிரகாசமான சிவப்பு முதல் ஆரஞ்சு-சிவப்பு வரை",
    texture: "Hard when dry; crumbles into small lumps",
    texture_si: "වියළි විට තදයි; කුඩා කැට බවට කැඩී යයි",
    texture_ta: "உலர்ந்தால் கடினம்; சிறு கட்டிகளாக உடையும்",
    drainage: "Fast",
    identify_en: "Bright red or orange, often with visible iron/aluminium nodules. Very hard when dry — difficult to break with a spade. Common in the wet and intermediate zones. Low fertility but drains well.",
    identify_si: "දීප්තිමත් රතු හෝ තැඹිලි පැහැති වන අතර බොහෝ විට යකඩ/ඇලුමිනියම් කැට පෙනේ. වියළි විට ඉතා තද බැවින් උදැල්ලෙන් කඩා ගැනීමට අපහසුයි. තෙත් සහ අතරමැදි කලාපවල බහුලයි. සරුබව අඩු නමුත් ජලය හොඳින් බැස යයි.",
    identify_ta: "பிரகாசமான சிவப்பு அல்லது ஆரஞ்சு நிறம்; பெரும்பாலும் இரும்பு/அலுமினியக் கட்டிகள் தெரியும். உலர்ந்தால் மிகவும் கடினம் — மண்வெட்டியால் உடைப்பது கடினம். ஈர மற்றும் இடைநிலை மண்டலங்களில் பொதுவானது. வளம் குறைவு, ஆனால் நீர் நன்றாக வடியும்.",
  },
  {
    type: "Alluvial",
    colour: "Grey-brown to dark brown",
    colour_si: "අළු-දුඹුරු සිට තද දුඹුරු දක්වා",
    colour_ta: "சாம்பல்-பழுப்பு முதல் அடர் பழுப்பு வரை",
    texture: "Silky / smooth; deposited near rivers",
    texture_si: "සිනිඳුයි; ගංගා අසල තැන්පත් වූ",
    texture_ta: "மென்மையானது; ஆறுகளுக்கு அருகில் படிந்தது",
    drainage: "Variable",
    identify_en: "Found near rivers and floodplains. Layered deposits visible in cut banks. Texture varies — can be sandy to silty. Usually very fertile due to fresh mineral deposits with each flood season.",
    identify_si: "ගංගා සහ ගං තැනිතලා අසල දක්නට ලැබේ. කපන ලද ඉවුරුවල ස්ථර ලෙස තැන්පත් වී ඇති බව පෙනේ. වයනය වෙනස් වේ — වැලි සිට රොන්මඩ දක්වා විය හැක. සෑම ගං වතුර කන්නයකම නව ඛනිජ තැන්පත් වන බැවින් සාමාන්‍යයෙන් ඉතා සරුයි.",
    identify_ta: "ஆறுகள் மற்றும் வெள்ளச் சமவெளிகளுக்கு அருகில் காணப்படும். வெட்டப்பட்ட கரைகளில் அடுக்கடுக்கான படிவுகள் தெரியும். தன்மை மணல் முதல் வண்டல் வரை மாறுபடும். ஒவ்வொரு வெள்ளப் பருவத்திலும் புதிய கனிமங்கள் படிவதால் பொதுவாக மிகவும் வளமானது.",
  },
  {
    type: "Organic-Rich Loam",
    colour: "Very dark brown / black",
    colour_si: "ඉතා තද දුඹුරු / කළු",
    colour_ta: "மிக அடர் பழுப்பு / கருப்பு",
    texture: "Spongy; strong earthy smell",
    texture_si: "ස්පොන්ජි වැනි; තද පස් සුවඳක් ඇත",
    texture_ta: "பஞ்சு போன்றது; வலுவான மண் வாசனை",
    drainage: "Good",
    identify_en: "Very dark — almost black. Strong earthy/musty smell when dug up. Feels spongy and lightweight. Found in areas with high organic matter accumulation (forest clearings, compost-rich fields). Excellent fertility.",
    identify_si: "ඉතා තද පැහැයි — කළු පාහේ. හාරන විට තද පස් සුවඳක් හමයි. ස්පොන්ජි වැනි සහ සැහැල්ලු බවක් දැනේ. කාබනික ද්‍රව්‍ය බොහෝ සෙයින් එකතු වී ඇති ප්‍රදේශවල (වනාන්තර එළි කළ ස්ථාන, කොම්පෝස්ට් බහුල කෙත්වල) දක්නට ලැබේ. ඉතා සරුයි.",
    identify_ta: "மிக அடர் நிறம் — கிட்டத்தட்ட கருப்பு. தோண்டும்போது வலுவான மண் வாசனை வரும். பஞ்சு போலவும் இலகுவாகவும் இருக்கும். கரிமப் பொருள் அதிகம் சேர்ந்த இடங்களில் (காடு அழிக்கப்பட்ட பகுதிகள், கம்போஸ்ட் நிறைந்த வயல்கள்) காணப்படும். மிகச் சிறந்த வளம்.",
  },
  {
    type: "Silt Loam",
    colour: "Grey to light brown",
    colour_si: "අළු සිට ලා දුඹුරු දක්වා",
    colour_ta: "சாம்பல் முதல் வெளிர் பழுப்பு வரை",
    texture: "Silky, floury feel; ribbons ~2 cm",
    texture_si: "සිනිඳුයි, පිටි වැනි ස්පර්ශයක්; ~2 cm පටියක් සෑදේ",
    texture_ta: "மென்மையானது, மாவு போன்ற உணர்வு; ~2 செ.மீ நாடா",
    drainage: "Moderate",
    identify_en: "Rub between fingers — feels silky, almost like flour, not gritty. Forms a smooth ribbon about 2 cm. Holds moisture well. Common in low-lying areas with slow water movement. Good for paddy cultivation.",
    identify_si: "ඇඟිලි අතර අතුල්ලන විට සිනිඳුයි, පාහේ පිටි වැනි වන අතර රළු බවක් නොදැනේ. ~2 cm පමණ සිනිඳු පටියක් සෑදේ. තෙතමනය හොඳින් රඳවා ගනී. ජලය සෙමින් ගලා යන පහත් බිම්වල බහුලයි. වී වගාවට සුදුසුයි.",
    identify_ta: "விரல்களால் தேய்க்கும்போது மென்மையாக, கிட்டத்தட்ட மாவு போல இருக்கும்; கரடுமுரடு இல்லை. சுமார் 2 செ.மீ மென்மையான நாடா உருவாகும். ஈரப்பதத்தை நன்றாகத் தக்கவைக்கும். நீர் மெதுவாக நகரும் தாழ்நிலப் பகுதிகளில் பொதுவானது. நெல் சாகுபடிக்கு ஏற்றது.",
  },
  {
    type: "Clay Loam",
    colour: "Brown to reddish-brown",
    colour_si: "දුඹුරු සිට රතු-දුඹුරු දක්වා",
    colour_ta: "பழுப்பு முதல் சிவப்பு-பழுப்பு வரை",
    texture: "Moderately sticky; ribbons 3–4 cm",
    texture_si: "මධ්‍යස්ථව ඇලෙයි; 3–4 cm පටියක් සෑදේ",
    texture_ta: "மிதமாக ஒட்டும்; 3–4 செ.மீ நாடா",
    drainage: "Moderate–Poor",
    identify_en: "Between clay and loam. Feels sticky when wet but not as plastic as pure clay. Forms a ribbon of about 3–4 cm. Moderate drainage. Good for crops that need moisture retention like sugarcane and vegetables.",
    identify_si: "මැටි සහ ලෝම් පස අතර ස්වභාවයකි. තෙත් විට ඇලෙන සුළු වුවත් පිරිසිදු මැටි තරම් ප්ලාස්ටික් බවක් නැත. ~3–4 cm පමණ පටියක් සෑදේ. ජලය බැස යාම මධ්‍යස්ථයි. උක් සහ එළවළු වැනි තෙතමනය රඳවා ගැනීම අවශ්‍ය බෝග සඳහා සුදුසුයි.",
    identify_ta: "களிமண்ணுக்கும் கலிமண்ணுக்கும் இடைப்பட்டது. ஈரத்தில் ஒட்டும், ஆனால் தூய களிமண் அளவுக்கு இழுபடாது. சுமார் 3–4 செ.மீ நாடா உருவாகும். நீர் வடிதல் மிதமானது. கரும்பு, காய்கறிகள் போன்ற ஈரப்பதம் தேவைப்படும் பயிர்களுக்கு நல்லது.",
  },
  {
    type: "Sandy Clay Loam",
    colour: "Light reddish-brown",
    colour_si: "ලා රතු-දුඹුරු",
    colour_ta: "வெளிர் சிவப்பு-பழுப்பு",
    texture: "Gritty yet slightly sticky",
    texture_si: "රළුයි, නමුත් මදක් ඇලෙයි",
    texture_ta: "கரடுமுரடு, ஆனால் சற்று ஒட்டும்",
    drainage: "Moderate",
    identify_en: "Gritty like sandy soil but also slightly sticky — a mix of all three particle sizes. Forms a weak ribbon of 2–3 cm. Versatile soil found in many Sri Lankan farming areas. Good all-round crop soil.",
    identify_si: "වැලි පස මෙන් රළු වුවත් මදක් ඇලෙන සුළුයි — අංශු ප්‍රමාණ තුනේම මිශ්‍රණයකි. 2–3 cm පමණ දුර්වල පටියක් සෑදේ. ශ්‍රී ලංකාවේ බොහෝ ගොවිතැන් ප්‍රදේශවල දක්නට ලැබෙන බහුකාර්ය පසකි. සියලු ආකාරයේ බෝග සඳහා පොදුවේ සුදුසුයි.",
    identify_ta: "மணல் போல் கரடுமுரடானது, ஆனால் சற்று ஒட்டும் — மூன்று துகள் அளவுகளின் கலவை. 2–3 செ.மீ பலவீனமான நாடா உருவாகும். இலங்கையின் பல விவசாயப் பகுதிகளில் காணப்படும் பல்துறை மண். பெரும்பாலான பயிர்களுக்கு ஏற்ற பொது மண்.",
  },
];

/** Drainage wording for the soil guide (the English value is the key). */
export const SOIL_DRAINAGE_LABELS = {
  si: { "Fast": "ඉක්මනින් බැස යයි", "Very fast": "ඉතා ඉක්මනින් බැස යයි", "Good": "හොඳයි", "Moderate": "මධ්‍යස්ථයි", "Moderate–Poor": "මධ්‍යස්ථ–දුර්වලයි", "Poor": "දුර්වලයි", "Variable": "වෙනස් වේ" },
  ta: { "Fast": "விரைவாக வடியும்", "Very fast": "மிக விரைவாக வடியும்", "Good": "நன்றாக வடியும்", "Moderate": "மிதமானது", "Moderate–Poor": "மிதமானது–மோசம்", "Poor": "மோசம்", "Variable": "மாறுபடும்" },
};
