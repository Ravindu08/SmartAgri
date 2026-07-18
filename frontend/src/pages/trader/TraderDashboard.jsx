import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';
import CountUp from '../../components/CountUp';
import { relativeTime } from '../../utils/relativeTime';
import SpotlightTour from '../../components/tour/SpotlightTour';
import HelpButton from '../../components/tour/HelpButton';
import GettingStartedChecklist from '../../components/checklist/GettingStartedChecklist';

const TR_TOUR_T = {
  en: {
    steps: [
      { target: 'tr-checklist', title: 'Getting started', body: 'Your path from first order to first completed purchase.' },
      { target: 'tr-quick-actions', title: 'Quick actions', body: 'Jump straight to requests, orders or transaction history.' },
      { target: 'tr-recent-activity', title: 'Recent activity', body: 'Your latest orders appear here — tap one to jump straight to its details in Orders or History.' },
      { target: 'tr-notif-bell', title: 'Stay notified', body: 'Order confirmations and delivery updates land here.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'tr-checklist', title: 'ආරම්භ කිරීම', body: 'ඔබේ පළමු ඇණවුමේ සිට පළමු සම්පූර්ණ මිලදී ගැනීම දක්වා මාර්ගය.' },
      { target: 'tr-quick-actions', title: 'ඉක්මන් ක්‍රියා', body: 'ඉල්ලීම්, ඇණවුම් හෝ ගනුදෙනු ඉතිහාසය වෙත සෘජුවම යන්න.' },
      { target: 'tr-recent-activity', title: 'මෑත ක්‍රියාකාරකම්', body: 'ඔබේ නවතම ඇණවුම් මෙහි දිස්වේ — විස්තර සඳහා ඇණවුම් හෝ ඉතිහාසය වෙත කෙලින්ම යාමට එකක් තට්ටු කරන්න.' },
      { target: 'tr-notif-bell', title: 'දැනුම්දීම් ලබාගන්න', body: 'ඇණවුම් තහවුරු කිරීම් සහ බෙදාහැරීමේ යාවත්කාලීන කිරීම් මෙහි එයි.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'tr-checklist', title: 'தொடங்குதல்', body: 'உங்கள் முதல் ஆர்டரிலிருந்து முதல் முழுமையான வாங்குதல் வரையிலான பாதை.' },
      { target: 'tr-quick-actions', title: 'விரைவு செயல்கள்', body: 'கோரிக்கைகள், ஆர்டர்கள் அல்லது பரிவர்த்தனை வரலாற்றுக்கு நேரடியாக செல்லுங்கள்.' },
      { target: 'tr-recent-activity', title: 'சமீபத்திய செயல்பாடு', body: 'உங்கள் சமீபத்திய ஆர்டர்கள் இங்கே தோன்றும் — விவரங்களுக்கு ஆர்டர்கள் அல்லது வரலாற்றுக்கு நேரடியாக செல்ல ஒன்றைத் தட்டவும்.' },
      { target: 'tr-notif-bell', title: 'அறிவிப்புகள்', body: 'ஆர்டர் உறுதிப்படுத்தல்கள் மற்றும் டெலிவரி புதுப்பிப்புகள் இங்கே வரும்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

const TR_CHECKLIST_T = {
  en: { title: 'Getting started', placeOrder: 'Place your first order', getConfirmed: 'Get an order confirmed', trackDelivery: 'Track a delivery', completeTxn: 'Complete a transaction', dismissAria: 'Dismiss checklist' },
  si: { title: 'ආරම්භ කිරීම', placeOrder: 'ඔබේ පළමු ඇණවුම දෙන්න', getConfirmed: 'ඇණවුමක් තහවුරු කරගන්න', trackDelivery: 'බෙදාහැරීමක් නිරීක්ෂණය කරන්න', completeTxn: 'ගනුදෙනුවක් සම්පූර්ණ කරන්න', dismissAria: 'විස්තර ලැයිස්තුව ඉවත් කරන්න' },
  ta: { title: 'தொடங்குதல்', placeOrder: 'உங்கள் முதல் ஆர்டரை வையுங்கள்', getConfirmed: 'ஆர்டரை உறுதிப்படுத்துங்கள்', trackDelivery: 'டெலிவரியை கண்காணிக்கவும்', completeTxn: 'பரிவர்த்தனையை முடிக்கவும்', dismissAria: 'பட்டியலை நிராகரிக்கவும்' },
};

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

  const tourT = TR_TOUR_T[lang] || TR_TOUR_T.en;
  const checklistT = TR_CHECKLIST_T[lang] || TR_CHECKLIST_T.en;
  const [tourOpen, setTourOpen] = useState(false);
  const checklistItems = [
    { id: 'firstOrder', label: checklistT.placeOrder, done: myOrders.length > 0, href: '/marketplace' },
    { id: 'confirmed', label: checklistT.getConfirmed, done: myOrders.some(o => o.status !== 'Pending'), href: '/trader/orders' },
    { id: 'delivered', label: checklistT.trackDelivery, done: myOrders.some(o => ['Delivered', 'Completed'].includes(o.status)), href: '/trader/orders' },
    { id: 'completed', label: checklistT.completeTxn, done: completedOrders.length > 0, href: '/trader/history' },
  ];

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
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '16px' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/marketplace"
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--accent)', color: 'var(--accent-text)',
            textDecoration: 'none', fontWeight: 600, fontSize: '16px',
          }}
        >
          🏪 {t.browseMarket}
        </Link>
      </div>

      <GettingStartedChecklist
        title={checklistT.title}
        items={checklistItems}
        storageKey="sa_checklist_dismissed_trader"
        dismissAria={checklistT.dismissAria}
        dataTour="tr-checklist"
      />

      {/* Stats */}
      <div data-tour="tr-dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 260px))', gap: '16px' }}>
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
            <div style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div data-tour="tr-quick-actions">
        <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
          {t.quickActions}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 260px))', gap: '12px' }}>
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
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>{qa.label}</div>
                <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '2px' }}>{qa.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div data-tour="tr-recent-activity">
        <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
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
              const dest = ['Completed', 'Rejected', 'Cancelled'].includes(item.status) ? '/trader/history' : '/trader/orders';
              return (
                <Link key={item.id} to={dest} style={{
                  padding: '14px 20px', textDecoration: 'none',
                  borderBottom: i < recentItems.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  transition: 'background var(--tr)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '19px' }}>📦</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                        {item.listing_name || '—'}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '14px',
                      fontWeight: 600, background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      color, whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                    {item.updated_at && (
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{relativeTime(item.updated_at)}</span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <HelpButton label={tourT.needHelp} ariaLabel={tourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={tourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        labels={{ next: tourT.next, back: tourT.back, skip: tourT.skip, done: tourT.done }}
      />

    </div>
  );
}
