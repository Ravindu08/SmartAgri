import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useApp } from '../context/AppContext';

const REG_T = {
  en: {
    panelTitle: 'Join SmartAgri Today!',
    panelCopy: 'Create your account and unlock powerful tools, insights, and opportunities to grow better, together.',
    whoLabel: 'Who can register?',
    whoRoles: 'Traders and Land Owners can create an account. You can select both roles.',
    formTitle: 'Create Your Account',
    nameLabel: 'Full Name', namePlaceholder: 'Enter your full name',
    emailLabel: 'Email Address', emailPlaceholder: 'you@example.com',
    passLabel: 'Password', passPlaceholder: 'At least 8 characters',
    roleLabel: 'Register as (select one or both)',
    roleTrader: 'Trader', roleLandOwner: 'Land Owner',
    roleHint: 'Select at least one role.',
    btnRegister: 'Register →', btnLoading: 'Creating account...',
    hasAccount: 'Already have an account?', login: 'Login', backHome: 'Back to Home',
  },
  si: {
    panelTitle: 'අද SmartAgri හා සම්බන්ධ වන්න!',
    panelCopy: 'ගිණුමක් සාදා ගන්න සහ වඩා හොඳ ගොවිතැන සඳහා ශක්තිමත් මෙවලම් සහ අවස්ථා ලබාගන්න.',
    whoLabel: 'ලියාපදිංචි විය හැකි අය?',
    whoRoles: 'ව්‍යාපාරිකයන්ට සහ ඉඩම් හිමිකරුවන්ට ගිණුමක් සාදාගත හැකිය. භූමිකා දෙකම තෝරාගත හැකිය.',
    formTitle: 'ඔබේ ගිණුම සාදන්න',
    nameLabel: 'සම්පූර්ණ නම', namePlaceholder: 'ඔබේ නම ඇතුළත් කරන්න',
    emailLabel: 'ඊ-තැපැල් ලිපිනය', emailPlaceholder: 'you@example.com',
    passLabel: 'මුරපදය', passPlaceholder: 'අවම 8 අකුරු',
    roleLabel: 'ලෙස ලියාපදිංචි වන්න (එකක් හෝ දෙකම)',
    roleTrader: 'ව්‍යාපාරිකයා', roleLandOwner: 'ඉඩම් හිමිකරු',
    roleHint: 'අවම වශයෙන් භූමිකාවක් තෝරන්න.',
    btnRegister: 'ලියාපදිංචිය →', btnLoading: 'ගිණුම සාදමින්...',
    hasAccount: 'දැනටමත් ගිණුමක් ඇතිද?', login: 'ලොගින්', backHome: 'ආරම්භ පිටුවට',
  },
  ta: {
    panelTitle: 'இன்றே SmartAgri இல் சேருங்கள்!',
    panelCopy: 'கணக்கை உருவாக்கி சிறந்த விவசாயத்திற்கான சக்திவாய்ந்த கருவிகளையும் வாய்ப்புகளையும் பெறுங்கள்.',
    whoLabel: 'யார் பதிவு செய்யலாம்?',
    whoRoles: 'வணிகர்கள் மற்றும் நில உரிமையாளர்கள் கணக்கை உருவாக்கலாம். இரண்டு பாத்திரங்களையும் தேர்ந்தெடுக்கலாம்.',
    formTitle: 'உங்கள் கணக்கை உருவாக்குங்கள்',
    nameLabel: 'முழு பெயர்', namePlaceholder: 'உங்கள் பெயரை உள்ளிடுங்கள்',
    emailLabel: 'மின்னஞ்சல் முகவரி', emailPlaceholder: 'you@example.com',
    passLabel: 'கடவுச்சொல்', passPlaceholder: 'குறைந்தது 8 எழுத்துகள்',
    roleLabel: 'என்று பதிவு செய்யுங்கள் (ஒன்று அல்லது இரண்டும்)',
    roleTrader: 'வணிகர்', roleLandOwner: 'நில உரிமையாளர்',
    roleHint: 'குறைந்தது ஒரு பாத்திரத்தை தேர்ந்தெடுக்கவும்.',
    btnRegister: 'பதிவு செய் →', btnLoading: 'கணக்கை உருவாக்குகிறது...',
    hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?', login: 'உள்நுழை', backHome: 'முகப்பு பக்கத்திற்கு',
  },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = REG_T[lang] || REG_T.en;

  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [selectedRoles, setSelectedRoles] = useState(['Land Owner']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const toggleRole = (role) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.length > 1 ? prev.filter(r => r !== role) : prev;
      }
      return [...prev, role];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRoles.length === 0) { setError(t.roleHint); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const response = await registerUser({ ...formData, roles: selectedRoles });
      // Role-add on existing account, or auto-verified (EMAIL_ENABLED=false) — go straight to login
      if (response.message?.includes('Role added') || response.message?.includes('now log in')) {
        navigate('/login', { replace: true, state: { registered: true } });
        return;
      }
      // New registration — email verification required
      navigate('/verify-code', { replace: true, state: { email: formData.email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/"><span>🌿</span> <strong>Smart</strong>Agri</Link>
          <div className="auth-split__illustration">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'140px',height:'140px'}}>
              <circle cx="80" cy="80" r="72" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              <rect x="52" y="88" width="56" height="38" rx="3" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
              <polygon points="46,90 80,58 114,90" fill="#FBC02D" opacity="0.85"/>
              <rect x="72" y="104" width="16" height="22" rx="2" fill="rgba(255,255,255,0.30)" stroke="rgba(255,255,255,0.40)" strokeWidth="1"/>
              <rect x="56" y="96" width="12" height="10" rx="2" fill="rgba(251,192,45,0.50)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
              <rect x="92" y="96" width="12" height="10" rx="2" fill="rgba(251,192,45,0.50)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
              <line x1="42" y1="126" x2="42" y2="108" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
              <ellipse cx="42" cy="106" rx="5" ry="7" fill="#86efac" opacity="0.7"/>
              <line x1="118" y1="126" x2="118" y2="108" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
              <ellipse cx="118" cy="106" rx="5" ry="7" fill="#86efac" opacity="0.7"/>
              <circle cx="112" cy="42" r="11" fill="#FBC02D" opacity="0.9"/>
              <line x1="34" y1="126" x2="126" y2="126" stroke="rgba(255,255,255,0.22)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="auth-split__title">{t.panelTitle}</h1>
          <p className="auth-split__copy">{t.panelCopy}</p>
          <div className="auth-who-can">
            <span className="auth-who-can__icon">👥</span>
            <div>
              <div className="auth-who-can__label">{t.whoLabel}</div>
              <div className="auth-who-can__roles">{t.whoRoles}</div>
            </div>
          </div>
        </div>

        <div className="auth-split__right">
          <h2 className="auth-form-title">{t.formTitle}</h2>
          <form className="auth-form-new" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>{t.nameLabel}</span>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">👤</span>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder={t.namePlaceholder} required />
              </div>
            </label>
            <label className="auth-field">
              <span>{t.emailLabel}</span>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">📧</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t.emailPlaceholder} required />
              </div>
            </label>
            <label className="auth-field">
              <span>{t.passLabel}</span>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">🔒</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={t.passPlaceholder} minLength={8} required />
              </div>
            </label>

            {/* Dual-role checkboxes */}
            <div className="auth-field">
              <span>{t.roleLabel}</span>
              <div className="auth-role-toggle" style={{ gap: '10px' }}>
                {[
                  { role: 'Land Owner', icon: '🌾', label: t.roleLandOwner },
                  { role: 'Trader',     icon: '🏪', label: t.roleTrader },
                ].map(({ role, icon, label }) => {
                  const active = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      className={`auth-role-btn${active ? ' active' : ''}`}
                      onClick={() => toggleRole(role)}
                      style={{ position: 'relative' }}
                    >
                      {active && (
                        <span style={{
                          position: 'absolute', top: '6px', right: '8px',
                          fontSize: '11px', background: 'var(--green-primary)',
                          color: '#fff', borderRadius: '50%', width: '16px', height: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✓</span>
                      )}
                      {icon} {label}
                    </button>
                  );
                })}
              </div>
              {selectedRoles.length === 2 && (
                <p style={{ fontSize: '12px', color: 'var(--green-primary)', marginTop: '6px' }}>
                  ✓ Dual-role account — you can switch between both after login.
                </p>
              )}
            </div>

            {error && <div className="auth-error">⚠️ {error}</div>}
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.btnLoading : t.btnRegister}
            </button>
            <div className="auth-links-row">
              <span>{t.hasAccount} <Link to="/login">{t.login}</Link></span>
              <span>|</span>
              <Link to="/">{t.backHome}</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
