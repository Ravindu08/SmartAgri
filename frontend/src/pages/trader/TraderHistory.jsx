import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';

const T = {
  en: {
    title: 'Transaction History', subtitle: 'A record of all your completed and cancelled transactions',
    noHistory: 'No transaction history yet.', noHistorySub: 'Completed and cancelled orders will appear here.',
    goToMarket: 'Browse Marketplace',
    crop: 'Crop', qty: 'Quantity', price: 'Price / kg', totalSpent: 'Total Spent',
    seller: 'Seller', orderedOn: 'Date', status: 'Status',
    Completed: 'Completed', Cancelled: 'Cancelled', Rejected: 'Rejected',
    filterAll: 'All', filterCompleted: 'Completed', filterCancelled: 'Cancelled',
    summary: 'Summary', totalOrders: 'Total Orders', totalValue: 'Total Value',
    perKg: '/kg',
  },
  si: {
    title: 'ගනුදෙනු ඉතිහාසය', subtitle: 'ඔබේ සම්පූර්ණ ගනුදෙනු වාර්තාව',
    noHistory: 'ගනුදෙනු ඉතිහාසය නොමැත.', noHistorySub: 'සම්පූර්ණ ඇණවුම් මෙහිදී දිස් වේ.',
    goToMarket: 'වෙළඳසැල බලන්න',
    crop: 'බෝගය', qty: 'ප්‍රමාණය', price: 'මිල / kg', totalSpent: 'මුළු වියදම',
    seller: 'විකුණුම්කරු', orderedOn: 'දිනය', status: 'තත්ත්වය',
    Completed: 'සම්පූර්ණ', Cancelled: 'අවලංගු', Rejected: 'ප්‍රතික්ෂේප',
    filterAll: 'සියල්ල', filterCompleted: 'සම්පූර්ණ', filterCancelled: 'අවලංගු',
    summary: 'සාරාංශය', totalOrders: 'මුළු ඇණවුම්', totalValue: 'මුළු වටිනාකම',
    perKg: '/kg',
  },
  ta: {
    title: 'பரிவர்த்தனை வரலாறு', subtitle: 'உங்கள் அனைத்து பரிவர்த்தனைகளின் பதிவு',
    noHistory: 'பரிவர்த்தனை வரலாறு இல்லை.', noHistorySub: 'முடிந்த மற்றும் ரத்தான ஆர்டர்கள் இங்கே தோன்றும்.',
    goToMarket: 'சந்தையை உலாவுக',
    crop: 'பயிர்', qty: 'அளவு', price: 'விலை / kg', totalSpent: 'மொத்த செலவு',
    seller: 'விற்பனையாளர்', orderedOn: 'தேதி', status: 'நிலை',
    Completed: 'முடிந்தது', Cancelled: 'ரத்து', Rejected: 'நிராகரிக்கப்பட்டது',
    filterAll: 'அனைத்தும்', filterCompleted: 'முடிந்தவை', filterCancelled: 'ரத்தானவை',
    summary: 'சுருக்கம்', totalOrders: 'மொத்த ஆர்டர்கள்', totalValue: 'மொத்த மதிப்பு',
    perKg: '/kg',
  },
};

const STATUS_STYLE = {
  Completed: { bg: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)' },
  Cancelled: { bg: 'color-mix(in srgb, var(--muted) 20%, transparent)', color: 'var(--muted)' },
  Rejected:  { bg: 'color-mix(in srgb, var(--red)   15%, transparent)', color: 'var(--red)' },
};

const authFetcher = url => request(url);

export default function TraderHistory() {
  const { lang } = useApp();
  const t        = T[lang] || T.en;
  const { user } = getAuthSession();

  const [filter, setFilter] = useState('all');

  const { data: rawOrders, isLoading } = useSWR('/api/marketplace/orders', authFetcher, { refreshInterval: 15000 });
  const allOrders = Array.isArray(rawOrders) ? rawOrders : [];

  const historyOrders = useMemo(
    () => allOrders
      .filter(o => o.buyer_id === user?.id && ['Completed', 'Cancelled', 'Rejected'].includes(o.status))
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)),
    [allOrders, user?.id],
  );

  const filtered = useMemo(
    () => filter === 'all' ? historyOrders : historyOrders.filter(o => o.status === filter),
    [historyOrders, filter],
  );

  const completedOrders = historyOrders.filter(o => o.status === 'Completed');
  const totalValue      = completedOrders.reduce((sum, o) => sum + ((o.agreed_price || o.proposed_price || 0) * (o.requested_quantity || 0)), 0);

  const filters = [
    { key: 'all',       label: t.filterAll },
    { key: 'Completed', label: t.filterCompleted },
    { key: 'Cancelled', label: t.filterCancelled },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>{t.subtitle}</p>
        </div>
        <Link
          to="/marketplace"
          style={{
            padding: '10px 18px', borderRadius: '8px',
            background: 'var(--accent)', color: 'var(--accent-text)',
            textDecoration: 'none', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap',
          }}
        >
          🏪 {t.goToMarket}
        </Link>
      </div>

      {/* Summary cards */}
      {historyOrders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>{historyOrders.length}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{t.totalOrders}</div>
          </div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--green)' }}>
              Rs. {totalValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{t.totalValue}</div>
          </div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--green)' }}>{completedOrders.length}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{t.completed}</div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px',
              border: filter === f.key ? '2px solid var(--accent)' : '1.5px solid var(--border)',
              background: filter === f.key ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--card)',
              color: filter === f.key ? 'var(--accent)' : 'var(--muted)',
              fontWeight: filter === f.key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f.label}
            <span style={{ marginLeft: '6px', opacity: 0.7 }}>
              ({f.key === 'all' ? historyOrders.length : historyOrders.filter(o => o.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📜</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{t.noHistory}</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>{t.noHistorySub}</div>
          <Link
            to="/marketplace"
            style={{
              padding: '10px 20px', borderRadius: '8px',
              background: 'var(--accent)', color: 'var(--accent-text)',
              textDecoration: 'none', fontWeight: 600, fontSize: '14px',
            }}
          >
            🏪 {t.goToMarket}
          </Link>
        </div>
      ) : (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            gap: '8px', padding: '12px 20px',
            background: 'var(--surface-1)',
            fontSize: '11px', color: 'var(--muted)',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <div>{t.crop}</div>
            <div>{t.qty}</div>
            <div>{t.price}</div>
            <div>{t.totalSpent}</div>
            <div>{t.status}</div>
          </div>

          {/* Rows */}
          {filtered.map((order, i) => {
            const stStyle = STATUS_STYLE[order.status] || STATUS_STYLE.Completed;
            const price   = order.agreed_price || order.proposed_price || 0;
            const total   = (price * (order.requested_quantity || 0)).toFixed(2);
            return (
              <div key={order.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                gap: '8px', padding: '14px 20px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>
                    {order.listing_name || '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    {order.seller_name} ·{' '}
                    {order.updated_at
                      ? new Date(order.updated_at).toLocaleDateString()
                      : order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>{order.requested_quantity} kg</div>
                <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                  {price ? `Rs. ${price}${t.perKg}` : '—'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: order.status === 'Completed' ? 'var(--green)' : 'var(--muted)' }}>
                  {order.status === 'Completed' ? `Rs. ${total}` : '—'}
                </div>
                <div>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px',
                    fontWeight: 600, background: stStyle.bg, color: stStyle.color,
                  }}>
                    {t[order.status] || order.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
