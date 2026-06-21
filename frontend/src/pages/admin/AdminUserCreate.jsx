import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'Add New User',
    labelFullName: 'Full Name', labelEmail: 'Email Address', labelPassword: 'Password', labelRoles: 'Roles',
    cancel: 'Cancel', creating: 'Creating…', createUser: 'Create User',
    errNoRole: 'Select at least one role',
  },
  si: {
    title: 'නව පරිශීලකයෙකු එකතු කරන්න',
    labelFullName: 'සම්පූර්ණ නම', labelEmail: 'ඊ-මේල් ලිපිනය', labelPassword: 'මුරපදය', labelRoles: 'භූමිකාව',
    cancel: 'අවලංගු කරන්න', creating: 'සාදමින්...', createUser: 'පරිශීලකයා සාදන්න',
    errNoRole: 'අවම වශයෙන් එක් භූමිකාවක් තෝරන්න',
  },
  ta: {
    title: 'புதிய பயனரைச் சேர்க்கவும்',
    labelFullName: 'முழு பெயர்', labelEmail: 'மின்னஞ்சல் முகவரி', labelPassword: 'கடவுச்சொல்', labelRoles: 'பங்குகள்',
    cancel: 'ரத்து', creating: 'உருவாக்குகிறது...', createUser: 'பயனரை உருவாக்கு',
    errNoRole: 'குறைந்தபட்சம் ஒரு பங்கைத் தேர்ந்தெடுக்கவும்',
  },
};

export default function AdminUserCreate() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', roles: ['Land Owner'] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleRole = (role) => {
    setForm(f => {
      const has = f.roles.includes(role);
      const next = has ? f.roles.filter(r => r !== role) : [...f.roles, role];
      return { ...f, roles: next.length ? next : f.roles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roles.length) { setError(t.errNoRole); return; }
    setSaving(true); setError('');
    try {
      await adminRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ ...form, role: form.roles[0] }),
      });
      navigate('/admin/users');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const field = (label, name, type = 'text', extra = {}) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
      <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        required style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' }}
        {...extra} />
    </label>
  );

  return (
    <div style={{ padding: '28px', maxWidth: '520px' }}>
      <h2 style={{ margin: '0 0 24px', color: 'var(--text)' }}>{t.title}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '28px' }}>
        {field(t.labelFullName, 'full_name')}
        {field(t.labelEmail, 'email', 'email')}
        {field(t.labelPassword, 'password', 'password', { minLength: 8 })}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{t.labelRoles}</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Land Owner', 'Trader', 'Admin'].map(role => {
              const active = form.roles.includes(role);
              const colors = { 'Land Owner': '#2d6a4f', 'Trader': '#1565c0', 'Admin': '#7c3aed' };
              const c = colors[role];
              return (
                <button key={role} type="button" onClick={() => toggleRole(role)}
                  style={{
                    padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${active ? c : 'var(--border)'}`,
                    background: active ? c + '18' : 'none', color: active ? c : 'var(--muted)',
                  }}>{role}</button>
              );
            })}
          </div>
        </div>

        {error && <div style={{ color: '#e53935', fontSize: '13px', padding: '8px 12px', background: '#e5393518', borderRadius: '8px' }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button type="button" onClick={() => navigate('/admin/users')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '14px' }}>
            {t.cancel}
          </button>
          <button type="submit" disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            {saving ? t.creating : t.createUser}
          </button>
        </div>
      </form>
    </div>
  );
}
