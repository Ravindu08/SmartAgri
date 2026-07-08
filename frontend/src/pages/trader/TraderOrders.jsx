import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';

const T = {
  en: {
    title: 'My Active Orders', subtitle: 'Monitor orders that are in progress',
    goToMarket: 'Browse More', noOrders: 'No active orders.',
    noOrdersSub: 'Place orders in the marketplace to see them here.',
    crop: 'Crop', qty: 'Quantity', price: 'Price', status: 'Status',
    orderedOn: 'Ordered on', updatedOn: 'Updated',
    pending: 'Pending', confirmed: 'Confirmed', delivered: 'Delivered',
    filterAll: 'All Active', filterPending: 'Pending', filterConfirmed: 'Confirmed', filterDelivered: 'Delivered',
    statusTrackerTitle: 'Order Progress',
    stepPending: 'Order Placed', stepConfirmed: 'Confirmed', stepDelivered: 'Delivered', stepCompleted: 'Completed',
    confirmReceipt: 'Confirm Receipt', confirming: 'Confirming…',
  },
  si: {
    title: 'මගේ ක්‍රියාත්මක ඇණවුම්', subtitle: 'ක්‍රියාත්මකව ඇති ඇණවුම් නිරීක්ෂණය කරන්න',
    goToMarket: 'තවත් බලන්න', noOrders: 'ක්‍රියාත්මක ඇණවුම් නොමැත.',
    noOrdersSub: 'ඇණවුම් ඇතිකර ගැනීමට වෙළඳසැල භාවිතා කරන්න.',
    crop: 'බෝගය', qty: 'ප්‍රමාණය', price: 'මිල', status: 'තත්ත්වය',
    orderedOn: 'ඇණවුම් කළ දිනය', updatedOn: 'යාවත්කාලීන',
    pending: 'අපේක්ෂිත', confirmed: 'තහවුරු', delivered: 'බෙදාදුන්',
    filterAll: 'සියල්ල', filterPending: 'අපේක්ෂිත', filterConfirmed: 'තහවුරු', filterDelivered: 'බෙදාදුන්',
    statusTrackerTitle: 'ඇණවුම් ප්‍රගතිය',
    stepPending: 'ඇණවුම ලැබිණ', stepConfirmed: 'තහවුරු', stepDelivered: 'බෙදාදුන්', stepCompleted: 'සම්පූර්ණ',
    confirmReceipt: 'ලැබීම තහවුරු කරන්න', confirming: 'තහවුරු කරමින්…',
  },
  ta: {
    title: 'என் செயலில் உள்ள ஆர்டர்கள்', subtitle: 'நடந்துகொண்டிருக்கும் ஆர்டர்களை கண்காணிக்கவும்',
    goToMarket: 'மேலும் பார்க்கவும்', noOrders: 'செயலில் உள்ள ஆர்டர்கள் இல்லை.',
    noOrdersSub: 'சந்தையில் ஆர்டர்கள் செய்து இங்கே காணுங்கள்.',
    crop: 'பயிர்', qty: 'அளவு', price: 'விலை', status: 'நிலை',
    orderedOn: 'ஆர்டர் தேதி', updatedOn: 'புதுப்பிக்கப்பட்டது',
    pending: 'நிலுவையில்', confirmed: 'உறுதிப்படுத்தப்பட்டது', delivered: 'வழங்கப்பட்டது',
    filterAll: 'அனைத்தும்', filterPending: 'நிலுவை', filterConfirmed: 'உறுதி', filterDelivered: 'வழங்கல்',
    statusTrackerTitle: 'ஆர்டர் முன்னேற்றம்',
    stepPending: 'ஆர்டர் வைக்கப்பட்டது', stepConfirmed: 'உறுதி', stepDelivered: 'வழங்கல்', stepCompleted: 'முடிந்தது',
    confirmReceipt: 'பெறுதலை உறுதிப்படுத்து', confirming: 'உறுதிப்படுத்துகிறது…',
  },
};

const STEPS_LOWER = ['pending', 'confirmed', 'delivered', 'completed'];

const STATUS_STYLE = {
  Confirmed: { bg: 'color-mix(in srgb, var(--blue)     15%, transparent)', color: 'var(--blue)' },
  Delivered: { bg: 'color-mix(in srgb, var(--green-mid)15%, transparent)', color: 'var(--green-mid)' },
};

