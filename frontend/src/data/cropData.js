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
 * Quick soil identification guide for farmers.
 * Covers the 10 most common soil types across Sri Lankan agricultural zones.
 */
export const SOIL_GUIDE_ROWS = [
  { type: "Sandy Loam",          colour: "Light brown / reddish-brown",  texture: "Gritty feel; crumbles easily when dry",      drainage: "Fast" },
  { type: "Red-Brown Earth",     colour: "Deep red or rust-brown",       texture: "Firm, slightly sticky when wet",              drainage: "Moderate" },
  { type: "Reddish-Brown Earth", colour: "Reddish-brown",                texture: "Moderately sticky; holds shape when squeezed",drainage: "Moderate" },
  { type: "Clay Soil",           colour: "Grey to dark brown",           texture: "Very sticky and plastic when wet; cracks when dry", drainage: "Poor" },
  { type: "Loam",                colour: "Dark brown",                   texture: "Smooth yet slightly gritty; ribbons 2–3 cm",  drainage: "Good" },
  { type: "Sandy Soil",          colour: "Light tan / pale brown",       texture: "Very gritty; falls apart immediately",        drainage: "Very fast" },
  { type: "Alluvial",            colour: "Grey-brown to dark brown",     texture: "Silky / smooth; deposited near rivers",       drainage: "Variable" },
  { type: "Lateritic Soil",      colour: "Bright red to orange-red",     texture: "Hard when dry; crumbles into small lumps",    drainage: "Fast" },
  { type: "Organic-Rich Loam",   colour: "Very dark brown / black",      texture: "Spongy; strong earthy smell",                 drainage: "Good" },
  { type: "Silt Loam",           colour: "Grey to light brown",          texture: "Silky, floury feel; ribbons 2 cm",            drainage: "Moderate" },
];
