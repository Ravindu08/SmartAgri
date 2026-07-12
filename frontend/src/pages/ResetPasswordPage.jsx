import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { resetPassword } from '../services/api';

const T = {
  en: {
    panelTitle: 'Choose a new password',
    panelCopy: 'Pick something strong that you have not used before.',
    formTitle: 'New Password',
    passLabel: 'New Password',
    passPlaceholder: 'At least 8 characters',
    confirmLabel: 'Confirm Password',
    confirmPlaceholder: 'Repeat your new password',
    errMatch: 'Passwords do not match.',
    errShort: 'Password must be at least 8 characters.',
    errInvalid: 'This reset link is invalid or has expired.',
    btnReset: 'Reset Password',
    btnLoading: 'Resetting…',
    successTitle: 'Password reset!',
    successSub: 'Your password has been updated. You can now log in.',
    btnLogin: 'Go to Login',
    noToken: 'No reset token found in the URL. Please request a new link.',
    requestNew: 'Request new link',
  },
  si: {
    panelTitle: 'නව මුරපදයක් තෝරන්න',
    panelCopy: 'ඔබ කලින් භාවිතා නොකළ ශක්තිමත් මුරපදයක් තෝරන්න.',
    formTitle: 'නව මුරපදය',
    passLabel: 'නව මුරපදය',
    passPlaceholder: 'අවම 8 අකුරු',
    confirmLabel: 'මුරපදය තහවුරු කරන්න',
    confirmPlaceholder: 'නව මුරපදය නැවත ඇතුළත් කරන්න',
    errMatch: 'මුරපද ගැළපෙන්නේ නැත.',
    errShort: 'මුරපදය අවම 8 අකුරු විය යුතුය.',
    errInvalid: 'මෙම නැවත සකස් කිරීමේ සබැඳිය වලංගු නැත හෝ කල් ඉකුත් වී ඇත.',
    btnReset: 'මුරපදය නැවත සකස් කරන්න',
    btnLoading: 'නැවත සකස් කරමින්…',
    successTitle: 'මුරපදය නැවත සකස් විය!',
    successSub: 'ඔබේ මුරපදය යාවත්කාලීන කරන ලදී. ලොගින් විය හැකිය.',
    btnLogin: 'ලොගින් වෙත යන්න',
    noToken: 'URL හි නැවත සකස් කිරීමේ ටෝකනයක් නොමැත.',
    requestNew: 'නව සබැඳියක් ඉල්ලන්න',
  },
  ta: {
    panelTitle: 'புதிய கடவுச்சொல்லை தேர்ந்தெடுங்கள்',
    panelCopy: 'நீங்கள் முன்பு பயன்படுத்தாத வலுவான கடவுச்சொல்லை தேர்ந்தெடுங்கள்.',
    formTitle: 'புதிய கடவுச்சொல்',
    passLabel: 'புதிய கடவுச்சொல்',
    passPlaceholder: 'குறைந்தது 8 எழுத்துகள்',
    confirmLabel: 'கடவுச்சொல்லை உறுதிப்படுத்துங்கள்',
    confirmPlaceholder: 'புதிய கடவுச்சொல்லை மீண்டும் உள்ளிடுங்கள்',
    errMatch: 'கடவுச்சொற்கள் பொருந்தவில்லை.',
    errShort: 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்.',
    errInvalid: 'இந்த மீட்டமைப்பு இணைப்பு தவறானது அல்லது காலாவதியானது.',
    btnReset: 'கடவுச்சொல்லை மீட்டமை',
    btnLoading: 'மீட்டமைக்கிறது…',
    successTitle: 'கடவுச்சொல் மீட்டமைக்கப்பட்டது!',
    successSub: 'உங்கள் கடவுச்சொல் புதுப்பிக்கப்பட்டது. இப்போது உள்நுழையலாம்.',
    btnLogin: 'உள்நுழைவுக்கு செல்லுங்கள்',
    noToken: 'URL இல் மீட்டமைப்பு டோக்கன் இல்லை.',
    requestNew: 'புதிய இணைப்பை கோரு',
  },
};

export default function ResetPasswordPage() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError(t.errShort); return; }
    if (form.password !== form.confirm) { setError(t.errMatch); return; }
    setStatus('loading');
    try {
      await resetPassword(token, form.password);
      setStatus('done');
    } catch (err) {
      setError(err.message?.includes('expired') ? t.errInvalid : (err.message || t.errInvalid));
      setStatus('idle');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-split">
        <div className="auth-split__left">
          <Link className="auth-logo" to="/"><span>🌿</span> <strong>Smart</strong>Agri</Link>
          <div className="auth-split__illustration">
            <div style={{ fontSize: '80px', marginTop: '32px' }}>🔐</div>
          </div>
          <h1 className="auth-split__title">{t.panelTitle}</h1>
          <p className="auth-split__copy">{t.panelCopy}</p>
        </div>

        <div className="auth-split__right">
          {!token ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>{t.noToken}</p>
              <Link to="/forgot-password" style={{ color: 'var(--green-primary)', fontWeight: 500 }}>
                {t.requestNew}
              </Link>
            </div>
          ) : status === 'done' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
              <h2 className="auth-form-title" style={{ color: 'var(--green-primary)', marginBottom: '12px' }}>
                {t.successTitle}
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>{t.successSub}</p>
              <Link to="/login" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                {t.btnLogin}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="auth-form-title">{t.formTitle}</h2>
              <form className="auth-form-new" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>{t.passLabel}</span>
                  <div className="auth-field__input-wrap">
                    <span className="auth-field__icon">🔒</span>
                    <input
                      type={showPw ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={t.passPlaceholder} minLength={8} required style={{ paddingRight: '42px' }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                      {showPw
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </label>
                <label className="auth-field">
                  <span>{t.confirmLabel}</span>
                  <div className="auth-field__input-wrap">
                    <span className="auth-field__icon">🔒</span>
                    <input
                      type={showConfirm ? 'text' : 'password'} value={form.confirm}
                      onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder={t.confirmPlaceholder} required style={{ paddingRight: '42px' }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                      {showConfirm
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </label>
                {error && <div className="auth-error">⚠️ {error}</div>}
                <button className="auth-submit-btn" type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? t.btnLoading : t.btnReset}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
