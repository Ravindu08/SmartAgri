import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession } from '../../services/api';

const T = {
  en: {
    welcome: 'Welcome back', trader: 'Trader',
    statsRequests: 'Total Requests', statsOrders: 'Total Orders',
    statsActive: 'Active Orders', statsCompleted: 'Completed',
    quickActions: 'Quick Actions', browseMarket: 'Browse Marketplace',
    browseMarketDesc: 'Find crops available for purchase',
    viewRequests: 'My Requests', viewRequestsDesc: 'Track your purchase requests',
    viewOrders: 'My Orders', viewOrdersDesc: 'Monitor your active orders',
    viewHistory: 'Transaction History', viewHistoryDesc: 'View past transactions',
    recentActivity: 'Recent Activity', noActivity: 'No recent activity.',
    pending: 'Pending', confirmed: 'Confirmed', delivered: 'Delivered',
    completed: 'Completed', rejected: 'Rejected', cancelled: 'Cancelled',
    accepted: 'Accepted', request: 'Request', order: 'Order',
  },
  si: {
    welcome: 'නැවත සාදරයෙන් පිළිගනිමු', trader: 'වෙළෙන්ද',
    statsRequests: 'මුළු ඉල්ලීම්', statsOrders: 'මුළු ඇණවුම්',
    statsActive: 'ක්‍රියාත්මක ඇණවුම්', statsCompleted: 'සම්පූර්ණ',
    quickActions: 'ඉක්මන් ක්‍රියා', browseMarket: 'වෙළඳසැල බලන්න',
    browseMarketDesc: 'මිලදී ගත හැකි බෝග සොයන්න',
    viewRequests: 'මගේ ඉල්ලීම්', viewRequestsDesc: 'ඔබේ ඉල්ලීම් ට්‍රැක් කරන්න',
    viewOrders: 'මගේ ඇණවුම්', viewOrdersDesc: 'ක්‍රියාත්මක ඇණවුම් නිරීක්ෂණය කරන්න',
    viewHistory: 'ගනුදෙනු ඉතිහාසය', viewHistoryDesc: 'පසුගිය ගනුදෙනු බලන්න',
    recentActivity: 'මෑත ක්‍රියාකාරකම්', noActivity: 'මෑත ක්‍රියාකාරකම් නොමැත.',
    pending: 'අපේක්ෂිත', confirmed: 'තහවුරු', delivered: 'බෙදාදුන්',
    completed: 'සම්පූර්ණ', rejected: 'ප්‍රතික්ෂේප', cancelled: 'අවලංගු',
    accepted: 'පිළිගත්', request: 'ඉල්ලීම', order: 'ඇණවුම',
  },
  ta: {
    welcome: 'மீண்டும் வருக', trader: 'கடைவர்',
    statsRequests: 'மொத்த கோரிக்கைகள்', statsOrders: 'மொத்த ஆர்டர்கள்',
    statsActive: 'செயலில் உள்ள ஆர்டர்கள்', statsCompleted: 'முடிந்தவை',
    quickActions: 'விரைவு செயல்கள்', browseMarket: 'சந்தையை உலாவுக',
    browseMarketDesc: 'வாங்கக் கிடைக்கும் பயிர்களைக் கண்டறியவும்',
    viewRequests: 'என் கோரிக்கைகள்', viewRequestsDesc: 'உங்கள் கோரிக்கைகளை கண்காணிக்கவும்',
    viewOrders: 'என் ஆர்டர்கள்', viewOrdersDesc: 'செயலில் உள்ள ஆர்டர்களை கண்காணிக்கவும்',
    viewHistory: 'பரிவர்த்தனை வரலாறு', viewHistoryDesc: 'கடந்த பரிவர்த்தனைகளை பார்க்கவும்',
    recentActivity: 'சமீபத்திய செயல்பாடு', noActivity: 'சமீபத்திய செயல்பாடு இல்லை.',
    pending: 'நிலுவையில்', confirmed: 'உறுதிப்படுத்தப்பட்டது', delivered: 'வழங்கப்பட்டது',
    completed: 'முடிந்தது', rejected: 'நிராகரிக்கப்பட்டது', cancelled: 'ரத்து',
    accepted: 'ஏற்கப்பட்டது', request: 'கோரிக்கை', order: 'ஆர்டர்',
  },
};

const STATUS_COLORS = {
  pending: 'var(--amber)', confirmed: 'var(--blue)', delivered: 'var(--green-mid)',
  completed: 'var(--green)', rejected: 'var(--red)', cancelled: 'var(--muted)',
  accepted: 'var(--green)',
};

const fetcher = url => fetch(url).then(r => r.json());

export default function TraderDashboard() {
  const { lang }  = useApp();
  const t         = T[lang] || T.en;
  const { user }  = getAuthSession();
  const myName    = user?.full_name || '';

  const { data: requestsData } = useSWR('/api/requests', fetcher, { refreshInterval: 4000 });
  const { data: ordersData }   = useSWR('/api/orders',   fetcher, { refreshInterval: 4000 });
  const requests = requestsData?.requests ?? [];
  const orders   = ordersData?.orders     ?? [];

  const myRequests = useMemo(() => requests.filter(r => r.traderName === myName), [requests, myName]);
  const myOrders   = useMemo(() => orders.filter(o => o.traderName === myName),   [orders,   myName]);

  const activeOrders    = myOrders.filter(o => ['pending', 'confirmed', 'delivered'].includes(o.status));
  const completedOrders = myOrders.filter(o => o.status === 'completed');

  const recentItems = useMemo(() => {
    const rs = myRequests.slice(-3).reverse().map(r => ({ ...r, _type: 'request' }));
    const os = myOrders.slice(-3).reverse().map(o => ({ ...o, _type: 'order' }));
    return [...rs, ...os].sort((a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    ).slice(0, 6);
  }, [myRequests, myOrders]);

  const stats = [
    { label: t.statsRequests, value: myRequests.length, icon: '📋', color: 'var(--blue)' },
    { label: t.statsOrders,   value: myOrders.length,   icon: '📦', color: 'var(--accent)' },
    { label: t.statsActive,   value: activeOrders.length,    icon: '🔄', color: 'var(--amber)' },
    { label: t.statsCompleted, value: completedOrders.length, icon: '✅', color: 'var(--green)' },
  ];

  const quickActions = [
    { to: '/marketplace',     icon: '🏪', label: t.browseMarket,  desc: t.browseMarketDesc,  color: 'var(--accent)' },
    { to: '/trader/requests', icon: '📋', label: t.viewRequests,  desc: t.viewRequestsDesc,  color: 'var(--blue)' },
    { to: '/trader/orders',   icon: '📦', label: t.viewOrders,    desc: t.viewOrdersDesc,    color: 'var(--amber)' },
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
          <div key={s.label} style={{
            background: 'var(--card)', borderRadius: '12px',
            padding: '20px', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '28px' }}>{s.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
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
              const isReq   = item._type === 'request';
              const status  = item.status?.toLowerCase() || 'pending';
              const color   = STATUS_COLORS[status] || 'var(--muted)';
              const label   = t[status] || status;
              return (
                <div key={item.id} style={{
                  padding: '14px 20px',
                  borderBottom: i < recentItems.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>{isReq ? '📋' : '📦'}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                        {item.cropName || item.listingName || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {isReq ? t.request : t.order} ·{' '}
                        {item.quantity}{item.unit ? ` ${item.unit}` : 'kg'}
                        {item.maxBudget ? ` · $${item.maxBudget}/kg` : ''}
                        {item.offeredPrice ? ` · $${item.offeredPrice}/kg` : ''}
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
