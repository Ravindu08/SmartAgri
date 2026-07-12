import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resendVerificationEmail, verifyEmail } from '../services/api';

const T = {
  en: {
    title: 'Verify your email',
    sent: 'We sent a 6-digit code to',
    instruction: 'Enter the code below to activate your account.',
    expires: 'The code expires in 10 minutes.',
    btnVerify: 'Verify', btnVerifying: 'Verifying…',
    successTitle: 'Email verified!',
    successSub: 'Your account is active. You can now log in.',
    btnLogin: 'Go to Login',
    resendLabel: "Didn't receive it?", resendBtn: 'Resend code',
    resendOk: 'New code sent! Check your inbox.',
    resendErr: 'Could not resend. Please try again.',
    errInvalid: 'Invalid or expired code. Please try again.',
    errEnter: 'Please enter the full 6-digit code.',
    backLogin: 'Back to Login',
    noEmail: 'No email found. Please register again.',
  },
  si: {
    title: 'ඔබේ ඊ-තැපෑල සත්‍යාපනය කරන්න',
    sent: 'ඔබ සඳහා ඉලක්කම් 6 කේතයක් යැව්වෙමු',
    instruction: 'ඔබේ ගිණුම සක්‍රිය කිරීමට පහත කේතය ඇතුළත් කරන්න.',
    expires: 'කේතය මිනිත්තු 10 කින් කල් ඉකුත් වේ.',
    btnVerify: 'සත්‍යාපනය', btnVerifying: 'සත්‍යාපනය කරමින්…',
    successTitle: 'ඊ-තැපෑල සත්‍යාපනය විය!',
    successSub: 'ඔබේ ගිණුම සක්‍රියය. ලොගින් විය හැකිය.',
    btnLogin: 'ලොගින් වෙත යන්න',
    resendLabel: 'නොලැබුණාද?', resendBtn: 'කේතය නැවත යවන්න',
    resendOk: 'නව කේතයක් යැව්වා!',
    resendErr: 'නැවත යැවීම අසාර්ථකයි.',
    errInvalid: 'වලංගු නැති හෝ කල් ඉකුත් වූ කේතය.',
    errEnter: 'ඉලක්කම් 6 ක කේතය ඇතුළත් කරන්න.',
    backLogin: 'ලොගින් වෙත ආපසු',
    noEmail: 'ඊ-තැපෑල හමු නොවීය. නැවත ලියාපදිංචි වන්න.',
  },
  ta: {
    title: 'உங்கள் மின்னஞ்சலை சரிபாருங்கள்',
    sent: '6 இலக்க குறியீட்டை அனுப்பினோம்',
    instruction: 'உங்கள் கணக்கை செயல்படுத்த கீழே குறியீட்டை உள்ளிடுங்கள்.',
    expires: 'குறியீடு 10 நிமிடங்களில் காலாவதியாகும்.',
    btnVerify: 'சரிபார்', btnVerifying: 'சரிபார்க்கிறது…',
    successTitle: 'மின்னஞ்சல் சரிபார்க்கப்பட்டது!',
    successSub: 'உங்கள் கணக்கு செயலில் உள்ளது. உள்நுழையலாம்.',
    btnLogin: 'உள்நுழைவுக்கு செல்லுங்கள்',
    resendLabel: 'பெறவில்லையா?', resendBtn: 'குறியீட்டை மீண்டும் அனுப்பு',
    resendOk: 'புதிய குறியீடு அனுப்பப்பட்டது!',
    resendErr: 'மீண்டும் அனுப்ப முடியவில்லை.',
    errInvalid: 'தவறான அல்லது காலாவதியான குறியீடு.',
    errEnter: '6 இலக்க குறியீட்டை உள்ளிடுங்கள்.',
    backLogin: 'உள்நுழைவுக்கு திரும்பு',
    noEmail: 'மின்னஞ்சல் இல்லை. மீண்டும் பதிவு செய்யுங்கள்.',
  },
};

export default function VerifyCodePage() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const location = useLocation();
  const email = location.state?.email || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | ok | err
  const inputRefs = useRef(Array.from({ length: 6 }, () => null));

  const code = digits.join('');

  const handleDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length < 6) { setErrorMsg(t.errEnter); return; }
    setStatus('submitting');
    setErrorMsg('');
    try {
      await verifyEmail(email, code);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg(t.errInvalid);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await resendVerificationEmail(email);
      setResendStatus('ok');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setResendStatus('err');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        {/* ── Left panel ── */}
        <div className="auth-split__left">
          <Link className="auth-logo" to="/"><span>🌿</span> <strong>Smart</strong>Agri</Link>
          <div className="auth-split__illustration" style={{ marginTop: '40px', fontSize: '90px', textAlign: 'center' }}>
            {status === 'success' ? '🎉' : '📬'}
          </div>
          <h1 className="auth-split__title" style={{ marginTop: '16px' }}>
            {status === 'success' ? t.successTitle : t.title}
          </h1>
          {status !== 'success' && (
            <p className="auth-split__copy">{t.instruction}</p>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="auth-split__right">
          {!email ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>{t.noEmail}</p>
              <Link to="/register" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Register
              </Link>
            </div>
          ) : status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h2 className="auth-form-title" style={{ color: 'var(--green-primary)', marginBottom: '12px' }}>
                {t.successTitle}
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>{t.successSub}</p>
              <Link to="/login" className="auth-submit-btn"
                style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                {t.btnLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 className="auth-form-title" style={{ marginBottom: '8px' }}>{t.title}</h2>
                <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '4px' }}>
                  {t.sent}
                </p>
                <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '16px', wordBreak: 'break-all' }}>
                  {email}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '6px' }}>{t.expires}</p>
              </div>

              {/* ── OTP digit boxes ── */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    style={{
                      width: '48px', height: '58px',
                      textAlign: 'center', fontSize: '24px', fontWeight: '700',
                      fontFamily: 'monospace',
                      border: `2px solid ${d ? 'var(--green-primary)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      background: 'var(--input-bg, var(--surface))',
                      color: 'var(--text)',
                      outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="auth-error">⚠️ {errorMsg}</div>
              )}

              <button
                className="auth-submit-btn"
                type="submit"
                disabled={status === 'submitting' || code.length < 6}
              >
                {status === 'submitting' ? t.btnVerifying : t.btnVerify}
              </button>

              {/* ── Resend ── */}
              <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '10px' }}>{t.resendLabel}</p>
                {resendStatus === 'ok' ? (
                  <p style={{ color: 'var(--green-primary)', fontWeight: 500, fontSize: '16px' }}>✓ {t.resendOk}</p>
                ) : resendStatus === 'err' ? (
                  <p style={{ color: '#e53e3e', fontSize: '16px' }}>⚠️ {t.resendErr}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === 'sending'}
                    style={{
                      background: 'none', border: '1.5px solid var(--green-primary)',
                      color: 'var(--green-primary)', borderRadius: '8px',
                      padding: '8px 20px', cursor: 'pointer', fontWeight: 600,
                      fontSize: '15px', opacity: resendStatus === 'sending' ? 0.6 : 1,
                    }}
                  >
                    {resendStatus === 'sending' ? '…' : t.resendBtn}
                  </button>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ color: 'var(--muted)', fontSize: '15px' }}>
                  ← {t.backLogin}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
