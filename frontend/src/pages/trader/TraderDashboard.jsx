import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';
import CountUp from '../../components/CountUp';

const T = {
  en: {
    welcome: 'Welcome back', trader: 'Trader',
    statsRequests: 'Pending Orders', statsOrders: 'Active Orders',
    statsActive: 'Total Active', statsCompleted: 'Completed',
    quickActions: 'Quick Actions', browseMarket: 'Browse Marketplace',
    browseMarketDesc: 'Find crops & products available for purchase',
    viewRequests: 'Pending Orders', viewRequestsDesc: 'Orders awaiting seller confirmation',
    viewOrders: 'Active Orders', viewOrdersDesc: 'Confirmed and in-delivery orders',
    viewHistory: 'Transaction History', viewHistoryDesc: 'View past transactions',
    recentActivity: 'Recent Activity', noActivity: 'No recent activity.',
    Pending: 'Pending', Confirmed: 'Confirmed', Delivered: 'Delivered',
    Completed: 'Completed', Rejected: 'Rejected', Cancelled: 'Cancelled',
  },
  si: {
    welcome: 'නැවත සාදරයෙන් පිළිගනිමු', trader: 'වෙළෙන්ද',
    statsRequests: 'අපේක්ෂිත ඇණවුම්', statsOrders: 'ක්‍රියාත්මක ඇණවුම්',
    statsActive: 'සම්පූර්ණ ක්‍රියාත්මක', statsCompleted: 'සම්පූර්ණ',
    quickActions: 'ඉක්මන් ක්‍රියා', browseMarket: 'වෙළඳසැල බලන්න',
    browseMarketDesc: 'මිලදී ගත හැකි බෝග සොයන්න',
    viewRequests: 'අපේක්ෂිත ඇණවුම්', viewRequestsDesc: 'විකුණුම්කරු තහවුරු කිරීමට රැඳෙන ඇණවුම්',
    viewOrders: 'ක්‍රියාත්මක ඇණවුම්', viewOrdersDesc: 'තහවුරු ඇණවුම් නිරීක්ෂණය',
    viewHistory: 'ගනුදෙනු ඉතිහාසය', viewHistoryDesc: 'පසුගිය ගනුදෙනු බලන්න',
    recentActivity: 'මෑත ක්‍රියාකාරකම්', noActivity: 'මෑත ක්‍රියාකාරකම් නොමැත.',
    Pending: 'අපේක්ෂිත', Confirmed: 'තහවුරු', Delivered: 'බෙදාදුන්',
    Completed: 'සම්පූර්ණ', Rejected: 'ප්‍රතික්ෂේප', Cancelled: 'අවලංගු',
  },
  ta: {
    welcome: 'மீண்டும் வருக', trader: 'கடைவர்',
    statsRequests: 'நிலுவை ஆர்டர்கள்', statsOrders: 'செயலில் ஆர்டர்கள்',
    statsActive: 'மொத்த செயலில்', statsCompleted: 'முடிந்தவை',
    quickActions: 'விரைவு செயல்கள்', browseMarket: 'சந்தையை உலாவுக',
    browseMarketDesc: 'வாங்கக் கிடைக்கும் பயிர்களைக் கண்டறியவும்',
    viewRequests: 'நிலுவை ஆர்டர்கள்', viewRequestsDesc: 'விற்பனையாளர் உறுதிக்காக காத்திருக்கும் ஆர்டர்கள்',
    viewOrders: 'செயலில் ஆர்டர்கள்', viewOrdersDesc: 'உறுதிப்படுத்தப்பட்ட ஆர்டர்களை கண்காணிக்கவும்',
    viewHistory: 'பரிவர்த்தனை வரலாறு', viewHistoryDesc: 'கடந்த பரிவர்த்தனைகளை பார்க்கவும்',
    recentActivity: 'சமீபத்திய செயல்பாடு', noActivity: 'சமீபத்திய செயல்பாடு இல்லை.',
    Pending: 'நிலுவையில்', Confirmed: 'உறுதிப்படுத்தப்பட்டது', Delivered: 'வழங்கப்பட்டது',
    Completed: 'முடிந்தது', Rejected: 'நிராகரிக்கப்பட்டது', Cancelled: 'ரத்து',
  },
};

