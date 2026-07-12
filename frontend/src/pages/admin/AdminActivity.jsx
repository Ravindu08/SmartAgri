import { useEffect, useState } from 'react';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { SkeletonTable } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 15;

const T = {
  en: {
    title: 'Activity Log', loading: 'Loading…', noActivity: 'No activity recorded yet',
    user: 'User #', byAdmin: 'by Admin #', searchPlaceholder: 'Search action, details, or user #…',
  },
  si: {
    title: 'ක්‍රියාකාරකම් ලොගය', loading: 'පූරණය වෙමින්...', noActivity: 'ක්‍රියාකාරකම් තවම නොමැත',
    user: 'පරිශීලකයා #', byAdmin: 'ශාසකයා #', searchPlaceholder: 'ක්‍රියාව, විස්තර, හෝ පරිශීලක # සොයන්න...',
  },
  ta: {
    title: 'செயல்பாட்டு பதிவு', loading: 'ஏற்றுகிறது...', noActivity: 'செயல்பாடு பதிவு செய்யப்படவில்லை',
    user: 'பயனர் #', byAdmin: 'நிர்வாகி #', searchPlaceholder: 'செயல், விவரங்கள் அல்லது பயனர் # தேடவும்…',
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
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    adminRequest('/activity?limit=200').then(data => { setActivity(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = activity.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.action?.toLowerCase().includes(q)
      || a.details?.toLowerCase().includes(q)
      || String(a.user_id ?? '').includes(q)
      || String(a.actor_id ?? '').includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageActivity = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <SkeletonTable rows={8} cols={3} />;

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <h2 style={{ margin: '0 0 20px', color: 'var(--text)' }}>{t.title}</h2>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder}
        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '16px', width: '100%', maxWidth: '360px', marginBottom: '20px' }} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{t.noActivity}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {pageActivity.map((a, i) => (
            <div key={a.id} style={{
              display: 'flex', gap: '16px', padding: '14px 0',
              borderBottom: i < pageActivity.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', background: '#7c3aed18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0,
              }}>
                {ACTION_ICON[a.action] || '📋'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                      {a.action.replace(/_/g, ' ')}
                    </span>
                    {a.entity_type && <span style={{ fontSize: '14px', color: '#7c3aed', marginLeft: '8px', padding: '1px 6px', background: '#7c3aed18', borderRadius: '4px' }}>{a.entity_type}</span>}
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</span>
                </div>
                {a.details && <div style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '2px' }}>{a.details}</div>}
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
                  {a.user_id && <span>{t.user}{a.user_id}</span>}
                  {a.actor_id && <span style={{ marginLeft: '8px' }}>{t.byAdmin}{a.actor_id}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
