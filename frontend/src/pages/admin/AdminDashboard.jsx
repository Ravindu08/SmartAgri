import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { SkeletonStatCards } from '../../components/Skeleton';
import { useCountUp } from '../../hooks/useCountUp';

const T = {
  en: {
    title: 'Admin Dashboard', loading: 'Loading…', noActivity: 'No activity yet',
    totalUsers: 'Total Users', landOwners: 'Land Owners', traders: 'Traders',
    suspended: 'Suspended', totalFarms: 'Total Farms', listings: 'Listings',
    orders: 'Orders', openFeedback: 'Open Feedback',
    needsAttention: 'Needs attention', allClear: 'All clear',
    addUser: '+ Add User', viewFeedback: '💬 View Feedback', fullReports: '📈 Full Reports',
    recentActivity: 'Recent Activity', viewAll: 'View all →',
  },
  si: {
    title: 'පරිපාලක ඩෑෂ්බෝඩ', loading: 'පූරණය වෙමින්...', noActivity: 'ක්‍රියාකාරකම් නොමැත',
    totalUsers: 'සම්පූර්ණ පරිශීලකයන්', landOwners: 'ඉඩම් හිමිකරුවන්', traders: 'වෙළෙන්දන්',
    suspended: 'අත්හිටුවා ඇත', totalFarms: 'සම්පූර්ණ ගොවිපල', listings: 'ලැයිස්තු',
    orders: 'ඇණවුම්', openFeedback: 'විවෘත ප්‍රතිපෝෂණ',
    needsAttention: 'අවධානය අවශ්‍යයි', allClear: 'සිය‍ල්ල හොඳයි',
    addUser: '+ පරිශීලකයෙකු එකතු කරන්න', viewFeedback: '💬 ප්‍රතිපෝෂණ බලන්න', fullReports: '📈 සම්පූර්ණ වාර්තා',
    recentActivity: 'මෑත ක්‍රියාකාරකම්', viewAll: 'සිය‍ල්ල බලන්න →',
  },
  ta: {
    title: 'நிர்வாக டாஷ்போர்டு', loading: 'ஏற்றுகிறது...', noActivity: 'செயல்பாடு இல்லை',
    totalUsers: 'மொத்த பயனர்கள்', landOwners: 'நில உரிமையாளர்கள்', traders: 'வணிகர்கள்',
    suspended: 'இடைநிறுத்தப்பட்டது', totalFarms: 'மொத்த பண்ணைகள்', listings: 'பட்டியல்கள்',
    orders: 'ஆர்டர்கள்', openFeedback: 'திறந்த கருத்துக்கள்',
    needsAttention: 'கவனம் தேவை', allClear: 'அனைத்தும் சரி',
    addUser: '+ பயனரைச் சேர்க்கவும்', viewFeedback: '💬 கருத்துக்களை காண்க', fullReports: '📈 முழு அறிக்கைகள்',
    recentActivity: 'சமீபத்திய செயல்பாடு', viewAll: 'அனைத்தையும் காண்க →',
  },
};

function StatCard({ icon, label, value, color = '#7c3aed', sub }) {
  const displayValue = useCountUp(value ?? 0);
  return (
    <div className="stat-card-hover" style={{
      background: 'var(--card)', borderRadius: '14px', padding: '20px 24px',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{ fontSize: '32px', width: '52px', height: '52px', borderRadius: '12px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div className="count-up" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>{value == null ? '—' : displayValue}</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', color: color, marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [reports, setReports] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminRequest('/reports').catch(() => null),
      adminRequest('/activity?limit=8').catch(() => []),
    ]).then(([r, a]) => {
      setReports(r);
      setActivity(Array.isArray(a) ? a : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <SkeletonStatCards count={8} />;

  const quickLinks = [
    { to: '/admin/users/create', label: t.addUser,       color: '#7c3aed' },
    { to: '/admin/feedback',     label: t.viewFeedback,  color: '#c62828' },
    { to: '/admin/reports',      label: t.fullReports,   color: '#1565c0' },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      <h2 style={{ margin: '0 0 24px', color: 'var(--text)', fontSize: '22px' }}>{t.title}</h2>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon="👥" label={t.totalUsers}   value={reports?.users?.total}       color="#7c3aed" />
        <StatCard icon="🌾" label={t.landOwners}   value={reports?.users?.land_owners}  color="#2d6a4f" />
        <StatCard icon="🏪" label={t.traders}       value={reports?.users?.traders}      color="#1565c0" />
        <StatCard icon="🚫" label={t.suspended}     value={reports?.users?.suspended}    color="#e53935" />
        <StatCard icon="🌱" label={t.totalFarms}    value={reports?.farms?.total}        color="#f57c00" />
        <StatCard icon="📦" label={t.listings}      value={reports?.marketplace?.total_listings} color="#0097a7" />
        <StatCard icon="🛒" label={t.orders}        value={reports?.marketplace?.total_orders}   color="#00897b" />
        <StatCard icon="💬" label={t.openFeedback}  value={reports?.feedback?.open}      color="#c62828"
          sub={reports?.feedback?.open > 0 ? t.needsAttention : t.allClear} />
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {quickLinks.map(({ to, label, color }) => (
          <Link key={to} to={to} style={{
            padding: '8px 18px', borderRadius: '8px', border: `1px solid ${color}`,
            color, fontWeight: 600, fontSize: '13px', textDecoration: 'none',
          }}>{label}</Link>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.recentActivity}</span>
          <Link to="/admin/activity" style={{ fontSize: '13px', color: '#7c3aed' }}>{t.viewAll}</Link>
        </div>
        {activity.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>{t.noActivity}</div>
        ) : (
          activity.map(a => (
            <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{a.action.replace(/_/g, ' ')}</div>
                {a.details && <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{a.details}</div>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
