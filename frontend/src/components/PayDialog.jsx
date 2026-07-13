import { useEffect, useRef, useState } from 'react';
import { request } from '../services/api';

const PAYHERE_SCRIPT_URL = 'https://www.payhere.lk/lib/payhere.js';
let payhereLoadPromise = null;

function loadPayHereScript() {
  if (window.payhere) return Promise.resolve();
  if (!payhereLoadPromise) {
    payhereLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PAYHERE_SCRIPT_URL;
      script.onload = resolve;
      script.onerror = () => { payhereLoadPromise = null; reject(new Error('Failed to load PayHere checkout')); };
      document.body.appendChild(script);
    });
  }
  return payhereLoadPromise;
}

// Poll a couple of times for the notify_url webhook to land — the buyer's
// browser only knows checkout finished (onCompleted); the DB only flips to
// Paid once PayHere's server-to-server callback has been processed.
async function pollUntilPaid(orderId, { attempts = 5, delayMs = 1500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    await new Promise(r => setTimeout(r, delayMs));
    try {
      const payment = await request(`/api/marketplace/orders/${orderId}/payment`);
      if (payment.status === 'Paid') return true;
    } catch { /* keep polling */ }
  }
  return false;
}

const T = {
  en: {
    title: 'Complete Payment', desc: 'Pay securely via PayHere to confirm this order.',
    preparing: 'Preparing checkout…', cancel: 'Cancel',
    processing: 'Confirming your payment…',
    slowNotice: "Payment is processing — this can take a moment. You can close this and check back shortly.",
    dismissed: 'Payment window closed.',
  },
};

export default function PayDialog({ order, onClose, onSuccess }) {
  const [status, setStatus] = useState('loading'); // loading | ready | processing | slow | error
  const [error, setError] = useState('');
  const startedRef = useRef(false);
  const t = T.en;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await loadPayHereScript();
        const payload = await request(`/api/marketplace/orders/${order.id}/payment/init`, { method: 'POST', body: JSON.stringify({}) });
        if (cancelled || startedRef.current) return;
        startedRef.current = true;

        window.payhere.onCompleted = async () => {
          if (cancelled) return;
          setStatus('processing');
          const paid = await pollUntilPaid(order.id);
          if (cancelled) return;
          if (paid) onSuccess();
          else setStatus('slow');
        };
        window.payhere.onDismissed = () => { if (!cancelled) onClose(); };
        window.payhere.onError = (msg) => { if (!cancelled) { setError(msg); setStatus('error'); } };

        setStatus('ready');
        window.payhere.startPayment(payload);
      } catch (err) {
        if (!cancelled) { setError(err.message); setStatus('error'); }
      }
    }
    start();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '18px' }}>{t.title}</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '15px' }}>{order.listing_name}</p>

        {(status === 'loading' || status === 'ready') && (
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>{t.preparing}</p>
        )}
        {status === 'processing' && (
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>{t.processing}</p>
        )}
        {status === 'slow' && (
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>{t.slowNotice}</p>
        )}
        {status === 'error' && (
          <p style={{ color: 'var(--destructive, #d33)', fontSize: '15px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '15px' }}>
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