const authFetcher = url => request(url);

function StatusTracker({ status, t }) {
  const stepLabels = [t.stepPending, t.stepConfirmed, t.stepDelivered, t.stepCompleted];
  const current    = STEPS_LOWER.indexOf((status || '').toLowerCase());
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginTop: '16px', padding: '14px', background: 'var(--surface-1)', borderRadius: '10px' }}>
      {STEPS_LOWER.map((step, i) => {
        const done   = i <= current;
        const active = i === current;
        return (
          <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute', top: '12px', right: '50%', left: '-50%',
                height: '3px',
                background: i <= current ? 'var(--accent)' : 'var(--border)',
              }} />
            )}
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%', zIndex: 1,
              background: done ? 'var(--accent)' : 'var(--border)',
              border: active ? '3px solid var(--accent-text)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: done ? 'var(--accent-text)' : 'var(--muted)',
              boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
              transition: 'all 0.2s',
            }}>
              {done ? '✓' : i + 1}
            </div>
            <div style={{
              fontSize: '10px', marginTop: '4px', textAlign: 'center',
              color: done ? 'var(--accent)' : 'var(--muted)',
              fontWeight: active ? 700 : 400,
            }}>
              {stepLabels[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TraderOrders() {
  const { lang } = useApp();
  const t        = T[lang] || T.en;
  const { user } = getAuthSession();

  const [filter, setFilter] = useState('all');
  const [confirmingId, setConfirmingId] = useState(null);

  async function confirmReceipt(orderId) {
    setConfirmingId(orderId);
    try {
      await request(`/api/marketplace/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Completed' }),
      });
      mutate('/api/marketplace/orders');
    } catch { /* order list refreshes on next poll */ }
    finally { setConfirmingId(null); }
  }

  const { data: rawOrders, isLoading } = useSWR('/api/marketplace/orders', authFetcher, { refreshInterval: 8000 });
  const allOrders = Array.isArray(rawOrders) ? rawOrders : [];

  const activeOrders = useMemo(
    () => allOrders.filter(o => o.buyer_id === user?.id && ['Confirmed', 'Delivered'].includes(o.status)),
    [allOrders, user?.id],
  );

  const filtered = useMemo(
    () => filter === 'all' ? activeOrders : activeOrders.filter(o => o.status === filter),
    [activeOrders, filter],
  );

  const filters = [
    { key: 'all',       label: t.filterAll },
    { key: 'Confirmed', label: t.filterConfirmed },
    { key: 'Delivered', label: t.filterDelivered },
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
              ({f.key === 'all' ? activeOrders.length : activeOrders.filter(o => o.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{t.noOrders}</div>
          <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>{t.noOrdersSub}</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(order => {
            const stStyle = STATUS_STYLE[order.status] || { bg: 'color-mix(in srgb, var(--muted) 15%, transparent)', color: 'var(--muted)' };
            const tKey    = order.status?.toLowerCase();
            return (
              <div key={order.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
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
                    {(order.agreed_price || order.proposed_price) && (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.price}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Rs. {order.agreed_price || order.proposed_price}/kg</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.seller_name}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                    fontWeight: 600, background: stStyle.bg, color: stStyle.color,
                    alignSelf: 'flex-start',
                  }}>
                    {t[tKey] || order.status}
                  </span>
                </div>

                <StatusTracker status={order.status} t={t} />

                {order.status === 'Delivered' && (
                  <button
                    type="button"
                    onClick={() => confirmReceipt(order.id)}
                    disabled={confirmingId === order.id}
                    style={{
                      marginTop: '12px', padding: '9px 18px', borderRadius: '8px', border: 'none',
                      background: 'var(--accent)', color: 'var(--accent-text)',
                      fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      opacity: confirmingId === order.id ? 0.6 : 1,
                    }}
                  >
                    ✓ {confirmingId === order.id ? t.confirming : t.confirmReceipt}
                  </button>
                )}

                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {t.orderedOn}: {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                  </span>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {t.updatedOn}: {new Date(order.updated_at).toLocaleDateString()}
                    </span>
                  )}
                  {order.seller_note && (
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      Note: {order.seller_note}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
