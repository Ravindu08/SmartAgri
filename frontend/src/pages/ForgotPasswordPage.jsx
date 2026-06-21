import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { forgotPassword } from '../services/api';

const T = {
  en: {
    panelTitle: 'Forgot your password?',
    panelCopy: "No worries — enter your email and we'll send you a reset link.",
    formTitle: 'Reset Password',
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@example.com',
    btnSend: 'Send Reset Link',
    btnLoading: 'Sending…',
    successTitle: 'Check your inbox',
    successSub: 'If that email belongs to a verified account, a password reset link has been sent.',
    backLogin: 'Back to Login',
  },
  si: {
    panelTitle: 'මුරපදය අමතකද?',
    panelCopy: 'කරදර නොවන්න — ඔබේ ඊ-තැපෑල ඇතුළත් කරන්න, අපි නැවත සකස් කිරීමේ සබැඳියක් යවන්නෙමු.',
    formTitle: 'මුරපදය නැවත සකස් කරන්න',
    emailLabel: 'ඊ-තැපැල් ලිපිනය',
    emailPlaceholder: 'you@example.com',
    btnSend: 'නැවත සකස් කිරීමේ සබැඳිය යවන්න',
    btnLoading: 'යවමින්…',
    successTitle: 'ඔබේ ඊ-තැපෑල පරීක්ෂා කරන්න',
    successSub: 'ඒ ඊ-තැපෑල සත්‍යාපිත ගිණුමකට අයත් නම්, මුරපද නැවත සකස් කිරීමේ සබැඳියක් යැව්වා.',
    backLogin: 'ලොගින් වෙත ආපසු',
  },
  ta: {
    panelTitle: 'கடவுச்சொல் மறந்துவிட்டீர்களா?',
    panelCopy: 'கவலைப்படாதீர்கள் — உங்கள் மின்னஞ்சலை உள்ளிடுங்கள், நாங்கள் மீட்டமைப்பு இணைப்பை அனுப்புவோம்.',
    formTitle: 'கடவுச்சொல்லை மீட்டமை',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'you@example.com',
    btnSend: 'மீட்டமைப்பு இணைப்பை அனுப்பு',
    btnLoading: 'அனுப்புகிறது…',
    successTitle: 'உங்கள் மின்னஞ்சலை சரிபாருங்கள்',
    successSub: 'அந்த மின்னஞ்சல் சரிபார்க்கப்பட்ட கணக்கிற்கு சொந்தமானதாக இருந்தால், கடவுச்சொல் மீட்டமைப்பு இணைப்பு அனுப்பப்பட்டுள்ளது.',
    backLogin: 'உள்நுழைவுக்கு திரும்பு',
  },
};

export default function ForgotPasswordPage() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await forgotPassword(email);
      setStatus('done');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/"><span>🌿</span> <strong>Smart</strong>Agri</Link>
          <div className="auth-split__illustration">
            <div style={{ fontSize: '80px', marginTop: '32px' }}>🔑</div>
          </div>
          <h1 className="auth-split__title">{t.panelTitle}</h1>
          <p className="auth-split__copy">{t.panelCopy}</p>
        </div>

        <div className="auth-split__right">
          {status === 'done' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>📧</div>
              <h2 className="auth-form-title" style={{ marginBottom: '12px' }}>{t.successTitle}</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>{t.successSub}</p>
              <Link to="/login" style={{ color: 'var(--green-primary)', fontWeight: 500 }}>
                ← {t.backLogin}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="auth-form-title">{t.formTitle}</h2>
              <form className="auth-form-new" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>{t.emailLabel}</span>
                  <div className="auth-field__input-wrap">
                    <span className="auth-field__icon">📧</span>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder} required
                    />
                  </div>
                </label>
                {error && <div className="auth-error">⚠️ {error}</div>}
                <button className="auth-submit-btn" type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? t.btnLoading : t.btnSend}
                </button>
                <div className="auth-links-row">
                  <Link to="/login">← {t.backLogin}</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
