import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession, request } from '../../services/api';
import { SkeletonRows } from '../../components/Skeleton';
import SpotlightTour   from '../../components/tour/SpotlightTour';
import useAutoOpenOnce from '../../components/tour/useAutoOpenOnce';
import HelpButton      from '../../components/tour/HelpButton';

const TRQ_TOUR_T = {
  en: {
    steps: [
      { target: 'tr-req-place-order-btn', title: 'Place a new order', body: 'Jump to the marketplace to browse listings and send a purchase request.' },
      { target: 'tr-req-card', title: 'Your pending requests', body: 'These are orders awaiting the seller’s confirmation — you’ll be notified once they respond.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'tr-req-place-order-btn', title: 'නව ඇණවුමක් තබන්න', body: 'ලැයිස්තු පිරික්සීමට සහ මිලදී ගැනීමේ ඉල්ලීමක් යැවීමට වෙළඳසැලට යන්න.' },
      { target: 'tr-req-card', title: 'ඔබේ අපේක්ෂිත ඉල්ලීම්', body: 'මේවා විකුණුම්කරුගේ තහවුරු කිරීමට රැඳෙන ඇණවුම් — ඔවුන් ප්‍රතිචාර දැක්වූ පසු ඔබට දැනුම් දෙනු ලැබේ.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'tr-req-place-order-btn', title: 'புதிய ஆர்டரை வையுங்கள்', body: 'பட்டியல்களை உலாவ மற்றும் வாங்குதல் கோரிக்கையை அனுப்ப சந்தைக்குச் செல்லுங்கள்.' },
      { target: 'tr-req-card', title: 'உங்கள் நிலுவை கோரிக்கைகள்', body: 'இவை விற்பனையாளரின் உறுதிப்படுத்தலுக்காக காத்திருக்கும் ஆர்டர்கள் — அவர்கள் பதிலளித்தவுடன் உங்களுக்கு அறிவிக்கப்படும்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

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
  const trqTourT = TRQ_TOUR_T[lang] || TRQ_TOUR_T.en;
  const [tourOpen, setTourOpen] = useAutoOpenOnce('sa_tour_trrequests_seen_v1', !isLoading);

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
          <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 700, color: 'var(--text)' }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '16px' }}>
            {t.subtitle} ({pendingOrders.length})
          </p>
        </div>
        <Link
          to="/marketplace"
          style={{
            padding: '10px 18px', borderRadius: '8px',
            background: 'var(--accent)', color: 'var(--accent-text)',
            textDecoration: 'none', fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap',
          }}
          data-tour="tr-req-place-order-btn"
        >
          🏪 {t.goToMarket}
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <SkeletonRows count={3} />
      ) : pendingOrders.length === 0 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{t.noRequests}</div>
          <div style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '20px' }}>{t.noRequestsSub}</div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingOrders.map((order, i) => (
            <div key={order.id} style={{
              background: 'var(--card)', border: '2px solid color-mix(in srgb, var(--amber) 35%, var(--border))',
              borderRadius: '12px', padding: '20px',
            }} data-tour={i === 0 ? 'tr-req-card' : undefined}>
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
                  {order.proposed_price && (
                    <div>
                      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.offeredPrice}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>Rs. {order.proposed_price}/kg</div>
                    </div>
                  )}
                  <div style={{ minWidth: 0, maxWidth: '100%' }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.seller}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', overflowWrap: 'break-word' }}>{order.seller_name}</div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '15px',
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
                  background: 'var(--surface-1)', fontSize: '16px', color: 'var(--text)',
                  fontStyle: 'italic',
                }}>
                  {t.yourNote}: "{order.buyer_note}"
                </div>
              )}

              <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                {t.placedOn}: {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      <HelpButton label={trqTourT.needHelp} ariaLabel={trqTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={trqTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey="sa_tour_trrequests_seen_v1"
        labels={{ next: trqTourT.next, back: trqTourT.back, skip: trqTourT.skip, done: trqTourT.done }}
      />
    </div>
  );
}
