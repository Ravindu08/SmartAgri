import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, saveAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';

const LOGIN_T = {
  en: {
    panelTitle: 'Welcome Back!',
    panelCopy: 'Login to your SmartAgri account and continue your journey towards smarter farming.',
    whoLabel: 'Who can register?',
    whoRoles: 'Traders and Land Owners can create an account.',
    formTitle: 'Login to SmartAgri',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    passLabel: 'Password',
    passPlaceholder: 'Your password',
    btnLogin: 'Login →',
    btnLoading: 'Signing in...',
    noAccount: "Don't have an account?",
    register: 'Register',
    backHome: 'Back to Home',
  },
  si: {
    panelTitle: 'නැවත සාදරයෙන් පිළිගනිමු!',
    panelCopy: 'SmartAgri ගිණුමට ලොගින් වී ස්මාර්ට් ගොවිතැන සඳහා ඔබේ ගමන දිගටම කරගෙන යන්න.',
    whoLabel: 'ලියාපදිංචි විය හැකි අය?',
    whoRoles: 'ව්‍යාපාරිකයන්ට සහ ඉඩම් හිමිකරුවන්ට ගිණුමක් සාදාගත හැකිය.',
    formTitle: 'SmartAgri ට ලොගින් කරන්න',
    emailLabel: 'ඊ-තැපැල් ලිපිනය',
    emailPlaceholder: 'you@example.com',
    passLabel: 'මුරපදය',
    passPlaceholder: 'ඔබේ මුරපදය',
    btnLogin: 'ලොගින් →',
    btnLoading: 'ලොගින් වෙමින්...',
    noAccount: 'ගිණුමක් නොමැතිද?',
    register: 'ලියාපදිංචිය',
    backHome: 'ආරම්භ පිටුවට',
  },
  ta: {
    panelTitle: 'மீண்டும் வரவேற்கிறோம்!',
    panelCopy: 'உங்கள் SmartAgri கணக்கில் உள்நுழைந்து சிறந்த விவசாயத்தை நோக்கிய பயணத்தை தொடருங்கள்.',
    whoLabel: 'யார் பதிவு செய்யலாம்?',
    whoRoles: 'வணிகர்கள் மற்றும் நில உரிமையாளர்கள் கணக்கை உருவாக்கலாம்.',
    formTitle: 'SmartAgri இல் உள்நுழையுங்கள்',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'you@example.com',
    passLabel: 'கடவுச்சொல்',
    passPlaceholder: 'உங்கள் கடவுச்சொல்',
    btnLogin: 'உள்நுழை →',
    btnLoading: 'உள்நுழைகிறது...',
    noAccount: 'கணக்கு இல்லையா?',
    register: 'பதிவு செய்க',
    backHome: 'முகப்பு பக்கத்திற்கு',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = LOGIN_T[lang] || LOGIN_T.en;
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const response = await loginUser(formData);
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
        {/* Left panel */}
        <div className="auth-split__left">
          <Link className="auth-logo" to="/">
            <span>🌿</span> <strong>Smart</strong>Agri
          </Link>
          <div className="auth-split__illustration">🌾</div>
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

        {/* Right panel - form */}
        <div className="auth-split__right">
          <h2 className="auth-form-title">{t.formTitle}</h2>
          <form className="auth-form-new" onSubmit={handleSubmit}>
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
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={t.passPlaceholder} required />
              </div>
            </label>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.btnLoading : t.btnLogin}
            </button>
            <div className="auth-links-row">
              <span>{t.noAccount} <Link to="/register">{t.register}</Link></span>
              <span>|</span>
              <Link to="/">{t.backHome}</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
