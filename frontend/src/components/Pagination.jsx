import { useApp } from '../context/AppContext';

const T = {
  en: { prev: '‹ Prev', next: 'Next ›', pageOf: (p, n) => `Page ${p} of ${n}` },
  si: { prev: '‹ පෙර', next: 'ඊළඟ ›', pageOf: (p, n) => `පිටුව ${p} න් ${n}` },
  ta: { prev: '‹ முந்தைய', next: 'அடுத்து ›', pageOf: (p, n) => `பக்கம் ${p} / ${n}` },
};

export default function Pagination({ page, totalPages, onChange }) {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '18px' }}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        style={{
          padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--card)', color: 'var(--text)', fontSize: '15px', fontWeight: 600,
          cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1,
        }}
      >
        {t.prev}
      </button>
      <span style={{ fontSize: '15px', color: 'var(--muted)' }}>{t.pageOf(page, totalPages)}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        style={{
          padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--card)', color: 'var(--text)', fontSize: '15px', fontWeight: 600,
          cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        {t.next}
      </button>
    </div>
  );
}
