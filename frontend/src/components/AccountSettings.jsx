import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuthSession,
  getActiveRole,
  updateUserProfile,
  changePassword,
  deleteAccount,
  clearAuthSession,
  updateUserInSession,
  updateUserAvatar,
} from '../services/api';
import { useApp } from '../context/AppContext';
import { LAND_T } from '../data/translations';
import Toast from './Toast';
import SpotlightTour   from './tour/SpotlightTour';
import HelpButton      from './tour/HelpButton';

const AS_TOUR_T = {
  en: {
    steps: [
      { target: 'settings-tabs', title: 'Three sections', body: 'Profile for your details, Security for your password, and Account for danger-zone actions.' },
      { target: 'settings-avatar', title: 'Update your photo', body: 'Click the camera icon to upload a new profile photo (max 2MB).' },
      { target: 'settings-save-profile-btn', title: 'Save your changes', body: 'Don’t forget to save after editing your name, email, or phone number.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'settings-tabs', title: 'කොටස් තුනක්', body: 'ඔබේ විස්තර සඳහා පැතිකඩ, ඔබේ මුරපදය සඳහා ආරක්ෂාව, සහ අවදානම් කලාප ක්‍රියා සඳහා ගිණුම.' },
      { target: 'settings-avatar', title: 'ඔබේ ඡායාරූපය යාවත්කාලීන කරන්න', body: 'නව පැතිකඩ ඡායාරූපයක් උඩුගත කිරීමට කැමරා අයිකනය ක්ලික් කරන්න (උපරිම 2MB).' },
      { target: 'settings-save-profile-btn', title: 'ඔබේ වෙනස්කම් සුරකින්න', body: 'ඔබේ නම, විද්‍යුත් තැපෑල, හෝ දුරකථන අංකය සංස්කරණය කිරීමෙන් පසු සුරැකීමට අමතක නොකරන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'settings-tabs', title: 'மூன்று பிரிவுகள்', body: 'உங்கள் விவரங்களுக்கு சுயவிவரம், உங்கள் கடவுச்சொல்லுக்கு பாதுகாப்பு, மற்றும் ஆபத்தான செயல்களுக்கு கணக்கு.' },
      { target: 'settings-avatar', title: 'உங்கள் புகைப்படத்தைப் புதுப்பிக்கவும்', body: 'புதிய சுயவிவரப் படத்தைப் பதிவேற்ற கேமரா ஐகானைக் கிளிக் செய்யுங்கள் (அதிகபட்சம் 2MB).' },
      { target: 'settings-save-profile-btn', title: 'உங்கள் மாற்றங்களைச் சேமிக்கவும்', body: 'உங்கள் பெயர், மின்னஞ்சல் அல்லது தொலைபேசி எண்ணைத் திருத்திய பிறகு சேமிக்க மறக்காதீர்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

/**
 * Shared profile / security / account settings panel.
 * Used by both LandOwner Settings and Trader Settings pages.
 * Reads all copy from LAND_T (all keys are role-agnostic).
 */
export default function AccountSettings() {
  const navigate = useNavigate();
  const { user }  = getAuthSession();
  const { lang }  = useApp();
  const t         = LAND_T[lang] || LAND_T.en;

  const TABS = [
    { key: 'Profile',  label: t.settingsTabProfile,  icon: '👤' },
    { key: 'Security', label: t.settingsTabSecurity, icon: '🔒' },
    { key: 'Account',  label: t.settingsTabAccount,  icon: '⚠️' },
  ];

  const [activeTab, setActiveTab] = useState('Profile');
  const [toast, setToast]         = useState({ type: 'success', message: '' });
  const asTourT = AS_TOUR_T[lang] || AS_TOUR_T.en;
  const [tourOpen, setTourOpen] = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name:    user?.full_name    || '',
    email:        user?.email        || '',
    phone_number: user?.phone_number || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const handleProfileChange = e =>
    setProfileForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSave = async e => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      setToast({ type: 'error', message: t.settingsToastNameRequired }); return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateUserProfile({
        full_name:    profileForm.full_name.trim(),
        email:        profileForm.email.trim() || undefined,
        phone_number: profileForm.phone_number.trim() || null,
      });
      updateUserInSession(updated);
      setToast({ type: 'success', message: t.settingsToastProfileSaved });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password:     '',
    confirm_password: '',
  });
  const [showCurrentPw, setShowCurrentPw]   = useState(false);
  const [showNewPw, setShowNewPw]           = useState(false);
  const [showConfirmPw, setShowConfirmPw]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const handlePwChange = e =>
    setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePwSave = async e => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setToast({ type: 'error', message: t.settingsToastPwMismatch }); return;
    }
    if (pwForm.new_password.length < 8) {
      setToast({ type: 'error', message: t.settingsToastPwShort }); return;
    }
    setPwSaving(true);
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setToast({ type: 'success', message: t.settingsToastPwChanged });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm]   = useState('');
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    if (deleteConfirm.toLowerCase() !== 'delete') {
      setToast({ type: 'error', message: t.settingsToastTypeDelete }); return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount();
      clearAuthSession();
      navigate('/', { replace: true });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setDeleteLoading(false);
    }
  };

  // ── Profile image ─────────────────────────────────────────────────────────
  const [avatarSaving, setAvatarSaving] = useState(false);

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', message: t.settingsToastImgLarge }); return;
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      setAvatarSaving(true);
      try {
        const updated = await updateUserAvatar(ev.target.result);
        updateUserInSession(updated);
        setToast({ type: 'success', message: t.settingsToastPhotoUpdated });
        window.location.reload();
      } catch (err) {
        setToast({ type: 'error', message: err.message });
      } finally {
        setAvatarSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = async () => {
    setAvatarSaving(true);
    try {
      const updated = await updateUserAvatar(null);
      updateUserInSession(updated);
      setToast({ type: 'success', message: t.settingsToastPhotoRemoved });
      window.location.reload();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setAvatarSaving(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────
  const initial  = (user?.full_name?.charAt(0) || 'U').toUpperCase();
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : '—';
  const activeRole = getActiveRole();
  const prefix   = activeRole === 'Trader' ? 'TR' : 'LO';
  const accountId = `${prefix}-${String(user?.id || 0).padStart(6, '0')}`;

  return (
    <section className="settings-page">

      {/* User card */}
      <div className="settings-user-card">
        <div className="settings-avatar-wrap" data-tour="settings-avatar">
          {user?.profile_image
            ? <img className="settings-avatar-img" src={user.profile_image} alt="avatar" />
            : <div className="settings-avatar">{initial}</div>
          }
          <label className="settings-avatar-edit" title="Change photo (max 2MB)">
            📷
            <input type="file" accept="image/*" className="settings-avatar-input" onChange={handleAvatarChange} disabled={avatarSaving} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <div className="settings-user-name">{user?.full_name}</div>
          <div className="settings-user-meta">{user?.email} · {activeRole} · {t.settingsJoined} {joinDate}</div>
          {user?.phone_number && (
            <div className="settings-user-meta" style={{ marginTop: '2px', opacity: 0.8 }}>📞 {user.phone_number}</div>
          )}
          {user?.profile_image && (
            <button
              className="settings-avatar-remove"
              type="button"
              onClick={handleAvatarRemove}
              disabled={avatarSaving}
            >
              {avatarSaving ? t.settingsPhotoSaving : t.settingsRemovePhoto}
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="settings-tabs" data-tour="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`settings-tab${activeTab === tab.key ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ───────────────────────────────────────────────────── */}
      {activeTab === 'Profile' && (
        <div className="settings-panel">
          <h2 className="settings-panel__title">{t.settingsPersonalDetails}</h2>
          <p className="settings-panel__sub">{t.settingsPersonalSub}</p>
          <form className="settings-form" onSubmit={handleProfileSave}>
            <div className="settings-field">
              <label htmlFor="full_name">{t.settingsFullName}</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={profileForm.full_name}
                onChange={handleProfileChange}
                placeholder={t.settingsFullName}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="email">{t.settingsEmail}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={profileForm.phone_number}
                onChange={handleProfileChange}
                placeholder="+94 77 123 4567"
                maxLength={20}
              />
              <span className="settings-field__hint">Visible to buyers/sellers so they can contact you to negotiate.</span>
            </div>
            <div className="settings-field settings-field--readonly">
              <label>{t.settingsRole}</label>
              <input type="text" value={activeRole || '—'} readOnly disabled />
              <span className="settings-field__hint">{t.settingsRoleHint}</span>
            </div>
            <div className="settings-field settings-field--readonly">
              <label>{t.settingsAccountId}</label>
              <input type="text" value={accountId} readOnly disabled />
            </div>
            <div className="settings-actions">
              <button className="button button--primary" type="submit" disabled={profileSaving} data-tour="settings-save-profile-btn">
                {profileSaving ? t.settingsSaving : t.settingsSaveChanges}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Security tab ──────────────────────────────────────────────────── */}
      {activeTab === 'Security' && (
        <div className="settings-panel">
          <h2 className="settings-panel__title">{t.settingsChangePassword}</h2>
          <p className="settings-panel__sub">{t.settingsPasswordSub}</p>
          <form className="settings-form" onSubmit={handlePwSave}>
            <div className="settings-field">
              <label htmlFor="current_password">{t.settingsCurrentPw}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current_password"
                  name="current_password"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={pwForm.current_password}
                  onChange={handlePwChange}
                  placeholder={t.settingsCurrentPw}
                  required
                  style={{ paddingRight: '38px', width: '100%', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowCurrentPw(p => !p)} tabIndex={-1} aria-label={showCurrentPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  {showCurrentPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div className="settings-field">
              <label htmlFor="new_password">{t.settingsNewPw}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new_password"
                  name="new_password"
                  type={showNewPw ? 'text' : 'password'}
                  value={pwForm.new_password}
                  onChange={handlePwChange}
                  placeholder={t.settingsNewPw}
                  required
                  style={{ paddingRight: '38px', width: '100%', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowNewPw(p => !p)} tabIndex={-1} aria-label={showNewPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  {showNewPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div className="settings-field">
              <label htmlFor="confirm_password">{t.settingsConfirmPw}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwForm.confirm_password}
                  onChange={handlePwChange}
                  placeholder={t.settingsConfirmPw}
                  required
                  style={{ paddingRight: '38px', width: '100%', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowConfirmPw(p => !p)} tabIndex={-1} aria-label={showConfirmPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  {showConfirmPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <span className="settings-field__error">{t.settingsPwMismatch}</span>
              )}
            </div>
            <div className="settings-actions">
              <button
                className="button button--primary"
                type="submit"
                disabled={pwSaving || !pwForm.current_password || !pwForm.new_password}
              >
                {pwSaving ? t.settingsChangingPw : t.settingsChangePwBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Account tab ───────────────────────────────────────────────────── */}
      {activeTab === 'Account' && (
        <div className="settings-panel">
          <h2 className="settings-panel__title">{t.settingsAccountMgmt}</h2>
          <p className="settings-panel__sub">{t.settingsAccountMgmtSub}</p>

          <div className="settings-info-block">
            <div className="settings-info-row">
              <span>{t.settingsAccountStatus}</span>
              <strong className="settings-badge--active">{t.settingsActive}</strong>
            </div>
            <div className="settings-info-row">
              <span>{t.settingsMemberSince}</span><strong>{joinDate}</strong>
            </div>
            <div className="settings-info-row">
              <span>{t.settingsRole}</span><strong>{activeRole}</strong>
            </div>
          </div>

          <div className="settings-danger-zone">
            <div className="settings-danger-header">
              <span className="settings-danger-icon">⚠️</span>
              <div>
                <h3>{t.settingsDeleteAccount}</h3>
                <p>{t.settingsDeleteDesc}</p>
              </div>
            </div>
            <button
              className="button button--danger"
              type="button"
              onClick={() => setShowDeleteModal(true)}
            >
              {t.settingsDeleteBtn}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>{t.settingsDeleteModalTitle}</h2>
            <p>
              {t.settingsDeleteModalDesc}
              <br /><br />
              {t.settingsDeleteInstructions}
            </p>
            <input
              className="settings-delete-input"
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={t.settingsDeleteModalTypePh}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
              >
                {t.settingsCancel}
              </button>
              <button
                className="button button--danger"
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirm.toLowerCase() !== 'delete'}
              >
                {deleteLoading ? t.settingsDeletingDots : t.settingsDeleteModalBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />

      <HelpButton label={asTourT.needHelp} ariaLabel={asTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={asTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: asTourT.next, back: asTourT.back, skip: asTourT.skip, done: asTourT.done }}
      />
    </section>
  );
}
