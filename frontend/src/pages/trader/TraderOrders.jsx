import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import PayDialog from '../../components/PayDialog';
import { SkeletonRows } from '../../components/Skeleton';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';
import SpotlightTour   from '../../components/tour/SpotlightTour';
import useAutoOpenOnce from '../../components/tour/useAutoOpenOnce';
import HelpButton      from '../../components/tour/HelpButton';

const TRO_TOUR_T = {
  en: {
    steps: [
      { target: 'tr-orders-filters', title: 'Filter your orders', body: 'Switch between all orders, confirmed, or delivered.' },
      { target: 'tr-orders-card', title: 'Order details', body: 'Each card shows the crop, quantity, price, and current status.' },
      { target: 'tr-orders-status-tracker', title: 'Track progress', body: 'Follow an order from confirmed through delivered to completed. Pay Now or Confirm Receipt buttons appear here when it’s your turn to act.' },
      { target: 'tr-orders-pay-btn', title: 'Pay when confirmed', body: 'Once a seller confirms your order, pay securely right here to move it toward delivery.' },
      { target: 'tr-orders-confirm-btn', title: 'Confirm once delivered', body: 'After you receive your order, confirm receipt here to complete the transaction.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'tr-orders-filters', title: 'ඔබේ ඇණවුම් පෙරහන් කරන්න', body: 'සියලුම ඇණවුම්, තහවුරු කළ, හෝ බෙදාහරින ලද අතර මාරු වන්න.' },
      { target: 'tr-orders-card', title: 'ඇණවුම් විස්තර', body: 'සෑම කාඩ්පතක්ම බෝගය, ප්‍රමාණය, මිල, සහ වත්මන් තත්ත්වය පෙන්වයි.' },
      { target: 'tr-orders-status-tracker', title: 'ප්‍රගතිය ලුහුබඳින්න', body: 'ඇණවුමක් තහවුරු කිරීමේ සිට බෙදාහැරීම හරහා සම්පූර්ණ වන තෙක් අනුගමනය කරන්න. ඔබේ වාරය එද්දී මුදල් ගෙවන්න හෝ ලැබීම තහවුරු කරන්න බොත්තම් මෙහි දිස්වේ.' },
      { target: 'tr-orders-pay-btn', title: 'තහවුරු වූ පසු ගෙවන්න', body: 'විකුණුම්කරු ඔබේ ඇණවුම තහවුරු කළ පසු, බෙදාහැරීම දෙසට ගෙන යාමට මෙතැනින්ම ආරක්ෂිතව ගෙවන්න.' },
      { target: 'tr-orders-confirm-btn', title: 'බෙදාහැරුණු පසු තහවුරු කරන්න', body: 'ඔබේ ඇණවුම ලැබුණු පසු, ගනුදෙනුව සම්පූර්ණ කිරීමට මෙහි ලැබීම තහවුරු කරන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'tr-orders-filters', title: 'உங்கள் ஆர்டர்களை வடிகட்டவும்', body: 'அனைத்து ஆர்டர்கள், உறுதிசெய்யப்பட்டவை அல்லது வழங்கப்பட்டவை இடையே மாறவும்.' },
      { target: 'tr-orders-card', title: 'ஆர்டர் விவரங்கள்', body: 'ஒவ்வொரு அட்டையும் பயிர், அளவு, விலை மற்றும் தற்போதைய நிலையைக் காட்டுகிறது.' },
      { target: 'tr-orders-status-tracker', title: 'முன்னேற்றத்தைக் கண்காணிக்கவும்', body: 'உறுதிசெய்யப்பட்டதிலிருந்து வழங்கப்பட்டு முடிக்கப்படும் வரை ஒரு ஆர்டரைப் பின்தொடருங்கள். உங்கள் முறை வரும்போது இப்போது செலுத்து அல்லது பெறுதலை உறுதிப்படுத்து பொத்தான்கள் இங்கே தோன்றும்.' },
      { target: 'tr-orders-pay-btn', title: 'உறுதிசெய்யப்பட்டதும் செலுத்துங்கள்', body: 'விற்பனையாளர் உங்கள் ஆர்டரை உறுதிப்படுத்திய பிறகு, டெலிவரிக்கு நகர்த்த இங்கேயே பாதுகாப்பாக செலுத்துங்கள்.' },
      { target: 'tr-orders-confirm-btn', title: 'வழங்கியதும் உறுதிப்படுத்துங்கள்', body: 'உங்கள் ஆர்டரைப் பெற்ற பிறகு, பரிவர்த்தனையை முடிக்க இங்கே பெறுதலை உறுதிப்படுத்துங்கள்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

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
    payNow: 'Pay Now', paymentPaid: '✓ Paid', awaitingPayment: 'Awaiting Payment',
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
    payNow: 'දැන් ගෙවන්න', paymentPaid: '✓ ගෙවා ඇත', awaitingPayment: 'ගෙවීම බලාපොරොත්තුවෙන්',
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
    payNow: 'இப்போது செலுத்து', paymentPaid: '✓ செலுத்தப்பட்டது', awaitingPayment: 'கட்டணத்திற்காக காத்திருக்கிறது',
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
              fontSize: '12.5px', color: done ? 'var(--accent-text)' : 'var(--muted)',
              boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
              transition: 'all 0.2s',
            }}>
              {done ? '✓' : i + 1}
            </div>
            <div style={{
              fontSize: '11.5px', marginTop: '4px', textAlign: 'center',
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
  const [payingOrder, setPayingOrder] = useState(null);

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
  const troTourT = TRO_TOUR_T[lang] || TRO_TOUR_T.en;
  const [tourOpen, setTourOpen] = useAutoOpenOnce('sa_tour_trorders_seen_v1', !isLoading);

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
          <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 700, color: 'var(--text)' }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '16px' }}>{t.subtitle}</p>
        </div>
        <Link
          to="/marketplace"
          style={{
            padding: '10px 18px', borderRadius: '8px',
            background: 'var(--accent)', color: 'var(--accent-text)',
            textDecoration: 'none', fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap',
          }}
        >
          🏪 {t.goToMarket}
        </Link>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} data-tour="tr-orders-filters">
        {filters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '15px',
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
        <SkeletonRows count={3} />
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{t.noOrders}</div>
          <div style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '20px' }}>{t.noOrdersSub}</div>
          <Link
            to="/marketplace"
            style={{
              padding: '10px 20px', borderRadius: '8px',
              background: 'var(--accent)', color: 'var(--accent-text)',
              textDecoration: 'none', fontWeight: 600, fontSize: '16px',
            }}
          >
            🏪 {t.goToMarket}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((order, i) => {
            const stStyle = STATUS_STYLE[order.status] || { bg: 'color-mix(in srgb, var(--muted) 15%, transparent)', color: 'var(--muted)' };
            const tKey    = order.status?.toLowerCase();
            return (
              <div key={order.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '20px',
              }} data-tour={i === 0 ? 'tr-orders-card' : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, maxWidth: '100%' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.crop}</div>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)', overflowWrap: 'break-word' }}>{order.listing_name || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.qty}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{order.requested_quantity} kg</div>
                    </div>
                    {(order.agreed_price || order.proposed_price) && (
                      <div>
                        <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.price}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>Rs. {order.agreed_price || order.proposed_price}/kg</div>
                      </div>
                    )}
                    <div style={{ minWidth: 0, maxWidth: '100%' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', overflowWrap: 'break-word' }}>{order.seller_name}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '15px',
                    fontWeight: 600, background: stStyle.bg, color: stStyle.color,
                    alignSelf: 'flex-start',
                  }}>
                    {t[tKey] || order.status}
                  </span>
                </div>

                <div data-tour={i === 0 ? 'tr-orders-status-tracker' : undefined}>
                  <StatusTracker status={order.status} t={t} />
                </div>

                {order.status === 'Confirmed' && order.payment_status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={() => setPayingOrder(order)}
                    data-tour={i === 0 ? 'tr-orders-pay-btn' : undefined}
                    style={{
                      marginTop: '12px', padding: '9px 18px', borderRadius: '8px', border: 'none',
                      background: 'var(--accent)', color: 'var(--accent-text)',
                      fontWeight: 600, fontSize: '16px', cursor: 'pointer',
                    }}
                  >
                    💳 {t.payNow}
                  </button>
                )}

                {order.status === 'Delivered' && (
                  <button
                    type="button"
                    onClick={() => confirmReceipt(order.id)}
                    disabled={confirmingId === order.id}
                    data-tour={i === 0 ? 'tr-orders-confirm-btn' : undefined}
                    style={{
                      marginTop: '12px', padding: '9px 18px', borderRadius: '8px', border: 'none',
                      background: 'var(--accent)', color: 'var(--accent-text)',
                      fontWeight: 600, fontSize: '16px', cursor: 'pointer',
                      opacity: confirmingId === order.id ? 0.6 : 1,
                    }}
                  >
                    ✓ {confirmingId === order.id ? t.confirming : t.confirmReceipt}
                  </button>
                )}

                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {t.orderedOn}: {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                  </span>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                      {t.updatedOn}: {new Date(order.updated_at).toLocaleDateString()}
                    </span>
                  )}
                  {order.seller_note && (
                    <span style={{ fontSize: '14px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      Note: {order.seller_note}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payingOrder && (
        <PayDialog
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onSuccess={() => { setPayingOrder(null); mutate('/api/marketplace/orders'); }}
        />
      )}

      <HelpButton label={troTourT.needHelp} ariaLabel={troTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={troTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey="sa_tour_trorders_seen_v1"
        labels={{ next: troTourT.next, back: troTourT.back, skip: troTourT.skip, done: troTourT.done }}
      />
    </div>
  );
}
