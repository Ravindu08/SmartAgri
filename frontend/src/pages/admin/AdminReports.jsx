import { useEffect, useState } from 'react';
import { adminRequest, downloadAdminCSV } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'Reports', loading: 'Loading…', failedLoad: 'Failed to load reports',
    exportCsv: '⬇ Export CSV', exportFarms: '⬇ Farm Data CSV', exportHarvest: '⬇ Harvest CSV',
    userDist: 'User Distribution', landOwners: 'Land Owners', traders: 'Traders', suspended: 'Suspended',
    totalUsers: 'Total users:',
    farms: 'Farms', totalFarmsReg: 'Total farms registered',
    marketplace: 'Marketplace', listings: 'Listings', orders: 'Orders',
    feedback: 'Feedback', allResolved: 'All resolved ✓', openNeedAttention: 'Open items need attention',
  },
  si: {
    title: 'වාර්තා', loading: 'පූරණය වෙමින්...', failedLoad: 'වාර්තා ලෝඩ් කිරීමට අසමත් විය',
    exportCsv: '⬇ CSV ලෙස දිනා', exportFarms: '⬇ ගොවිපල CSV', exportHarvest: '⬇ අස්වනු CSV',
    userDist: 'පරිශීලක බෙදාහැරීම', landOwners: 'ඉඩම් හිමිකරුවන්', traders: 'වෙළෙන්දන්', suspended: 'අත්හිටුවා ඇත',
    totalUsers: 'සම්පූර්ණ පරිශීලකයන්:',
    farms: 'ගොවිපල', totalFarmsReg: 'ලියාපදිංචි ගොවිපල',
    marketplace: 'වෙළඳසල', listings: 'ලැයිස්තු', orders: 'ඇණවුම්',
    feedback: 'ප්‍රතිපෝෂණ', allResolved: 'සියල්ල විසඳා ඇත ✓', openNeedAttention: 'විවෘත අයිතම අවධානය අවශ්‍යයි',
  },
  ta: {
    title: 'அறிக்கைகள்', loading: 'ஏற்றுகிறது...', failedLoad: 'அறிக்கைகளை ஏற்ற முடியவில்லை',
    exportCsv: '⬇ CSV ஆக ஏற்றுமதி', exportFarms: '⬇ பண்ணை CSV', exportHarvest: '⬇ அறுவடை CSV',
    userDist: 'பயனர் விநியோகம்', landOwners: 'நில உரிமையாளர்கள்', traders: 'வணிகர்கள்', suspended: 'இடைநிறுத்தப்பட்டது',
    totalUsers: 'மொத்த பயனர்கள்:',
    farms: 'பண்ணைகள்', totalFarmsReg: 'பதிவு செய்யப்பட்ட பண்ணைகள்',
    marketplace: 'சந்தை', listings: 'பட்டியல்கள்', orders: 'ஆர்டர்கள்',
    feedback: 'கருத்துக்கள்', allResolved: 'அனைத்தும் தீர்க்கப்பட்டது ✓', openNeedAttention: 'திறந்த உருப்படிகளுக்கு கவனம் தேவை',
  },
};

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AdminReports() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRequest('/reports').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', data.users.total],
      ['Land Owners', data.users.land_owners],
      ['Traders', data.users.traders],
      ['Suspended', data.users.suspended],
      ['Total Farms', data.farms.total],
      ['Total Listings', data.marketplace.total_listings],
      ['Total Orders', data.marketplace.total_orders],
      ['Open Feedback', data.feedback.open],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'smartagri-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>{t.loading}</div>;
  if (!data)   return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>{t.failedLoad}</div>;

  return (
    <div style={{ padding: '28px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>{t.title}</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #7c3aed', background: 'none', color: '#7c3aed', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            ⬇ Stats CSV
          </button>
          <button onClick={() => downloadAdminCSV('orders').catch(e => alert(e.message))}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            ⬇ Orders CSV
          </button>
          <button onClick={() => downloadAdminCSV('activity').catch(e => alert(e.message))}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            ⬇ Activity CSV
          </button>
          <button onClick={() => downloadAdminCSV('farms').catch(e => alert(e.message))}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            {t.exportFarms}
          </button>
          <button onClick={() => downloadAdminCSV('harvest').catch(e => alert(e.message))}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            {t.exportHarvest}
          </button>
        </div>
      </div>

      <Section title={t.userDist}>
        <Bar label={t.landOwners} value={data.users.land_owners} max={data.users.total} color="#2d6a4f" />
        <Bar label={t.traders}    value={data.users.traders}     max={data.users.total} color="#1565c0" />
        <Bar label={t.suspended}  value={data.users.suspended}   max={data.users.total} color="#e53935" />
        <div style={{ marginTop: '12px', padding: '12px 16px', background: 'var(--bg)', borderRadius: '8px', fontSize: '13px', color: 'var(--muted)' }}>
          {t.totalUsers} <strong style={{ color: 'var(--text)' }}>{data.users.total}</strong>
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        <Section title={t.farms}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#f57c00', marginBottom: '4px' }}>{data.farms.total}</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{t.totalFarmsReg}</div>
        </Section>
        <Section title={t.marketplace}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0097a7' }}>{data.marketplace.total_listings}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.listings}</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#00897b' }}>{data.marketplace.total_orders}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.orders}</div>
          </div>
        </Section>
        <Section title={t.feedback}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: data.feedback.open > 0 ? '#e53935' : '#2d6a4f', marginBottom: '4px' }}>{data.feedback.open}</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{data.feedback.open === 0 ? t.allResolved : t.openNeedAttention}</div>
        </Section>
      </div>
    </div>
  );
}
