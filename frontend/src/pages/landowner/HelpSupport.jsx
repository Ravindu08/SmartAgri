import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LAND_T, HELP_FAQS, HELP_CONTACT_CHANNELS } from '../../data/translations';

export default function HelpSupport() {
  const { lang }               = useApp();
  const t                      = LAND_T[lang] || LAND_T.en;
  const faqs                   = HELP_FAQS[lang] || HELP_FAQS.en;
  const contactChannels        = HELP_CONTACT_CHANNELS[lang] || HELP_CONTACT_CHANNELS.en;
  const [openFaq, setOpenFaq]  = useState(null);
  const [search,  setSearch]   = useState('');

  const toggle = key => setOpenFaq(prev => prev === key ? null : key);

  const filtered = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <section className="help-page">

      {/* Header */}
      <div className="help-hero">
        <h1>{t.helpTitle}</h1>
        <p>{t.helpSubtitle}</p>
        <input
          className="help-search"
          type="text"
          placeholder={t.helpSearchPh}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Quick links */}
      <div className="help-quicklinks">
        {faqs.map(cat => (
          <button
            key={cat.id}
            className="help-quicklink"
            type="button"
            onClick={() => {
              document.getElementById(`help-cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.category}</span>
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="help-faq-sections">
        {filtered.length === 0 ? (
          <div className="help-no-results">{t.helpNoResults(search)}</div>
        ) : (
          filtered.map(cat => (
            <div key={cat.id} id={`help-cat-${cat.id}`} className="help-faq-category">
              <div className="help-faq-cat-header">
                <span>{cat.icon}</span>
                <h2>{cat.category}</h2>
              </div>
              <div className="help-faq-list">
                {cat.items.map((item, i) => {
                  const key = `${cat.id}-${i}`;
                  const open = openFaq === key;
                  return (
                    <div key={key} className={`help-faq-item${open ? ' open' : ''}`}>
                      <button
                        className="help-faq-q"
                        type="button"
                        onClick={() => toggle(key)}
                      >
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

      {/* Contact channels */}
      <div className="help-contact-section">
        <h2>{t.helpContactTitle}</h2>
        <p className="help-contact-sub">{t.helpContactSub}</p>
        <div className="help-contact-grid">
          {contactChannels.map(ch => (
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

      {/* System info */}
      <div className="help-sysinfo">
        <h3>{t.helpSysInfoTitle}</h3>
        <div className="help-sysinfo-grid">
          <div><span>{t.helpSysInfoPlatform}</span><strong>SmartAgri Web v1.0</strong></div>
          <div><span>{t.helpSysInfoWeather}</span><strong>Open-Meteo (open-meteo.com)</strong></div>
          <div><span>{t.helpSysInfoML}</span><strong>FastAPI + Scikit-learn</strong></div>
          <div><span>{t.helpSysInfoHours}</span><strong>Mon – Fri, 8 AM – 5 PM</strong></div>
        </div>
      </div>

    </section>
  );
}
