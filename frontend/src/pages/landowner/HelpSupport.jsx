import { useState } from 'react';

const FAQS = [
  {
    category: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'How do I add my first farm?',
        a: 'Go to My Farms in the sidebar and click "Add Farm". Fill in the farm name, location, district, size, soil type, and season, then submit. Your farm will appear on the dashboard immediately.',
      },
      {
        q: 'How do I start tracking a crop cultivation?',
        a: 'Navigate to My Cultivations and click "Start New Cultivation". Select a crop type, your planting date, and which farm to cultivate on. The system will generate a full task schedule automatically.',
      },
      {
        q: 'What is the difference between My Crops and My Cultivations?',
        a: 'My Crops shows all crops registered to your account and their status. My Cultivations is where you track daily/weekly farming activities — watering, fertilizing, pest checks — for each active crop.',
      },
    ],
  },
  {
    category: 'Farm Management',
    icon: '🌾',
    items: [
      {
        q: 'Can I upload a photo of my farm?',
        a: 'Yes. Open a farm from My Farms, click Edit, and use the image upload area. Images are stored securely and appear on your dashboard farm cards.',
      },
      {
        q: 'How do I delete a farm?',
        a: 'Open the farm from My Farms, scroll to the bottom of the edit page, and use the Delete Farm button. Note: deleting a farm will also remove all crops associated with it.',
      },
      {
        q: 'What does the district field do?',
        a: 'The district links your farm to local weather data. The system will use your farm\'s district to fetch weather forecasts and generate relevant farming advisories on your dashboard.',
      },
    ],
  },
  {
    category: 'Crop Tracking',
    icon: '📊',
    items: [
      {
        q: 'What do the task statuses mean?',
        a: '"Pending" — task is upcoming. "Done" — you have completed it. "Skipped" — deliberately skipped. "Overdue" — the scheduled date has passed without being done. Keep tasks up to date for accurate progress tracking.',
      },
      {
        q: 'Can I abandon a cultivation?',
        a: 'Yes. From My Crops, My Cultivations, or a crop\'s detail page, find the crop and click Abandon. This permanently deletes the crop and its tracking session — no record is kept. This action cannot be undone.',
      },
      {
        q: 'Why is my expected harvest date fixed at 120 days?',
        a: 'When you start a cultivation, the system uses a standard 120-day cycle as a default. You can edit the crop record afterward from My Crops → View → Edit to adjust the expected harvest date to match your actual crop variety.',
      },
    ],
  },
  {
    category: 'Weather & Advisories',
    icon: '🌦️',
    items: [
      {
        q: 'Where does the weather data come from?',
        a: 'SmartAgri uses Open-Meteo, a free and open-source weather API. It provides real-time conditions, 7-day forecasts, and historical seasonal data for all Sri Lankan districts — no API key required.',
      },
      {
        q: 'What do the dashboard warning notifications mean?',
        a: 'Red (Danger) — severe weather or overdue tasks requiring immediate attention. Amber (Warning) — conditions that could harm crops if ignored. Yellow (Risk) — elevated disease or stress risk. Purple (Task) — upcoming cultivation tasks in the next 7 days.',
      },
      {
        q: 'How do I get crop recommendations?',
        a: 'Use the Advisories section in the sidebar. Select your district, soil type, and season to receive AI-powered crop recommendations suited to your location and time of year.',
      },
    ],
  },
  {
    category: 'Account & Settings',
    icon: '⚙️',
    items: [
      {
        q: 'How do I change my password?',
        a: 'Go to Settings in the sidebar, click the Security tab, enter your current password, then set and confirm a new password. Passwords must be at least 8 characters.',
      },
      {
        q: 'How do I add or change my profile photo?',
        a: 'Go to Settings. On the user card at the top, click the 📷 camera icon to upload a new photo (max 2 MB). Click "Remove photo" to revert to the initials avatar.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Account tab → Delete Account. You will be asked to type "delete" to confirm. This permanently removes your account, farms, crops, and all data — it cannot be undone.',
      },
    ],
  },
];

const CONTACT_CHANNELS = [
  { icon: '📧', label: 'Email Support', value: 'support@smartagri.lk', detail: 'Response within 24 hours' },
  { icon: '📞', label: 'Hotline', value: '+94 11 234 5678', detail: 'Mon–Fri, 8 AM – 5 PM' },
  { icon: '💬', label: 'WhatsApp', value: '+94 77 123 4567', detail: 'Quick queries and photos' },
  { icon: '🏢', label: 'Regional Office', value: 'No. 48, Galle Road, Colombo 03', detail: 'Walk-in by appointment' },
];

export default function HelpSupport() {
  const [openFaq, setOpenFaq]   = useState(null);
  const [search,  setSearch]    = useState('');
  const [openCat, setOpenCat]   = useState(null);

  const toggle = key => setOpenFaq(prev => prev === key ? null : key);

  const filtered = FAQS.map(cat => ({
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
        <h1>❓ Help &amp; Support</h1>
        <p>Find answers to common questions, or reach out to our team.</p>
        <input
          className="help-search"
          type="text"
          placeholder="Search help articles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Quick links */}
      <div className="help-quicklinks">
        {FAQS.map(cat => (
          <button
            key={cat.category}
            className="help-quicklink"
            type="button"
            onClick={() => {
              setOpenCat(cat.category);
              document.getElementById(`help-cat-${cat.category}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <div className="help-no-results">No results for "{search}". Try different keywords.</div>
        ) : (
          filtered.map(cat => (
            <div key={cat.category} id={`help-cat-${cat.category}`} className="help-faq-category">
              <div className="help-faq-cat-header">
                <span>{cat.icon}</span>
                <h2>{cat.category}</h2>
              </div>
              <div className="help-faq-list">
                {cat.items.map((item, i) => {
                  const key = `${cat.category}-${i}`;
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
        <h2>📞 Contact Us</h2>
        <p className="help-contact-sub">Can't find what you're looking for? Get in touch directly.</p>
        <div className="help-contact-grid">
          {CONTACT_CHANNELS.map(ch => (
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
        <h3>ℹ️ System Information</h3>
        <div className="help-sysinfo-grid">
          <div><span>Platform</span><strong>SmartAgri Web v1.0</strong></div>
          <div><span>Weather Data</span><strong>Open-Meteo (open-meteo.com)</strong></div>
          <div><span>ML Service</span><strong>FastAPI + Scikit-learn</strong></div>
          <div><span>Support Hours</span><strong>Mon – Fri, 8 AM – 5 PM</strong></div>
        </div>
      </div>

    </section>
  );
}
