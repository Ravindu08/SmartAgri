import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';

const T = {
  en: {
    title: 'Pending Orders', subtitle: 'Orders you placed that are awaiting seller confirmation',
    goToMarket: 'Place New Order',
    noRequests: 'No pending orders.', noRequestsSub: 'Browse the marketplace and place orders on available listings.',
    crop: 'Listing', qty: 'Quantity', offeredPrice: 'Offered Price', seller: 'Seller',
    placedOn: 'Placed on', yourNote: 'Your note',
    Pending: 'Awaiting Confirmation',
  },
  si: {
    title: 'අපේක්ෂිත ඇණවුම්', subtitle: 'විකුණුම්කරු තහවුරු කිරීමට රැඳෙන ඔබේ ඇණවුම්',
    goToMarket: 'නව ඇණවුම',
    noRequests: 'අපේක්ෂිත ඇණවුම් නොමැත.', noRequestsSub: 'වෙළඳසැලේ ලැයිස්තු මත ඇණවුම් ලබා දෙන්න.',
    crop: 'ලැයිස්තුව', qty: 'ප්‍රමාණය', offeredPrice: 'ඉදිරිපත් කළ මිල', seller: 'විකුණුම්කරු',
    placedOn: 'ඇණවුම් කළ දිනය', yourNote: 'ඔබේ සටහන',
    Pending: 'තහවුරු ගොනු',
  },
  ta: {
    title: 'நிலுவை ஆர்டர்கள்', subtitle: 'விற்பனையாளர் உறுதிப்படுத்தல் காக்கும் ஆர்டர்கள்',
    goToMarket: 'புதிய ஆர்டர்',
    noRequests: 'நிலுவை ஆர்டர்கள் இல்லை.', noRequestsSub: 'சந்தையில் பட்டியல்களை பார்த்து ஆர்டர் செய்யுங்கள்.',
    crop: 'பட்டியல்', qty: 'அளவு', offeredPrice: 'வழங்கிய விலை', seller: 'விற்பனையாளர்',
    placedOn: 'ஆர்டர் தேதி', yourNote: 'உங்கள் குறிப்பு',
    Pending: 'உறுதிப்படுத்தல் காக்கிறது',
  },
};

const authFetcher = url => request(url);

export default function TraderRequests() {
  const { lang } = useApp();
  const t        = T[lang] || T.en;
  const { user } = getAuthSession();

  const { data: rawOrders, isLoading } = useSWR('/api/marketplace/orders', authFetcher, { refreshInterval: 8000 });
  const allOrders = Array.isArray(rawOrders) ? rawOrders : [];

  const pendingOrders = useMemo(
    () => allOrders
      .filter(o => o.buyer_id === user?.id && o.status === 'Pending')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [allOrders, user?.id],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
            {t.subtitle} ({pendingOrders.length})
          </p>
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

      {/* List */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
      ) : pendingOrders.length === 0 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{t.noRequests}</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>{t.noRequestsSub}</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingOrders.map(order => (
            <div key={order.id} style={{
              background: 'var(--card)', border: '2px solid color-mix(in srgb, var(--amber) 35%, var(--border))',
              borderRadius: '12px', padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.crop}</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>{order.listing_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.qty}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.requested_quantity} kg</div>
                  </div>
                  {order.proposed_price && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.offeredPrice}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>Rs. {order.proposed_price}/kg</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.seller}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.seller_name}</div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                  fontWeight: 600,
                  background: 'color-mix(in srgb, var(--amber) 15%, transparent)',
                  color: 'var(--amber)', alignSelf: 'flex-start', whiteSpace: 'nowrap',
                }}>
                  ⏳ {t.Pending}
                </span>
              </div>

              {order.buyer_note && (
                <div style={{
                  marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                  background: 'var(--surface-1)', fontSize: '14px', color: 'var(--text)',
                  fontStyle: 'italic',
                }}>
                  {t.yourNote}: "{order.buyer_note}"
                </div>
              )}

              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                {t.placedOn}: {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
