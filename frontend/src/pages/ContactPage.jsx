import { useState } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/Contact.css';

const CONTACT_T = {
  en: {
    heroBadge: 'GET IN TOUCH',
    heroTitle: 'Contact Us',
    heroSub: "Have a question, feedback, or collaboration idea? We'd love to hear from you.",
    formTitle: 'Send us a message',
    nameLbl: 'Full Name', namePlaceholder: 'Your full name',
    emailLbl: 'Email Address', emailPlaceholder: 'you@example.com',
    subjectLbl: 'Subject', subjectPlaceholder: 'What is this regarding?',
    msgLbl: 'Message', msgPlaceholder: 'Tell us about your question, feedback, or idea...',
    btnSend: 'Send Message →', btnSending: 'Sending...',
    successTitle: 'Message Sent!',
    successSub: "Thank you for reaching out. We'll get back to you as soon as possible.",
    successBack: '← Send another message',
    infoTitle: 'Get In Touch',
    infoSub: "We're happy to hear from farmers, traders, and anyone interested in SmartAgri.",
    emailLabel: 'Email', emailVal: 'admin.smartagri@gmail.com',
    locationLabel: 'Location', locationVal: 'Sri Lanka',
    projectLabel: 'Response Time', projectVal: 'Within 24 hours',
    githubLabel: 'GitHub', githubVal: 'SmartAgri',
    socialTitle: 'Follow Us',
  },
  si: {
    heroBadge: 'සම්බන්ධ කරගන්න',
    heroTitle: 'සම්බන්ධ කරගන්න',
    heroSub: 'ප්‍රශ්නයක්, ප්‍රතිපෝෂණයක්, හෝ සහයෝගිතා අදහසක් ඇතිද? ඔබෙන් ඇසීමට සතුටු වෙමු.',
    formTitle: 'පණිවිඩ යවන්න',
    nameLbl: 'සම්පූර්ණ නම', namePlaceholder: 'ඔබේ සම්පූර්ණ නම',
    emailLbl: 'ඊ-තැපැල් ලිපිනය', emailPlaceholder: 'you@example.com',
    subjectLbl: 'විෂය', subjectPlaceholder: 'මෙය කුමක් ගැනද?',
    msgLbl: 'පණිවිඩය', msgPlaceholder: 'ඔබේ ප්‍රශ්නය, ප්‍රතිපෝෂණය, හෝ අදහස ගැන කියන්න...',
    btnSend: 'පණිවිඩ යවන්න →', btnSending: 'යවමින්...',
    successTitle: 'පණිවිඩය යවන ලදී!',
    successSub: 'සම්බන්ධ වීමට ස්තූතියි. හැකි ඉක්මනින් ඔබට ප්‍රතිචාර දක්වන්නෙමු.',
    successBack: '← තවත් පණිවිඩයක් යවන්න',
    infoTitle: 'සම්බන්ධ වන්න',
    infoSub: 'ගොවීන්, වෙළෙන්දන්, සහ SmartAgri ගැන ඕනෑ කෙනෙකු ඉදිරියෙන් ඇසීමට සතුටු වෙමු.',
    emailLabel: 'ඊ-තැපෑල', emailVal: 'admin.smartagri@gmail.com',
    locationLabel: 'ස්ථානය', locationVal: 'ශ්‍රී ලංකාව',
    projectLabel: 'ප්‍රතිචාර කාලය', projectVal: 'පැය 24ක් තුළ',
    githubLabel: 'GitHub', githubVal: 'SmartAgri',
    socialTitle: 'අනුගමනය කරන්න',
  },
  ta: {
    heroBadge: 'தொடர்பு கொள்ளுங்கள்',
    heroTitle: 'தொடர்பு கொள்ளுங்கள்',
    heroSub: 'கேள்வி, கருத்து அல்லது ஒத்துழைப்பு யோசனை உள்ளதா? உங்களிடமிருந்து கேட்க மகிழ்ச்சியாக இருக்கிறோம்.',
    formTitle: 'எங்களுக்கு ஒரு செய்தி அனுப்புங்கள்',
    nameLbl: 'முழு பெயர்', namePlaceholder: 'உங்கள் முழு பெயர்',
    emailLbl: 'மின்னஞ்சல் முகவரி', emailPlaceholder: 'you@example.com',
    subjectLbl: 'விஷயம்', subjectPlaceholder: 'இது என்னைப் பற்றியது?',
    msgLbl: 'செய்தி', msgPlaceholder: 'உங்கள் கேள்வி, கருத்து அல்லது யோசனையைப் பற்றி சொல்லுங்கள்...',
    btnSend: 'செய்தி அனுப்பு →', btnSending: 'அனுப்புகிறோம்...',
    successTitle: 'செய்தி அனுப்பப்பட்டது!',
    successSub: 'தொடர்பு கொண்டதற்கு நன்றி. முடிந்தவரை விரைவாக திரும்பி வருவோம்.',
    successBack: '← மற்றொரு செய்தி அனுப்பு',
    infoTitle: 'தொடர்பு கொள்ளுங்கள்',
    infoSub: 'விவசாயிகள், வர்த்தகர்கள் மற்றும் SmartAgri இல் ஆர்வமுள்ள எவரிடமிருந்தும் கேட்க மகிழ்ச்சியாக இருக்கிறோம்.',
    emailLabel: 'மின்னஞ்சல்', emailVal: 'admin.smartagri@gmail.com',
    locationLabel: 'இடம்', locationVal: 'இலங்கை',
    projectLabel: 'பதில் நேரம்', projectVal: '24 மணி நேரத்திற்குள்',
    githubLabel: 'GitHub', githubVal: 'SmartAgri',
    socialTitle: 'எங்களைப் பின்தொடருங்கள்',
  },
};

