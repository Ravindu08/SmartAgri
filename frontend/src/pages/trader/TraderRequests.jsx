import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useApp } from '../../context/AppContext';
import { getAuthSession } from '../../services/api';

const T = {
  en: {
    title: 'My Purchase Requests', subtitle: 'Track all your crop purchase requests',
    newRequest: 'New Request', goToMarket: 'Go to Marketplace',
    noRequests: 'No purchase requests yet.', noRequestsSub: 'Browse the marketplace to request crops from land owners.',
    crop: 'Crop', qty: 'Quantity', budget: 'Max Budget', status: 'Status',
    messages: 'Messages', requestedOn: 'Requested on',
    pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected',
    filterAll: 'All', filterPending: 'Pending', filterAccepted: 'Accepted', filterRejected: 'Rejected',
    msg: 'msg', msgs: 'msgs', noMsgYet: 'No messages yet.',
    viewMessages: 'View Messages', close: 'Close',
  },
  si: {
    title: 'මගේ මිලදී ගැනීමේ ඉල්ලීම්', subtitle: 'ඔබේ බෝග මිලදී ගැනීමේ ඉල්ලීම් නිරීක්ෂණය කරන්න',
    newRequest: 'නව ඉල්ලීම', goToMarket: 'වෙළඳසැලට යන්න',
    noRequests: 'මිලදී ගැනීමේ ඉල්ලීම් නොමැත.', noRequestsSub: 'ඉඩම් හිමිකරුවන්ගෙන් බෝග ඉල්ලීමට වෙළඳසැල බලන්න.',
    crop: 'බෝගය', qty: 'ප්‍රමාණය', budget: 'උපරිම අයවැය', status: 'තත්ත්වය',
    messages: 'පණිවිඩ', requestedOn: 'ඉල්ලීම් කළ දිනය',
    pending: 'අපේක්ෂිත', accepted: 'පිළිගත්', rejected: 'ප්‍රතික්ෂේප',
    filterAll: 'සියල්ල', filterPending: 'අපේක්ෂිත', filterAccepted: 'පිළිගත්', filterRejected: 'ප්‍රතික්ෂේප',
    msg: 'පණිවිඩය', msgs: 'පණිවිඩ', noMsgYet: 'තවම පණිවිඩ නොමැත.',
    viewMessages: 'පණිවිඩ බලන්න', close: 'වසන්න',
  },
  ta: {
    title: 'என் கொள்முதல் கோரிக்கைகள்', subtitle: 'உங்கள் பயிர் கோரிக்கைகளை கண்காணிக்கவும்',
    newRequest: 'புதிய கோரிக்கை', goToMarket: 'சந்தைக்கு செல்',
    noRequests: 'கொள்முதல் கோரிக்கைகள் இல்லை.', noRequestsSub: 'நில உரிமையாளர்களிடம் பயிர்கள் கோர சந்தையை உலாவுக.',
    crop: 'பயிர்', qty: 'அளவு', budget: 'அதிகபட்ச பட்ஜெட்', status: 'நிலை',
    messages: 'செய்திகள்', requestedOn: 'கோரப்பட்ட தேதி',
    pending: 'நிலுவையில்', accepted: 'ஏற்கப்பட்டது', rejected: 'நிராகரிக்கப்பட்டது',
    filterAll: 'அனைத்தும்', filterPending: 'நிலுவை', filterAccepted: 'ஏற்கப்பட்டவை', filterRejected: 'நிராகரிக்கப்பட்டவை',
    msg: 'செய்தி', msgs: 'செய்திகள்', noMsgYet: 'இன்னும் செய்திகள் இல்லை.',
    viewMessages: 'செய்திகளை பார்', close: 'மூடு',
  },
};

const STATUS_STYLE = {
  pending:  { bg: 'color-mix(in srgb, var(--amber) 15%, transparent)',  color: 'var(--amber)' },
  accepted: { bg: 'color-mix(in srgb, var(--green) 15%, transparent)',  color: 'var(--green)' },
  rejected: { bg: 'color-mix(in srgb, var(--red)   15%, transparent)',  color: 'var(--red)' },
};

const fetcher = url => fetch(url).then(r => r.json());

export default function TraderRequests() {
  const { lang } = useApp();
  const t        = T[lang] || T.en;
  const { user } = getAuthSession();
  const myName   = user?.full_name || '';

  const [filter, setFilter]       = useState('all');
  const [msgDialog, setMsgDialog] = useState(null);

  const { data: requestsData, isLoading } = useSWR('/api/requests', fetcher, { refreshInterval: 4000 });
  const requests = requestsData?.requests ?? [];

  const myRequests = useMemo(
    () => requests.filter(r => r.traderName === myName),
    [requests, myName],
  );

  const filtered = useMemo(
    () => filter === 'all' ? myRequests : myRequests.filter(r => r.status === filter),
    [myRequests, filter],
  );

  const filters = [
    { key: 'all',      label: t.filterAll },
    { key: 'pending',  label: t.filterPending },
    { key: 'accepted', label: t.filterAccepted },
    { key: 'rejected', label: t.filterRejected },
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
            {f.key !== 'all' && (
              <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                ({myRequests.filter(r => f.key === 'all' || r.status === f.key).length})
              </span>
            )}
            {f.key === 'all' && <span style={{ marginLeft: '6px', opacity: 0.7 }}>({myRequests.length})</span>}
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
          {filtered.map(req => {
            const st = (req.status || 'pending').toLowerCase();
            const stStyle = STATUS_STYLE[st] || STATUS_STYLE.pending;
            const msgCount = req.messages?.length || 0;
            return (
              <div key={req.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.crop}</div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>{req.cropName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.qty}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{req.quantity} {req.unit || 'kg'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.budget}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>${req.maxBudget ?? req.offeredPrice ?? '—'}/kg</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                    fontWeight: 600, background: stStyle.bg, color: stStyle.color,
                    alignSelf: 'flex-start',
                  }}>
                    {t[st] || st}
                  </span>
                </div>

                {req.message && (
                  <div style={{
                    marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                    background: 'var(--surface-1)', fontSize: '14px', color: 'var(--text)',
                  }}>
                    "{req.message}"
                  </div>
                )}

                <div style={{
                  marginTop: '12px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '8px',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {t.requestedOn}: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                  </span>
                  {msgCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setMsgDialog(req)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                        background: 'color-mix(in srgb, var(--blue) 12%, transparent)',
                        color: 'var(--blue)', border: '1px solid var(--blue)',
                        cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      💬 {msgCount} {msgCount === 1 ? t.msg : t.msgs}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Messages dialog */}
      {msgDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: '16px', width: '100%', maxWidth: '480px',
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{msgDialog.cropName}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{t.messages}</div>
              </div>
              <button type="button" onClick={() => setMsgDialog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--muted)' }}>
                ✕
              </button>
            </div>
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!msgDialog.messages?.length ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '24px 0' }}>{t.noMsgYet}</p>
              ) : (
                msgDialog.messages.map((m, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: '8px',
                    background: m.sender === myName ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--surface-1)',
                    alignSelf: m.sender === myName ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{m.sender}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>{m.text}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setMsgDialog(null)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px',
                  background: 'var(--surface-1)', border: '1px solid var(--border)',
                  color: 'var(--text)', cursor: 'pointer', fontWeight: 500,
                }}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
