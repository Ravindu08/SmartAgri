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

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email:     user?.email     || '',
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
        full_name: profileForm.full_name.trim(),
        email:     profileForm.email.trim() || undefined,
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
        <div className="settings-avatar-wrap">
          {user?.profile_image
            ? <img className="settings-avatar-img" src={user.profile_image} alt="avatar" />
            : <div className="settings-avatar">{initial}</div>
          }
          <label className="settings-avatar-edit" title="Change photo">
            📷
            <input type="file" accept="image/*" className="settings-avatar-input" onChange={handleAvatarChange} disabled={avatarSaving} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <div className="settings-user-name">{user?.full_name}</div>
          <div className="settings-user-meta">{user?.email} · {activeRole} · {t.settingsJoined} {joinDate}</div>
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
      <div className="settings-tabs">
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
              <button className="button button--primary" type="submit" disabled={profileSaving}>
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
              <input
                id="current_password"
                name="current_password"
                type="password"
                value={pwForm.current_password}
                onChange={handlePwChange}
                placeholder={t.settingsCurrentPw}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="new_password">{t.settingsNewPw}</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                value={pwForm.new_password}
                onChange={handlePwChange}
                placeholder={t.settingsNewPw}
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="confirm_password">{t.settingsConfirmPw}</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={pwForm.confirm_password}
                onChange={handlePwChange}
                placeholder={t.settingsConfirmPw}
                required
              />
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
    </section>
  );
}