const STATUS_COLORS = {
  Pending: 'var(--amber)', Confirmed: 'var(--blue)', Delivered: 'var(--green-mid)',
  Completed: 'var(--green)', Rejected: 'var(--red)', Cancelled: 'var(--muted)',
};

const authFetcher = url => request(url);

export default function TraderDashboard() {
  const { lang } = useApp();
  const t        = T[lang] || T.en;
  const { user } = getAuthSession();

  const { data: rawOrders } = useSWR('/api/marketplace/orders', authFetcher, { refreshInterval: 10000 });
  const allOrders = Array.isArray(rawOrders) ? rawOrders : [];

  const myOrders = useMemo(
    () => allOrders.filter(o => o.buyer_id === user?.id),
    [allOrders, user?.id],
  );

  const pendingOrders   = myOrders.filter(o => o.status === 'Pending');
  const activeOrders    = myOrders.filter(o => ['Confirmed', 'Delivered'].includes(o.status));
  const completedOrders = myOrders.filter(o => o.status === 'Completed');

  const recentItems = useMemo(
    () => [...myOrders]
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 6),
    [myOrders],
  );

  const stats = [
    { label: t.statsRequests,  value: pendingOrders.length,   icon: '📋', color: 'var(--amber)' },
    { label: t.statsOrders,    value: activeOrders.length,    icon: '📦', color: 'var(--blue)' },
    { label: t.statsActive,    value: pendingOrders.length + activeOrders.length, icon: '🔄', color: 'var(--accent)' },
    { label: t.statsCompleted, value: completedOrders.length, icon: '✅', color: 'var(--green)' },
  ];

  const quickActions = [
    { to: '/marketplace',     icon: '🏪', label: t.browseMarket,  desc: t.browseMarketDesc,  color: 'var(--accent)' },
    { to: '/trader/requests', icon: '📋', label: t.viewRequests,  desc: t.viewRequestsDesc,  color: 'var(--amber)' },
    { to: '/trader/orders',   icon: '📦', label: t.viewOrders,    desc: t.viewOrdersDesc,    color: 'var(--blue)' },
    { to: '/trader/history',  icon: '📜', label: t.viewHistory,   desc: t.viewHistoryDesc,   color: 'var(--green)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            {t.welcome}, {user?.full_name?.split(' ')[0] || t.trader} 👋
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/marketplace"
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--accent)', color: 'var(--accent-text)',
            textDecoration: 'none', fontWeight: 600, fontSize: '14px',
          }}
        >
          🏪 {t.browseMarket}
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card-hover" style={{
            background: 'var(--card)', borderRadius: '12px',
            padding: '20px', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '28px' }}>{s.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              <CountUp value={s.value} />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
          {t.quickActions}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {quickActions.map(qa => (
            <Link
              key={qa.label}
              to={qa.to}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px', borderRadius: '10px',
                background: 'var(--card)', border: '1px solid var(--border)',
                textDecoration: 'none', transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: `color-mix(in srgb, ${qa.color} 15%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0,
              }}>
                {qa.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{qa.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{qa.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
          {t.recentActivity}
        </h2>
        <div style={{
          background: 'var(--card)', borderRadius: '12px',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {recentItems.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
              {t.noActivity}
            </div>
          ) : (
            recentItems.map((item, i) => {
              const color = STATUS_COLORS[item.status] || 'var(--muted)';
              const label = t[item.status] || item.status;
              return (
                <div key={item.id} style={{
                  padding: '14px 20px',
                  borderBottom: i < recentItems.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📦</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                        {item.listing_name || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {item.requested_quantity} kg
                        {item.agreed_price
                          ? ` · Rs. ${item.agreed_price}/kg`
                          : item.proposed_price
                          ? ` · Rs. ${item.proposed_price}/kg`
                          : ''}
                        {' · from '}{item.seller_name}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                    fontWeight: 600, background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    color, whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
