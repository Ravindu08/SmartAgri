import { useEffect, useState } from 'react';
import { adminRequest, downloadAdminCSV } from '../../services/api';
import { useApp } from '../../context/AppContext';
import CustomSelect from '../../components/CustomSelect';

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const T = {
  en: {
    title: 'Harvest Forecast',
    allDistricts: 'All Districts',
    exportCsv: '⬇ Export CSV',
    loading: 'Loading forecast…',
    noData: 'No active cultivation sessions found.',
    colFarm: 'Farm', colFarmer: 'Farmer', colDistrict: 'District',
    colCrop: 'Crop', colPlanted: 'Planted', colHarvest: 'Est. Harvest', colSize: 'Size',
    daysUntil: (n) => `in ${n}d`,
    overdue: 'overdue',
    today: 'today',
  },
  si: {
    title: 'අස්වනු පෙරනිමිය',
    allDistricts: 'සියලු දිස්ත්‍රික්ක',
    exportCsv: '⬇ CSV දිනා',
    loading: 'පෙරනිමිය පූරණය වෙමින්...',
    noData: 'ක්‍රියාකාරී වගා සැසි හමු නොවීය.',
    colFarm: 'ගොවිපළ', colFarmer: 'ගොවියා', colDistrict: 'දිස්ත්‍රික්කය',
    colCrop: 'බෝගය', colPlanted: 'සිටුවූ දිනය', colHarvest: 'අස්වනු දිනය', colSize: 'ප්‍රමාණය',
    daysUntil: (n) => `${n}ද`,
    overdue: 'කල් ගිය',
    today: 'අද',
  },
  ta: {
    title: 'அறுவடை முன்னறிவிப்பு',
    allDistricts: 'அனைத்து மாவட்டங்கள்',
    exportCsv: '⬇ CSV ஏற்றுமதி',
    loading: 'முன்னறிவிப்பு ஏற்றுகிறது...',
    noData: 'செயலில் உள்ள சாகுபடி அமர்வுகள் இல்லை.',
    colFarm: 'பண்ணை', colFarmer: 'விவசாயி', colDistrict: 'மாவட்டம்',
    colCrop: 'பயிர்', colPlanted: 'நடவு தேதி', colHarvest: 'அறுவடை தேதி', colSize: 'அளவு',
    daysUntil: (n) => `${n}நாள்`,
    overdue: 'காலதாமதம்',
    today: 'இன்று',
  },
};

function daysFrom(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function HarvestBadge({ dateStr, t }) {
  const days = daysFrom(dateStr);
  if (days === null) return null;
  if (days < 0)  return <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#e5393518', color: '#e53935', fontWeight: 600 }}>{t.overdue}</span>;
  if (days === 0) return <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#2d6a4f18', color: '#2d6a4f', fontWeight: 600 }}>{t.today}</span>;
  if (days <= 30) return <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#2d6a4f18', color: '#2d6a4f', fontWeight: 600 }}>{t.daysUntil(days)}</span>;
  if (days <= 60) return <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#f57c0018', color: '#f57c00', fontWeight: 600 }}>{t.daysUntil(days)}</span>;
  return <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'var(--border)', color: 'var(--muted)', fontWeight: 600 }}>{t.daysUntil(days)}</span>;
}

function rowBg(dateStr) {
  const days = daysFrom(dateStr);
  if (days === null) return 'transparent';
  if (days < 0)  return '#e5393506';
  if (days <= 30) return '#2d6a4f06';
  if (days <= 60) return '#f57c0006';
  return 'transparent';
}

export default function AdminHarvestForecast() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [district, setDistrict] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = district ? `?district=${encodeURIComponent(district)}` : '';
    adminRequest(`/harvest-forecast${params}`)
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [district]);

  const headers = [t.colFarm, t.colFarmer, t.colDistrict, t.colCrop, t.colPlanted, t.colHarvest, t.colSize];

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>
          {t.title}
          {!loading && <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 400, marginLeft: '8px' }}>({data.length})</span>}
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <CustomSelect
            value={district}
            onChange={e => setDistrict(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="">{t.allDistricts}</option>
            {SL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </CustomSelect>
          <button
            type="button"
            onClick={() => downloadAdminCSV('harvest').catch(e => alert(e.message))}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.exportCsv}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>{t.loading}</div>
      ) : data.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)', background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          🌱 {t.noData}
        </div>
      ) : (
        <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {headers.map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.session_id || i} style={{ borderBottom: '1px solid var(--border)', background: rowBg(r.estimated_harvest_date) }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>🌾 {r.farm_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)' }}>{r.farmer_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{r.district}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--green-primary)' }}>{r.crop}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--muted)' }}>{r.planting_date || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {r.estimated_harvest_date || '—'}
                        </span>
                        <HarvestBadge dateStr={r.estimated_harvest_date} t={t} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {r.farm_size ? `${r.farm_size} ${r.size_unit}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
