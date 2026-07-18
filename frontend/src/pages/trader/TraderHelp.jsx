import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LAND_T, TRADER_HELP_FAQS, HELP_CONTACT_CHANNELS } from '../../data/translations';
import SpotlightTour   from '../../components/tour/SpotlightTour';
import useAutoOpenOnce from '../../components/tour/useAutoOpenOnce';
import HelpButton      from '../../components/tour/HelpButton';

const TRHS_TOUR_T = {
  en: {
    steps: [
      { target: 'tr-help-search', title: 'Search for an answer', body: 'Type any keyword to filter the FAQ down to what you need.' },
      { target: 'tr-help-contact', title: 'Still stuck?', body: 'Reach us directly through any of these contact channels.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'tr-help-search', title: 'පිළිතුරක් සොයන්න', body: 'ඔබට අවශ්‍ය දේට FAQ පෙරහන් කිරීමට ඕනෑම මූලපදයක් ටයිප් කරන්න.' },
      { target: 'tr-help-contact', title: 'තවමත් අතරමං ද?', body: 'මෙම සම්බන්ධතා නාලිකා ඕනෑම එකකින් අප හා සෘජුව සම්බන්ධ වන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'tr-help-search', title: 'பதிலைத் தேடுங்கள்', body: 'உங்களுக்குத் தேவையானதற்கு FAQ-ஐ வடிகட்ட எந்த முக்கிய வார்த்தையையும் தட்டச்சு செய்யுங்கள்.' },
      { target: 'tr-help-contact', title: 'இன்னும் சிக்கலா?', body: 'இந்த தொடர்பு வழிகள் மூலம் நேரடியாக எங்களைத் தொடர்பு கொள்ளுங்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

export default function TraderHelp() {
  const { lang }   = useApp();
  const t          = LAND_T[lang] || LAND_T.en;
  const trhsTourT = TRHS_TOUR_T[lang] || TRHS_TOUR_T.en;
  const [tourOpen, setTourOpen] = useAutoOpenOnce('sa_tour_trhelp_seen_v1', true);
  const faqs       = TRADER_HELP_FAQS[lang] || TRADER_HELP_FAQS.en;
  const channels   = HELP_CONTACT_CHANNELS[lang] || HELP_CONTACT_CHANNELS.en;
  const [openFaq, setOpenFaq] = useState(null);
  const [search,  setSearch]  = useState('');

  const toggle   = key => setOpenFaq(prev => prev === key ? null : key);
  const filtered = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <section className="help-page">
      <div className="help-hero">
        <h1>{t.helpTitle}</h1>
        <p>{t.helpSubtitle}</p>
        <input
          className="help-search"
          type="text"
          placeholder={t.helpSearchPh}
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-tour="tr-help-search"
        />
      </div>

      <div className="help-quicklinks" data-tour="tr-help-quicklinks">
        {faqs.map(cat => (
          <button
            key={cat.id}
            className="help-quicklink"
            type="button"
            onClick={() => document.getElementById(`help-cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <span>{cat.icon}</span>
            <span>{cat.category}</span>
          </button>
        ))}
      </div>

      <div className="help-faq-sections">
        {filtered.length === 0 ? (
          <div className="help-no-results">{t.helpNoResults(search)}</div>
        ) : (
          filtered.map((cat, ci) => (
            <div key={cat.id} id={`help-cat-${cat.id}`} className="help-faq-category" data-tour={ci === 0 ? 'tr-help-faq-first' : undefined}>
              <div className="help-faq-cat-header">
                <span>{cat.icon}</span>
                <h2>{cat.category}</h2>
              </div>
              <div className="help-faq-list">
                {cat.items.map((item, i) => {
                  const key  = `${cat.id}-${i}`;
                  const open = openFaq === key;
                  return (
                    <div key={key} className={`help-faq-item${open ? ' open' : ''}`}>
                      <button className="help-faq-q" type="button" onClick={() => toggle(key)}>
                        <span>{item.q}</span>
                        <span className="help-faq-chevron">{open ? '▲' : '▼'}</span>
                      </button>
                      {open && <div className="help-faq-a">{item.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="help-contact-section" data-tour="tr-help-contact">
        <h2>{t.helpContactTitle}</h2>
        <p className="help-contact-sub">{t.helpContactSub}</p>
        <div className="help-contact-grid">
          {channels.map(ch => (
            <div key={ch.label} className="help-contact-card">
              <span className="help-contact-icon">{ch.icon}</span>
              <div>
                <strong>{ch.label}</strong>
                <div className="help-contact-value">{ch.value}</div>
                <div className="help-contact-detail">{ch.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="help-sysinfo">
        <h3>{t.helpSysInfoTitle}</h3>
        <div className="help-sysinfo-grid">
          <div><span>{t.helpSysInfoPlatform}</span><strong>SmartAgri Web v1.0</strong></div>
          <div><span>{t.helpSysInfoWeather}</span><strong>Open-Meteo (open-meteo.com)</strong></div>
          <div><span>{t.helpSysInfoML}</span><strong>FastAPI + Scikit-learn</strong></div>
          <div><span>{t.helpSysInfoHours}</span><strong>Mon – Fri, 8 AM – 5 PM</strong></div>
        </div>
      </div>

      <HelpButton label={trhsTourT.needHelp} ariaLabel={trhsTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={trhsTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey="sa_tour_trhelp_seen_v1"
        labels={{ next: trhsTourT.next, back: trhsTourT.back, skip: trhsTourT.skip, done: trhsTourT.done }}
      />
    </section>
  );
}
