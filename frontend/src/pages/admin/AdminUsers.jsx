import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminRequest, downloadAdminCSV } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'Users', loading: 'Loading…', addUser: '+ Add User', importCsv: 'Import CSV',
    searchPlaceholder: 'Search name or email…', allRoles: 'All roles',
    colName: 'Name', colEmail: 'Email', colRoles: 'Role(s)',
    colJoined: 'Joined', colStatus: 'Status', colActions: 'Actions',
    statusActive: 'Active', statusSuspended: 'Suspended',
    suspend: 'Suspend', unsuspend: 'Unsuspend', delete: 'Delete',
    noUsers: 'No users found',
    confirmDelete: (name) => `Delete ${name}? This cannot be undone.`,
    toastSuspended: (name) => `${name} suspended`,
    toastUnsuspended: (name) => `${name} unsuspended`,
    toastDeleted: (name) => `${name} deleted`,
  },
  si: {
    title: 'පරිශීලකයන්', loading: 'පූරණය වෙමින්...', addUser: '+ පරිශීලකයෙකු එකතු කරන්න', importCsv: 'CSV ආයාත කරන්න',
    searchPlaceholder: 'නම හෝ ඊ-මේල් සොයන්න...', allRoles: 'සෑම භූමිකාවක්ම',
    colName: 'නම', colEmail: 'ඊ-මේල්', colRoles: 'භූමිකාව(ය)',
    colJoined: 'සම්බන්ධ වූ', colStatus: 'තත්ත්වය', colActions: 'ක්‍රියා',
    statusActive: 'ක්‍රියාකාරී', statusSuspended: 'අත්හිටුවා ඇත',
    suspend: 'අත්හිටුවන්න', unsuspend: 'නැවත සක්‍රිය කරන්න', delete: 'මකන්න',
    noUsers: 'පරිශීලකයන් හමු නොවීය',
    confirmDelete: (name) => `${name} මකන්නද? මෙය 되돌릴 නොහැක.`,
    toastSuspended: (name) => `${name} අත්හිටුවා ඇත`,
    toastUnsuspended: (name) => `${name} නැවත සක්‍රිය කරන ලදී`,
    toastDeleted: (name) => `${name} මකන ලදී`,
  },
  ta: {
    title: 'பயனர்கள்', loading: 'ஏற்றுகிறது...', addUser: '+ பயனரைச் சேர்க்கவும்', importCsv: 'CSV இறக்கு',
    searchPlaceholder: 'பெயர் அல்லது மின்னஞ்சல் தேடவும்...', allRoles: 'அனைத்து பங்குகளும்',
    colName: 'பெயர்', colEmail: 'மின்னஞ்சல்', colRoles: 'பங்கு(கள்)',
    colJoined: 'இணைந்தது', colStatus: 'நிலை', colActions: 'நடவடிக்கைகள்',
    statusActive: 'செயலில்', statusSuspended: 'இடைநிறுத்தப்பட்டது',
    suspend: 'இடைநிறுத்து', unsuspend: 'மீண்டும் செயல்படுத்து', delete: 'நீக்கு',
    noUsers: 'பயனர்கள் கிடைக்கவில்லை',
    confirmDelete: (name) => `${name} ஐ நீக்கவா? இதை மீட்டெடுக்க முடியாது.`,
    toastSuspended: (name) => `${name} இடைநிறுத்தப்பட்டது`,
    toastUnsuspended: (name) => `${name} மீண்டும் செயல்படுத்தப்பட்டது`,
    toastDeleted: (name) => `${name} நீக்கப்பட்டது`,
  },
};

const ROLE_COLOR = {
  'Land Owner': '#2d6a4f', 'Trader': '#1565c0', 'Admin': '#7c3aed', 'Visitor': '#757575',
};

export default function AdminUsers() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const navigate = useNavigate();

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [toast, setToast]     = useState('');

  const loadUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)     params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    adminRequest(`/users?${params}`).then(data => { setUsers(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSuspend = async (u) => {
    await adminRequest(`/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ is_suspended: !u.is_suspended }) });
    showToast(u.is_suspended ? t.toastUnsuspended(u.full_name) : t.toastSuspended(u.full_name));
    loadUsers();
  };

  const handleDelete = async (u) => {
    if (!window.confirm(t.confirmDelete(u.full_name))) return;
    try {
      await adminRequest(`/users/${u.id}`, { method: 'DELETE' });
      showToast(t.toastDeleted(u.full_name));
      loadUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const headers = [t.colName, t.colEmail, t.colRoles, t.colJoined, t.colStatus, t.colActions];

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#333', color: '#fff', padding: '10px 18px', borderRadius: '8px', zIndex: 999 }}>{toast}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>{t.title}</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => downloadAdminCSV('users').catch(err => alert(err.message))}
            style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            ⬇ Export CSV
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/users/import')}
            style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            📥 {t.importCsv}
          </button>
          <Link to="/admin/users/create" style={{
            padding: '8px 18px', borderRadius: '8px', background: '#7c3aed', color: '#fff',
            fontWeight: 600, fontSize: '13px', textDecoration: 'none',
          }}>{t.addUser}</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' }}>
          <option value="">{t.allRoles}</option>
          <option value="Land Owner">Land Owner</option>
          <option value="Trader">Trader</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>{t.loading}</div>
      ) : (
        <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {headers.map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{u.full_name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(u.roles || [u.role]).map(r => (
                        <span key={r} style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                          background: (ROLE_COLOR[r] || '#888') + '18', color: ROLE_COLOR[r] || '#888', fontWeight: 600,
                        }}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '12px', padding: '3px 10px', borderRadius: '99px', fontWeight: 600,
                      background: u.is_suspended ? '#e5393518' : '#2d6a4f18',
                      color: u.is_suspended ? '#e53935' : '#2d6a4f',
                    }}>{u.is_suspended ? t.statusSuspended : t.statusActive}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleSuspend(u)}
                        style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: u.is_suspended ? '#2d6a4f' : '#f57c00' }}>
                        {u.is_suspended ? t.unsuspend : t.suspend}
                      </button>
                      {!u.is_verified && u.role !== 'Admin' && (
                        <button onClick={async () => {
                          try {
                            await adminRequest(`/users/${u.id}/resend-verification`, { method: 'POST' });
                            setToast('Verification email resent ✓');
                          } catch (err) { setToast(err.message); }
                        }}
                          style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #1a7a4a', background: 'none', cursor: 'pointer', color: '#1a7a4a' }}
                          title="Resend verification email"
                        >
                          ✉ Resend
                        </button>
                      )}
                      {u.role !== 'Admin' && (
                        <button onClick={() => handleDelete(u)}
                          style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e53935', background: 'none', cursor: 'pointer', color: '#e53935' }}>
                          {t.delete}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>{t.noUsers}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
