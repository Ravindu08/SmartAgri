import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { verifyEmail } from '../services/api';

const T = {
  en: {
    verifying: 'Verifying your email…',
    successTitle: 'Email verified!',
    successSub: 'Your account is now active. You can log in.',
    errorTitle: 'Verification failed',
    errorSub: 'This link is invalid or has already been used.',
    noToken: 'No verification token found in the URL.',
    btnLogin: 'Go to Login',
  },
  si: {
    verifying: 'ඔබේ ඊ-තැපෑල සත්‍යාපනය කරමින්…',
    successTitle: 'ඊ-තැපෑල සත්‍යාපනය විය!',
    successSub: 'ඔබේ ගිණුම දැන් සක්‍රියය. ලොගින් විය හැකිය.',
    errorTitle: 'සත්‍යාපනය අසාර්ථකයි',
    errorSub: 'මෙම සබැඳිය වලංගු නැත හෝ දැනටමත් භාවිතා කර ඇත.',
    noToken: 'URL හි සත්‍යාපන ටෝකනයක් හමු නොවීය.',
    btnLogin: 'ලොගින් වෙත යන්න',
  },
  ta: {
    verifying: 'உங்கள் மின்னஞ்சலை சரிபார்க்கிறது…',
    successTitle: 'மின்னஞ்சல் சரிபார்க்கப்பட்டது!',
    successSub: 'உங்கள் கணக்கு இப்போது செயலில் உள்ளது. உள்நுழையலாம்.',
    errorTitle: 'சரிபார்ப்பு தோல்வியடைந்தது',
    errorSub: 'இந்த இணைப்பு தவறானது அல்லது ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது.',
    noToken: 'URL இல் சரிபார்ப்பு டோக்கன் இல்லை.',
    btnLogin: 'உள்நுழைவுக்கு செல்லுங்கள்',
  },
};

export default function VerifyEmailPage() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState('loading'); // loading | success | error
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return; // StrictMode guard — only call API once
    called.current = true;
    if (!token) { setState('error'); return; }
    verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/"><span>🌿</span> <strong>Smart</strong>Agri</Link>
          <div className="auth-split__illustration" style={{ marginTop: '40px' }}>
            <div style={{ fontSize: '80px' }}>
              {state === 'loading' ? '⏳' : state === 'success' ? '✅' : '❌'}
            </div>
          </div>
          <h1 className="auth-split__title" style={{ marginTop: '16px' }}>
            {state === 'loading' ? t.verifying : state === 'success' ? t.successTitle : t.errorTitle}
          </h1>
        </div>

        <div className="auth-split__right">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {state === 'loading' && (
              <>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <p style={{ color: 'var(--muted)' }}>{t.verifying}</p>
              </>
            )}
            {state === 'success' && (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                <h2 className="auth-form-title" style={{ color: 'var(--green-primary)', marginBottom: '12px' }}>
                  {t.successTitle}
                </h2>
                <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>{t.successSub}</p>
                <Link to="/login" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                  {t.btnLogin}
                </Link>
              </>
            )}
            {state === 'error' && (
              <>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
                <h2 className="auth-form-title" style={{ color: '#e53e3e', marginBottom: '12px' }}>
                  {t.errorTitle}
                </h2>
                <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>
                  {token ? t.errorSub : t.noToken}
                </p>
                <Link to="/login" style={{ color: 'var(--green-primary)', fontWeight: 500 }}>
                  ← {t.btnLogin}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
