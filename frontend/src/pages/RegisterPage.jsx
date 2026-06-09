import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, saveAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';

const REG_T = {
  en: {
    panelTitle: 'Join SmartAgri Today!',
    panelCopy: 'Create your account and unlock powerful tools, insights, and opportunities to grow better, together.',
    whoLabel: 'Who can register?',
    whoRoles: 'Traders and Land Owners can create an account.',
    formTitle: 'Create Your Account',
    nameLabel: 'Full Name', namePlaceholder: 'Enter your full name',
    emailLabel: 'Email Address', emailPlaceholder: 'you@example.com',
    passLabel: 'Password', passPlaceholder: 'At least 8 characters',
    roleLabel: 'Register as',
    roleTrader: 'Trader',
    roleLandOwner: 'Land Owner',
    btnRegister: 'Register →',
    btnLoading: 'Creating account...',
    hasAccount: 'Already have an account?',
    login: 'Login',
    backHome: 'Back to Home',
  },
  si: {
    panelTitle: 'අද SmartAgri හා සම්බන්ධ වන්න!',
    panelCopy: 'ගිණුමක් සාදා ගන්න සහ වඩා හොඳ ගොවිතැන සඳහා ශක්තිමත් මෙවලම් සහ අවස්ථා ලබාගන්න.',
    whoLabel: 'ලියාපදිංචි විය හැකි අය?',
    whoRoles: 'ව්‍යාපාරිකයන්ට සහ ඉඩම් හිමිකරුවන්ට ගිණුමක් සාදාගත හැකිය.',
    formTitle: 'ඔබේ ගිණුම සාදන්න',
    nameLabel: 'සම්පූර්ණ නම', namePlaceholder: 'ඔබේ නම ඇතුළත් කරන්න',
    emailLabel: 'ඊ-තැපැල් ලිපිනය', emailPlaceholder: 'you@example.com',
    passLabel: 'මුරපදය', passPlaceholder: 'අවම 8 අකුරු',
    roleLabel: 'ලෙස ලියාපදිංචි වන්න',
    roleTrader: 'ව්‍යාපාරිකයා',
    roleLandOwner: 'ඉඩම් හිමිකරු',
    btnRegister: 'ලියාපදිංචිය →',
    btnLoading: 'ගිණුම සාදමින්...',
    hasAccount: 'දැනටමත් ගිණුමක් ඇතිද?',
    login: 'ලොගින්',
    backHome: 'ආරම්භ පිටුවට',
  },
  ta: {
    panelTitle: 'இன்றே SmartAgri இல் சேருங்கள்!',
    panelCopy: 'கணக்கை உருவாக்கி சிறந்த விவசாயத்திற்கான சக்திவாய்ந்த கருவிகளையும் வாய்ப்புகளையும் பெறுங்கள்.',
    whoLabel: 'யார் பதிவு செய்யலாம்?',
    whoRoles: 'வணிகர்கள் மற்றும் நில உரிமையாளர்கள் கணக்கை உருவாக்கலாம்.',
    formTitle: 'உங்கள் கணக்கை உருவாக்குங்கள்',
    nameLabel: 'முழு பெயர்', namePlaceholder: 'உங்கள் பெயரை உள்ளிடுங்கள்',
    emailLabel: 'மின்னஞ்சல் முகவரி', emailPlaceholder: 'you@example.com',
    passLabel: 'கடவுச்சொல்', passPlaceholder: 'குறைந்தது 8 எழுத்துகள்',
    roleLabel: 'என்று பதிவு செய்யுங்கள்',
    roleTrader: 'வணிகர்',
    roleLandOwner: 'நில உரிமையாளர்',
    btnRegister: 'பதிவு செய் →',
    btnLoading: 'கணக்கை உருவாக்குகிறது...',
    hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    login: 'உள்நுழை',
    backHome: 'முகப்பு பக்கத்திற்கு',
  },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = REG_T[lang] || REG_T.en;
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Trader',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await registerUser(formData);
      saveAuthSession(response);
      navigate(response.redirect_to, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/">
            <span>🌿</span> <strong>Smart</strong>Agri
          </Link>
          <div className="auth-split__illustration">🤝</div>
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
            <label className="auth-field">
              <span>{t.roleLabel}</span>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="Trader">{t.roleTrader}</option>
                <option value="Land Owner">{t.roleLandOwner}</option>
              </select>
            </label>
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
