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
                      type="password" value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={t.passPlaceholder} minLength={8} required
                    />
                  </div>
                </label>
                <label className="auth-field">
                  <span>{t.confirmLabel}</span>
                  <div className="auth-field__input-wrap">
                    <span className="auth-field__icon">🔒</span>
                    <input
                      type="password" value={form.confirm}
                      onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder={t.confirmPlaceholder} required
                    />
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
