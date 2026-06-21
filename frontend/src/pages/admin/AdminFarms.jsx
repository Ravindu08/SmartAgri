import { useEffect, useState } from 'react';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'All Farms', loading: 'Loading…', noFarms: 'No farms found',
    searchPlaceholder: 'Search name or district…',
    colFarmName: 'Farm Name', colDistrict: 'District', colSize: 'Size',
    colOwner: 'Owner ID', colCreated: 'Created',
  },
  si: {
    title: 'සිය‍ල්ල ගොවිපල', loading: 'පූරණය වෙමින්...', noFarms: 'ගොවිපල හමු නොවීය',
    searchPlaceholder: 'නම හෝ දිස්ත්‍රික්කය සොයන්න...',
    colFarmName: 'ගොවිපල නම', colDistrict: 'දිස්ත්‍රික්කය', colSize: 'ප්‍රමාණය',
    colOwner: 'හිමිකරු ID', colCreated: 'සාදන ලද',
  },
  ta: {
    title: 'அனைத்து பண்ணைகளும்', loading: 'ஏற்றுகிறது...', noFarms: 'பண்ணைகள் கிடைக்கவில்லை',
    searchPlaceholder: 'பெயர் அல்லது மாவட்டம் தேடவும்...',
    colFarmName: 'பண்ணை பெயர்', colDistrict: 'மாவட்டம்', colSize: 'அளவு',
    colOwner: 'உரிமையாளர் ID', colCreated: 'உருவாக்கப்பட்டது',
  },
};

export default function AdminFarms() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [farms, setFarms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    adminRequest('/farms').then(data => { setFarms(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = farms.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.district?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>{t.loading}</div>;

  const headers = [t.colFarmName, t.colDistrict, t.colSize, t.colOwner, t.colCreated];

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>{t.title} <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 400 }}>({farms.length})</span></h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px', width: '220px' }} />
      </div>

      <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>🌾 {f.name}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>{f.district}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{f.size} {f.size_unit}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>#{f.owner_id}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--muted)' }}>{f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>{t.noFarms}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
