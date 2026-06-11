import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuthSession,
  updateUserProfile,
  changePassword,
  deleteAccount,
  clearAuthSession,
  updateUserInSession,
  updateUserAvatar,
} from '../../services/api';
import Toast from '../../components/Toast';

const TABS = ['Profile', 'Security', 'Account'];

export default function Settings() {
  const navigate       = useNavigate();
  const { user }       = getAuthSession();

  const [activeTab, setActiveTab] = useState('Profile');
  const [toast,     setToast]     = useState({ type: 'success', message: '' });

  // ── Profile form ───────────────────────────────────────────────────────────
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
      setToast({ type: 'error', message: 'Full name is required.' }); return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateUserProfile({
        full_name: profileForm.full_name.trim(),
        email:     profileForm.email.trim() || undefined,
      });
      updateUserInSession(updated);
      setToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password form ──────────────────────────────────────────────────────────
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
      setToast({ type: 'error', message: 'New passwords do not match.' }); return;
    }
    if (pwForm.new_password.length < 8) {
      setToast({ type: 'error', message: 'New password must be at least 8 characters.' }); return;
    }
    setPwSaving(true);
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setToast({ type: 'success', message: 'Password changed successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    if (deleteConfirm.toLowerCase() !== 'delete') {
      setToast({ type: 'error', message: 'Type "delete" to confirm.' }); return;
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

  // ── Profile image ──────────────────────────────────────────────────────────
  const [avatarSaving, setAvatarSaving] = useState(false);

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Image must be under 2 MB.' }); return;
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      setAvatarSaving(true);
      try {
        const updated = await updateUserAvatar(ev.target.result);
        updateUserInSession(updated);
        setToast({ type: 'success', message: 'Profile photo updated.' });
        // force re-read of user from storage
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
      setToast({ type: 'success', message: 'Profile photo removed.' });
      window.location.reload();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setAvatarSaving(false);
    }
  };

  // ── Avatar initial ─────────────────────────────────────────────────────────
  const initial = (user?.full_name?.charAt(0) || 'U').toUpperCase();
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : '—';

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
          <div className="settings-user-meta">{user?.email} · {user?.role} · Joined {joinDate}</div>
          {user?.profile_image && (
            <button
              className="settings-avatar-remove"
              type="button"
              onClick={handleAvatarRemove}
              disabled={avatarSaving}
            >
              {avatarSaving ? 'Saving…' : '✕ Remove photo'}
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`settings-tab${activeTab === tab ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Profile' ? '👤' : tab === 'Security' ? '🔒' : '⚠️'} {tab}
          </button>
        ))}
      </div>

      {/* ── Profile tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'Profile' && (
        <div className="settings-panel">
          <h2 className="settings-panel__title">Personal Details</h2>
          <p className="settings-panel__sub">Update your name and email address.</p>
          <form className="settings-form" onSubmit={handleProfileSave}>
            <div className="settings-field">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={profileForm.full_name}
                onChange={handleProfileChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="email">Email Address</label>
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
              <label>Role</label>
              <input type="text" value={user?.role || '—'} readOnly disabled />
              <span className="settings-field__hint">Role cannot be changed.</span>
            </div>
            <div className="settings-field settings-field--readonly">
              <label>Account ID</label>
              <input type="text" value={`LO-${String(user?.id || 0).padStart(6, '0')}`} readOnly disabled />
            </div>
            <div className="settings-actions">
              <button className="button button--primary" type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Security tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'Security' && (
        <div className="settings-panel">
          <h2 className="settings-panel__title">Change Password</h2>
          <p className="settings-panel__sub">Use a strong password of at least 8 characters.</p>
          <form className="settings-form" onSubmit={handlePwSave}>
            <div className="settings-field">
              <label htmlFor="current_password">Current Password</label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                value={pwForm.current_password}
                onChange={handlePwChange}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="new_password">New Password</label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                value={pwForm.new_password}
                onChange={handlePwChange}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="settings-field">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={pwForm.confirm_password}
                onChange={handlePwChange}
                placeholder="Repeat new password"
                required
              />
              {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <span className="settings-field__error">Passwords do not match.</span>
              )}
            </div>
            <div className="settings-actions">
              <button
                className="button button--primary"
                type="submit"
                disabled={pwSaving || !pwForm.current_password || !pwForm.new_password}
              >
                {pwSaving ? 'Changing…' : '🔒 Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Account tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'Account' && (
        <div className="settings-panel">
          <h2 className="settings-panel__title">Account Management</h2>
          <p className="settings-panel__sub">Manage your account status and data.</p>

          <div className="settings-info-block">
            <div className="settings-info-row">
              <span>Account status</span><strong className="settings-badge--active">Active</strong>
            </div>
            <div className="settings-info-row">
              <span>Member since</span><strong>{joinDate}</strong>
            </div>
            <div className="settings-info-row">
              <span>Role</span><strong>{user?.role}</strong>
            </div>
          </div>

          <div className="settings-danger-zone">
            <div className="settings-danger-header">
              <span className="settings-danger-icon">⚠️</span>
              <div>
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data. This cannot be undone.</p>
              </div>
            </div>
            <button
              className="button button--danger"
              type="button"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>⚠️ Delete Account</h2>
            <p>
              This will permanently delete your account, all your farms, crops, and cultivation data.
              <br /><br />
              Type <strong>delete</strong> below to confirm:
            </p>
            <input
              className="settings-delete-input"
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type delete to confirm"
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
              >
                Cancel
              </button>
              <button
                className="button button--danger"
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirm.toLowerCase() !== 'delete'}
              >
                {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
