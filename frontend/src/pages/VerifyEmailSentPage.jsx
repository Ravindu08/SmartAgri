import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resendVerificationEmail } from '../services/api';

const T = {
  en: {
    title: 'Check your inbox',
    sub: 'We sent a verification link to',
    sub2: 'Click the link in the email to activate your account.',
    resendLabel: "Didn't receive it?",
    resendBtn: 'Resend email',
    resendOk: 'Email resent! Check your inbox.',
    resendErr: 'Could not resend. Please try again.',
    login: 'Back to Login',
  },
  si: {
    title: 'ඔබේ ඊ-තැපෑල පරීක්ෂා කරන්න',
    sub: 'අපි සත්‍යාපන සබැඳියක් යැව්වෙමු',
    sub2: 'ඔබේ ගිණුම සක්‍රිය කිරීමට ඊ-තැපෑලේ ඇති සබැඳිය ක්ලික් කරන්න.',
    resendLabel: 'නොලැබුණාද?',
    resendBtn: 'නැවත යවන්න',
    resendOk: 'ඊ-තැපෑල නැවත යැව්වා! ඔබේ ගිණුම් පෙට්ටිය පරීක්ෂා කරන්න.',
    resendErr: 'නැවත යැවීම අසාර්ථකයි. නැවත උත්සාහ කරන්න.',
    login: 'ලොගින් වෙත ආපසු',
  },
  ta: {
    title: 'உங்கள் மின்னஞ்சலை சரிபாருங்கள்',
    sub: 'நாங்கள் ஒரு சரிபார்ப்பு இணைப்பை அனுப்பினோம்',
    sub2: 'உங்கள் கணக்கை செயல்படுத்த மின்னஞ்சலில் உள்ள இணைப்பை கிளிக் செய்யுங்கள்.',
    resendLabel: 'பெறவில்லையா?',
    resendBtn: 'மீண்டும் அனுப்பு',
    resendOk: 'மின்னஞ்சல் மீண்டும் அனுப்பப்பட்டது!',
    resendErr: 'மீண்டும் அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    login: 'உள்நுழைவுக்கு திரும்பு',
  },
};

export default function VerifyEmailSentPage() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const location = useLocation();
  const email = location.state?.email || '';
  const [status, setStatus] = useState('idle'); // idle | sending | ok | err

  const handleResend = async () => {
    if (!email || status === 'sending') return;
    setStatus('sending');
    try {
      await resendVerificationEmail(email);
      setStatus('ok');
    } catch {
      setStatus('err');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/"><span>🌿</span> <strong>Smart</strong>Agri</Link>
          <div className="auth-split__illustration">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '140px', height: '140px' }}>
              <circle cx="80" cy="80" r="72" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              <rect x="32" y="54" width="96" height="66" rx="8" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
              <path d="M32 62 L80 96 L128 62" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none"/>
              <circle cx="110" cy="54" r="16" fill="#1a7a4a"/>
              <path d="M102 54 L108 60 L118 48" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="auth-split__title">{t.title}</h1>
          <p className="auth-split__copy">{t.sub2}</p>
        </div>

        <div className="auth-split__right">
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📧</div>
            <h2 className="auth-form-title" style={{ marginBottom: '12px' }}>{t.title}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '6px' }}>{t.sub}</p>
            {email && (
              <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '16px', wordBreak: 'break-all' }}>
                {email}
              </p>
            )}
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '32px' }}>{t.sub2}</p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '8px' }}>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>{t.resendLabel}</p>
              {status === 'ok' ? (
                <p style={{ color: 'var(--green-primary)', fontWeight: 500 }}>✓ {t.resendOk}</p>
              ) : status === 'err' ? (
                <p style={{ color: '#e53e3e' }}>⚠️ {t.resendErr}</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={status === 'sending' || !email}
                  style={{
                    background: 'none', border: '1.5px solid var(--green-primary)',
                    color: 'var(--green-primary)', borderRadius: '8px',
                    padding: '9px 24px', cursor: 'pointer', fontWeight: 600,
                    fontSize: '14px', opacity: status === 'sending' ? 0.6 : 1,
                  }}
                >
                  {status === 'sending' ? '...' : t.resendBtn}
                </button>
              )}
            </div>

            <div style={{ marginTop: '32px' }}>
              <Link to="/login" style={{ color: 'var(--green-primary)', fontWeight: 500, fontSize: '14px' }}>
                ← {t.login}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
