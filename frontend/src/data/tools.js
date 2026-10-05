// The four farm tools. One list drives the navbar, the tool switcher and the
// intro at the top of each tool page, so a tool's name, colour, icon and
// description stay the same everywhere.
//
// Only Crop Recommendation is a machine-learning model. The others are a
// knowledge guide, a calculator and live weather data, and are labelled as such.
import { Sprout, BookOpen, ChartLine, CloudSun } from 'lucide-react';

export const TOOLS = [
  {
    key: 'rec', path: '/crop-recommendation', Icon: Sprout, tone: 'green', tour: 'nav-crop-rec', ai: true,
    en: {
      name: 'Crop Recommendation', desc: 'Best crops for your soil and climate', q: 'What should I grow?', kind: 'AI model',
      title: 'Find the best crop for your land',
      what: 'A machine-learning model compares your soil, climate and season with thousands of Sri Lankan farm records and suggests the three crops most likely to do well.',
      steps: ['Choose your district', 'Describe your soil and season', 'Get three crops, with reasons'],
    },
    si: {
      name: 'බෝග නිර්දේශ', desc: 'ඔබේ පසට හා දේශගුණයට හොඳම බෝග', q: 'මම වගා කළ යුත්තේ කුමක්ද?', kind: 'AI ආකෘතිය',
      title: 'ඔබේ ඉඩමට හොඳම බෝගය සොයාගන්න',
      what: 'යන්ත්‍ර ඉගෙනුම් ආකෘතියක් ඔබේ පස, දේශගුණය සහ කන්නය ශ්‍රී ලංකාවේ ගොවිපළ වාර්තා දහස් ගණනක් සමඟ සසඳා, හොඳින්ම වැඩෙන්නට ඉඩ ඇති බෝග තුන යෝජනා කරයි.',
      steps: ['ඔබේ දිස්ත්‍රික්කය තෝරන්න', 'ඔබේ පස සහ කන්නය විස්තර කරන්න', 'හේතු සහිතව බෝග තුනක් ලබාගන්න'],
    },
    ta: {
      name: 'பயிர் பரிந்துரை', desc: 'உங்கள் மண் மற்றும் காலநிலைக்கு சிறந்த பயிர்கள்', q: 'நான் என்ன பயிரிட வேண்டும்?', kind: 'AI மாதிரி',
      title: 'உங்கள் நிலத்திற்கு சிறந்த பயிரைக் கண்டறியுங்கள்',
      what: 'ஒரு இயந்திரக் கற்றல் மாதிரி உங்கள் மண், காலநிலை மற்றும் பருவத்தை ஆயிரக்கணக்கான இலங்கை பண்ணைப் பதிவுகளுடன் ஒப்பிட்டு, சிறப்பாக வளரக்கூடிய மூன்று பயிர்களைப் பரிந்துரைக்கிறது.',
      steps: ['உங்கள் மாவட்டத்தைத் தேர்ந்தெடுங்கள்', 'உங்கள் மண் மற்றும் பருவத்தை விவரியுங்கள்', 'காரணங்களுடன் மூன்று பயிர்களைப் பெறுங்கள்'],
    },
  },
  {
    key: 'guide', path: '/crop-guidance', Icon: BookOpen, tone: 'teal', tour: 'nav-crop-guide',
    en: {
      name: 'Crop Guidance', desc: 'Step-by-step guide, planting to harvest', q: 'How do I grow it?', kind: 'Growing guide',
      title: 'Grow any crop, step by step',
      what: 'A complete guide for more than 40 crops: what to do at each growth stage, how to fertilise and water, and which pests and diseases to watch for.',
      steps: ['Pick a crop', 'Add your planting date', 'Follow today’s stage and tasks'],
    },
    si: {
      name: 'බෝග මාර්ගෝපදේශ', desc: 'සිටුවීමේ සිට අස්වැන්න දක්වා පියවරෙන් පියවර', q: 'එය වගා කරන්නේ කෙසේද?', kind: 'වගා මාර්ගෝපදේශය',
      title: 'ඕනෑම බෝගයක් පියවරෙන් පියවර වගා කරන්න',
      what: 'බෝග 40කට වඩා සඳහා සම්පූර්ණ මාර්ගෝපදේශයක්: එක් එක් වර්ධන අදියරේදී කළ යුතු දේ, පොහොර සහ ජලය යෙදීම, සහ අවධානය යොමු කළ යුතු පළිබෝධ හා රෝග.',
      steps: ['බෝගයක් තෝරන්න', 'සිටුවූ දිනය එක් කරන්න', 'අද අදියර සහ කාර්යයන් අනුගමනය කරන්න'],
    },
    ta: {
      name: 'பயிர் வழிகாட்டி', desc: 'நடவு முதல் அறுவடை வரை படிப்படியான வழிகாட்டி', q: 'அதை எப்படி வளர்ப்பது?', kind: 'வளர்ப்பு வழிகாட்டி',
      title: 'எந்தப் பயிரையும் படிப்படியாக வளர்க்கலாம்',
      what: '40க்கும் மேற்பட்ட பயிர்களுக்கான முழுமையான வழிகாட்டி: ஒவ்வொரு வளர்ச்சி நிலையிலும் செய்ய வேண்டியவை, உரமிடுதல் மற்றும் நீர்ப்பாசனம், கவனிக்க வேண்டிய பூச்சிகள் மற்றும் நோய்கள்.',
      steps: ['ஒரு பயிரைத் தேர்ந்தெடுங்கள்', 'நடவு தேதியைச் சேர்க்கவும்', 'இன்றைய நிலை மற்றும் பணிகளைப் பின்பற்றுங்கள்'],
    },
  },
  {
    key: 'yield', path: '/yield-price', Icon: ChartLine, tone: 'amber', tour: 'nav-yield-price',
    en: {
      name: 'Yield & Price', desc: 'Estimate harvest and a fair selling price', q: 'What will I earn?', kind: 'Calculator',
      title: 'Work out your harvest and a fair price',
      what: 'Enter your land and costs. It shows how much you can expect to harvest and the price per kg that covers every cost plus your profit.',
      steps: ['Pick your crop and land size', 'Add what you spend', 'See your price update live'],
    },
    si: {
      name: 'අස්වැන්න සහ මිල', desc: 'අස්වැන්න සහ සාධාරණ විකුණුම් මිල ඇස්තමේන්තු කරන්න', q: 'මට කොපමණ උපයා ගත හැකිද?', kind: 'ගණක යන්ත්‍රය',
      title: 'ඔබේ අස්වැන්න සහ සාධාරණ මිල ගණනය කරන්න',
      what: 'ඔබේ ඉඩම සහ පිරිවැය ඇතුළත් කරන්න. ඔබට අපේක්ෂා කළ හැකි අස්වැන්න සහ සියලු පිරිවැය හා ලාභය ආවරණය වන කිලෝවක මිල එය පෙන්වයි.',
      steps: ['බෝගය සහ ඉඩම් ප්‍රමාණය තෝරන්න', 'ඔබේ වියදම් එක් කරන්න', 'මිල සජීවීව යාවත්කාලීන වන අයුරු බලන්න'],
    },
    ta: {
      name: 'மகசூல் & விலை', desc: 'மகசூல் மற்றும் நியாயமான விற்பனை விலையை மதிப்பிடுங்கள்', q: 'நான் எவ்வளவு சம்பாதிப்பேன்?', kind: 'கணிப்பான்',
      title: 'உங்கள் மகசூலையும் நியாயமான விலையையும் கணக்கிடுங்கள்',
      what: 'உங்கள் நிலம் மற்றும் செலவுகளை உள்ளிடுங்கள். எதிர்பார்க்கக்கூடிய மகசூலையும், அனைத்து செலவுகளையும் லாபத்தையும் உள்ளடக்கும் ஒரு கிலோ விலையையும் இது காட்டும்.',
      steps: ['பயிரையும் நில அளவையும் தேர்ந்தெடுங்கள்', 'உங்கள் செலவுகளைச் சேர்க்கவும்', 'விலை உடனடியாகப் புதுப்பிக்கப்படுவதைப் பாருங்கள்'],
    },
  },
  {
    key: 'wx', path: '/wx', Icon: CloudSun, tone: 'sky', tour: 'nav-weather',
    en: {
      name: 'Weather', desc: 'Live forecast and farm advice by district', q: 'What is coming?', kind: 'Live data',
      title: 'Plan your week around the weather',
      what: 'Live conditions and a 7-day forecast for your district, with plain advice on when to spray, irrigate and harvest.',
      steps: ['Tap your district', 'Check the next 7 days', 'Follow today’s farm advice'],
    },
    si: {
      name: 'කාලගුණය', desc: 'දිස්ත්‍රික්කය අනුව සජීවී අනාවැකි සහ උපදෙස්', q: 'ඉදිරියට කුමක් වේද?', kind: 'සජීවී දත්ත',
      title: 'කාලගුණය අනුව ඔබේ සතිය සැලසුම් කරන්න',
      what: 'ඔබේ දිස්ත්‍රික්කය සඳහා සජීවී තත්ත්ව සහ දින 7ක අනාවැකිය, ඉසීම, ජලය යෙදීම සහ අස්වනු නෙළීම කළ යුතු වේලාව පිළිබඳ සරල උපදෙස් සමඟ.',
      steps: ['ඔබේ දිස්ත්‍රික්කය තට්ටු කරන්න', 'ඉදිරි දින 7 බලන්න', 'අද ගොවි උපදෙස් අනුගමනය කරන්න'],
    },
    ta: {
      name: 'வானிலை', desc: 'மாவட்ட வாரியான நேரடி முன்னறிவிப்பு மற்றும் ஆலோசனை', q: 'என்ன வரப்போகிறது?', kind: 'நேரடித் தரவு',
      title: 'வானிலைக்கு ஏற்ப உங்கள் வாரத்தைத் திட்டமிடுங்கள்',
      what: 'உங்கள் மாவட்டத்திற்கான நேரடி நிலைமைகள் மற்றும் 7 நாள் முன்னறிவிப்பு, எப்போது தெளிப்பது, நீர் பாய்ச்சுவது, அறுவடை செய்வது என்பதற்கான எளிய ஆலோசனையுடன்.',
      steps: ['உங்கள் மாவட்டத்தைத் தட்டவும்', 'அடுத்த 7 நாட்களைப் பாருங்கள்', 'இன்றைய பண்ணை ஆலோசனையைப் பின்பற்றுங்கள்'],
    },
  },
];

// Wording shared by every tool page.
export const TOOL_UI = {
  en: { group: 'Farm Tools', how: 'How it works', free: 'Free to use · no account needed', ai: 'AI' },
  si: { group: 'ගොවි මෙවලම්', how: 'එය ක්‍රියා කරන ආකාරය', free: 'නොමිලේ · ගිණුමක් අවශ්‍ය නැත', ai: 'AI' },
  ta: { group: 'பண்ணை கருவிகள்', how: 'இது எவ்வாறு செயல்படுகிறது', free: 'இலவசம் · கணக்கு தேவையில்லை', ai: 'AI' },
};

export const toolText = (tool, lang) => tool[lang] || tool.en;
export const toolUi = lang => TOOL_UI[lang] || TOOL_UI.en;