export default function ContactPage() {
  const { lang } = useApp();
  const t = CONTACT_T[lang] || CONTACT_T.en;
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setSending(true);
    const subject = encodeURIComponent(form.subject || 'SmartAgri Contact');
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:admin.smartagri@gmail.com?subject=${subject}&body=${body}`;
    setTimeout(() => { setSending(false); setSent(true); }, 1000);
  };

  const handleReset = () => { setForm({ name: '', email: '', subject: '', message: '' }); setSent(false); };

  return (
    <div className="page-wrapper">
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-inner">
          <div className="contact-hero-badge">✉️ {t.heroBadge}</div>
          <h1 className="contact-hero-title">{t.heroTitle}</h1>
          <p className="contact-hero-sub">{t.heroSub}</p>
        </div>
      </div>
      <div className="contact-hero-wave" />

      <div className="contact-body">
        <div className="contact-grid">
          {/* ── Form ── */}
          <div className="contact-form-section">
            <h2 className="contact-form-title">{t.formTitle}</h2>
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon">✅</div>
                <h3>{t.successTitle}</h3>
                <p>{t.successSub}</p>
                <button className="contact-reset-btn" onClick={handleReset}>{t.successBack}</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-field">
                  <label htmlFor="c-name">{t.nameLbl}</label>
                  <input id="c-name" name="name" type="text" placeholder={t.namePlaceholder} value={form.name} onChange={handleChange} required />
                </div>
                <div className="contact-field">
                  <label htmlFor="c-email">{t.emailLbl}</label>
                  <input id="c-email" name="email" type="email" placeholder={t.emailPlaceholder} value={form.email} onChange={handleChange} required />
                </div>
                <div className="contact-field">
                  <label htmlFor="c-subject">{t.subjectLbl}</label>
                  <input id="c-subject" name="subject" type="text" placeholder={t.subjectPlaceholder} value={form.subject} onChange={handleChange} required />
                </div>
                <div className="contact-field">
                  <label htmlFor="c-message">{t.msgLbl}</label>
                  <textarea id="c-message" name="message" placeholder={t.msgPlaceholder} rows={5} value={form.message} onChange={handleChange} required />
                </div>
                <button type="submit" className="contact-submit-btn" disabled={sending}>
                  {sending ? t.btnSending : t.btnSend}
                </button>
              </form>
            )}
          </div>

          {/* ── Info ── */}
          <div className="contact-info-section">
            <h2 className="contact-info-title">{t.infoTitle}</h2>
            <p className="contact-info-sub">{t.infoSub}</p>

            <div className="contact-info-cards">
              <a href="mailto:admin.smartagri@gmail.com" className="contact-info-card">
                <div className="contact-info-icon">📧</div>
                <div>
                  <div className="contact-info-label">{t.emailLabel}</div>
                  <div className="contact-info-val">{t.emailVal}</div>
                </div>
              </a>
              <div className="contact-info-card">
                <div className="contact-info-icon">📍</div>
                <div>
                  <div className="contact-info-label">{t.locationLabel}</div>
                  <div className="contact-info-val">{t.locationVal}</div>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-icon">⏱️</div>
                <div>
                  <div className="contact-info-label">{t.projectLabel}</div>
                  <div className="contact-info-val">{t.projectVal}</div>
                </div>
              </div>
              <div className="contact-info-card">
                <div className="contact-info-icon">💻</div>
                <div>
                  <div className="contact-info-label">{t.githubLabel}</div>
                  <div className="contact-info-val">{t.githubVal}</div>
                </div>
              </div>
            </div>

            <p className="contact-social-title">{t.socialTitle}</p>
            <div className="contact-social-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="contact-social-link contact-social-link--gh">
                <span>GH</span><span>GitHub</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="contact-social-link contact-social-link--li">
                <span>in</span><span>LinkedIn</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="contact-social-link contact-social-link--tw">
                <span>𝕏</span><span>Twitter</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
