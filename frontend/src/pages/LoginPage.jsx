import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, saveAuthSession, resendVerificationEmail } from '../services/api';
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
    forgotPassword: 'Forgot password?',
    btnLogin: 'Login →',
    btnLoading: 'Signing in...',
    noAccount: "Don't have an account?",
    register: 'Register',
    backHome: 'Back to Home',
    errLoginFailed: 'Incorrect email or password',
    errNotVerified: 'Please verify your email before logging in. Check your inbox.',
    resendVerification: 'Resend verification email',
    resendOk: 'Verification email resent!',
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
    forgotPassword: 'මුරපදය අමතකද?',
    btnLogin: 'ලොගින් →',
    btnLoading: 'ලොගින් වෙමින්...',
    noAccount: 'ගිණුමක් නොමැතිද?',
    register: 'ලියාපදිංචිය',
    backHome: 'ආරම්භ පිටුවට',
    errLoginFailed: 'ඊ-තැපැල් ලිපිනය හෝ මුරපදය වැරදිය',
    errNotVerified: 'ලොගින් වීමට පෙර ඔබේ ඊ-තැපෑල සත්‍යාපනය කරන්න.',
    resendVerification: 'සත්‍යාපන ඊ-තැපෑල නැවත යවන්න',
    resendOk: 'සත්‍යාපන ඊ-තැපෑල නැවත යැව්වා!',
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
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    btnLogin: 'உள்நுழை →',
    btnLoading: 'உள்நுழைகிறது...',
    noAccount: 'கணக்கு இல்லையா?',
    register: 'பதிவு செய்க',
    backHome: 'முகப்பு பக்கத்திற்கு',
    errLoginFailed: 'மின்னஞ்சல் முகவரி அல்லது கடவுச்சொல் தவறானது',
    errNotVerified: 'உள்நுழைவதற்கு முன் உங்கள் மின்னஞ்சலை சரிபாருங்கள்.',
    resendVerification: 'சரிபார்ப்பு மின்னஞ்சலை மீண்டும் அனுப்பு',
    resendOk: 'சரிபார்ப்பு மின்னஞ்சல் மீண்டும் அனுப்பப்பட்டது!',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = LOGIN_T[lang] || LOGIN_T.en;
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isNotVerified, setIsNotVerified] = useState(false);
  const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | ok
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setIsNotVerified(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsNotVerified(false);
    setIsSubmitting(true);

    try {
      const response = await loginUser(formData);
      saveAuthSession(response);
      navigate(response.redirect_to, { replace: true });
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setIsNotVerified(true);
      } else {
        setError(t.errLoginFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!formData.email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await resendVerificationEmail(formData.email);
      setResendStatus('ok');
    } catch {
      setResendStatus('idle');
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
          <div className="auth-split__illustration">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'140px',height:'140px'}}>
              <circle cx="80" cy="80" r="72" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              <circle cx="110" cy="38" r="14" fill="#FBC02D" opacity="0.9"/>
              <ellipse cx="80" cy="130" rx="54" ry="10" fill="rgba(255,255,255,0.12)"/>
              <line x1="80" y1="128" x2="80" y2="60" stroke="#86efac" strokeWidth="3" strokeLinecap="round"/>
              <ellipse cx="80" cy="52" rx="6" ry="12" fill="#FBC02D" opacity="0.95"/>
              <ellipse cx="73" cy="58" rx="5" ry="10" fill="#FBC02D" opacity="0.85" transform="rotate(-20 73 58)"/>
              <ellipse cx="87" cy="58" rx="5" ry="10" fill="#FBC02D" opacity="0.85" transform="rotate(20 87 58)"/>
              <ellipse cx="68" cy="67" rx="4" ry="8" fill="#FBC02D" opacity="0.7" transform="rotate(-30 68 67)"/>
              <ellipse cx="92" cy="67" rx="4" ry="8" fill="#FBC02D" opacity="0.7" transform="rotate(30 92 67)"/>
              <path d="M80 100 Q60 88 55 72" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M80 90 Q100 78 105 62" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <line x1="52" y1="128" x2="108" y2="128" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="60" y1="133" x2="100" y2="133" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t.passLabel}</span>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: 500 }}>
                  {t.forgotPassword}
                </Link>
              </div>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">🔒</span>
                <input type={showPw ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder={t.passPlaceholder} required style={{ paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </label>

            {error && <div className="auth-error">⚠️ {error}</div>}

            {isNotVerified && (
              <div className="auth-error" style={{ background: 'rgba(234,179,8,0.12)', borderColor: '#ca8a04', color: '#92400e' }}>
                <p style={{ margin: '0 0 8px' }}>⚠️ {t.errNotVerified}</p>
                {resendStatus === 'ok' ? (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--green-primary)' }}>✓ {t.resendOk}</p>
                ) : (
                  <button type="button" onClick={handleResend} disabled={resendStatus === 'sending'}
                    style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, textDecoration: 'underline', padding: 0 }}>
                    {resendStatus === 'sending' ? '...' : t.resendVerification}
                  </button>
                )}
              </div>
            )}

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
