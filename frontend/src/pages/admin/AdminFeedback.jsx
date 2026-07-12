import { useEffect, useState } from 'react';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { SkeletonTable } from '../../components/Skeleton';

const T = {
  en: {
    title: 'Feedback & Complaints', loading: 'Loading…', noFeedback: 'No feedback yet',
    tabOpen: 'Open', tabResolved: 'Resolved', tabAll: 'All',
    adminReply: 'Admin reply', replyResolve: 'Reply & Resolve',
    replyTo: 'Reply to:', replyPlaceholder: 'Type your reply…',
    cancel: 'Cancel', sending: 'Sending…', sendResolve: 'Send & Resolve',
    resolvedOn: (date) => `Resolved ${date}`,
  },
  si: {
    title: 'ප්‍රතිපෝෂණ සහ පැමිණිලි', loading: 'පූරණය වෙමින්...', noFeedback: 'ප්‍රතිපෝෂණ නොමැත',
    tabOpen: 'විවෘත', tabResolved: 'විසඳා ඇත', tabAll: 'සියල්ල',
    adminReply: 'පරිපාලක පිළිතුර', replyResolve: 'පිළිතුරු දී විසඳන්න',
    replyTo: '↩ පිළිතුරු:', replyPlaceholder: 'ඔබේ පිළිතුර ටයිප් කරන්න...',
    cancel: 'අවලංගු කරන්න', sending: 'යවමින්...', sendResolve: 'යවා විසඳන්න',
    resolvedOn: (date) => `විසඳා ඇත ${date}`,
  },
  ta: {
    title: 'கருத்துக்கள் & புகார்கள்', loading: 'ஏற்றுகிறது...', noFeedback: 'கருத்துக்கள் இல்லை',
    tabOpen: 'திறந்திருக்கும்', tabResolved: 'தீர்க்கப்பட்டது', tabAll: 'அனைத்தும்',
    adminReply: 'நிர்வாக பதில்', replyResolve: 'பதிலளித்து தீர்க்கவும்',
    replyTo: '↩ பதில்:', replyPlaceholder: 'உங்கள் பதிலை தட்டவும்...',
    cancel: 'ரத்து செய்', sending: 'அனுப்புகிறது...', sendResolve: 'அனுப்பி தீர்க்கவும்',
    resolvedOn: (date) => `தீர்க்கப்பட்டது ${date}`,
  },
};

const TYPE_COLOR = { feedback: '#1565c0', complaint: '#e53935', bug: '#f57c00' };
const TYPE_ICON  = { feedback: '💬', complaint: '😤', bug: '🐛' };

export default function AdminFeedback() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('open');
  const [selected, setSelected]   = useState(null);
  const [reply, setReply]         = useState('');
  const [replying, setReplying]   = useState(false);

  const load = (st = filter) => {
    setLoading(true);
    adminRequest(`/feedback${st ? `?feedback_status=${st}` : ''}`).then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleReply = async (e) => {
    e.preventDefault();
    setReplying(true);
    try {
      await adminRequest(`/feedback/${selected.id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) });
      setSelected(null); setReply('');
      load();
    } finally { setReplying(false); }
  };

  const tabs = [
    { value: 'open',     label: t.tabOpen },
    { value: 'resolved', label: t.tabResolved },
    { value: '',         label: t.tabAll },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <h2 style={{ margin: '0 0 20px', color: 'var(--text)' }}>{t.title}</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {tabs.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '15px',
              background: filter === value ? '#7c3aed' : 'var(--card)', color: filter === value ? '#fff' : 'var(--muted)',
            }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={3} />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>{t.noFeedback}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '18px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px' }}>{TYPE_ICON[item.type] || '💬'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--text)' }}>{item.subject}</span>
                    <span style={{ fontSize: '12.5px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, background: (TYPE_COLOR[item.type] || '#888') + '18', color: TYPE_COLOR[item.type] || '#888' }}>{item.type}</span>
                    <span style={{ fontSize: '12.5px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, background: item.status === 'open' ? '#e5393518' : '#2d6a4f18', color: item.status === 'open' ? '#e53935' : '#2d6a4f' }}>{item.status}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: '16px', lineHeight: '1.5' }}>{item.message}</p>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    User #{item.user_id} · {new Date(item.created_at).toLocaleString()}
                    {item.resolved_at && ` · ${t.resolvedOn(new Date(item.resolved_at).toLocaleDateString())}`}
                  </div>
                  {item.admin_reply && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#7c3aed18', borderRadius: '8px', borderLeft: '3px solid #7c3aed' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>{t.adminReply}</div>
                      <div style={{ fontSize: '15px', color: 'var(--text)' }}>{item.admin_reply}</div>
                    </div>
                  )}
                  {item.status === 'open' && (
                    <button onClick={() => { setSelected(item); setReply(''); }}
                      style={{ marginTop: '10px', padding: '6px 14px', borderRadius: '7px', border: '1px solid #7c3aed', background: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '15px', fontWeight: 600 }}>
                      {t.replyResolve}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelected(null)}>
          <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>{t.replyTo} {selected.subject}</h3>
            <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '0 0 16px' }}>{selected.message}</p>
            <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea required rows={4} value={reply} onChange={e => setReply(e.target.value)}
                placeholder={t.replyPlaceholder}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '16px', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setSelected(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text)' }}>{t.cancel}</button>
                <button type="submit" disabled={replying}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  {replying ? t.sending : t.sendResolve}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
