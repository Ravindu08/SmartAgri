import { useEffect, useState } from 'react';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'Activity Log', loading: 'Loading…', noActivity: 'No activity recorded yet',
    user: 'User #', byAdmin: 'by Admin #',
  },
  si: {
    title: 'ක්‍රියාකාරකම් ලොගය', loading: 'පූරණය වෙමින්...', noActivity: 'ක්‍රියාකාරකම් තවම නොමැත',
    user: 'පරිශීලකයා #', byAdmin: 'ශාසකයා #',
  },
  ta: {
    title: 'செயல்பாட்டு பதிவு', loading: 'ஏற்றுகிறது...', noActivity: 'செயல்பாடு பதிவு செய்யப்படவில்லை',
    user: 'பயனர் #', byAdmin: 'நிர்வாகி #',
  },
};

const ACTION_ICON = {
  admin_create_user: '➕', admin_edit_user: '✏️', admin_delete_user: '🗑️',
  admin_archive_listing: '📦', login: '🔑', register: '👤',
};

export default function AdminActivity() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminRequest('/activity?limit=200').then(data => { setActivity(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>{t.loading}</div>;

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <h2 style={{ margin: '0 0 20px', color: 'var(--text)' }}>{t.title}</h2>

      {activity.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{t.noActivity}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {activity.map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', gap: '16px', padding: '14px 0',
              borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', background: '#7c3aed18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
              }}>
                {ACTION_ICON[a.action] || '📋'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                      {a.action.replace(/_/g, ' ')}
                    </span>
                    {a.entity_type && <span style={{ fontSize: '12px', color: '#7c3aed', marginLeft: '8px', padding: '1px 6px', background: '#7c3aed18', borderRadius: '4px' }}>{a.entity_type}</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</span>
                </div>
                {a.details && <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{a.details}</div>}
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  {a.user_id && <span>{t.user}{a.user_id}</span>}
                  {a.actor_id && <span style={{ marginLeft: '8px' }}>{t.byAdmin}{a.actor_id}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
