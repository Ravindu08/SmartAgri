import { useState } from 'react';
import { request } from '../services/api';

const T = {
  en: {
    title: 'Complete Payment',
    demoBadge: '🔒 Simulated Payment — Demo Mode',
    demoNote: 'No real payment gateway is connected. This form is a stand-in — submitting it marks the order as paid.',
    cardNumber: 'Card Number', expiry: 'Expiry (MM/YY)', cvv: 'CVV', cardholder: 'Cardholder Name',
    pay: 'Pay', processing: 'Processing payment…', cancel: 'Cancel',
    fillAllFields: 'Fill in all fields to continue.',
  },
};

function totalFor(order) {
  const price = order.agreed_price ?? order.counter_offer_price ?? order.proposed_price ?? 0;
  return order.requested_quantity * price;
}

export default function PayDialog({ order, onClose, onSuccess }) {
  const [form, setForm] = useState({ cardholder: '', number: '', expiry: '', cvv: '' });
  const [status, setStatus] = useState('form'); // form | processing | error
  const [error, setError] = useState('');
  const t = T.en;
  const total = totalFor(order);

  const allFilled = Object.values(form).every(v => v.trim().length > 0);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!allFilled) { setError(t.fillAllFields); return; }
    setError('');
    setStatus('processing');
    try {
      await new Promise(r => setTimeout(r, 1500)); // simulated processing delay
      await request(`/api/marketplace/orders/${order.id}/payment/simulate`, { method: 'POST', body: JSON.stringify({}) });
      onSuccess();
    } catch (err) {
      setError(err.message);
      setStatus('form');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 4px', color: 'var(--text)', fontSize: '18px' }}>{t.title}</h3>
        <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '15px' }}>{order.listing_name} · Rs. {total.toLocaleString()}</p>

        <div style={{ background: 'color-mix(in srgb, var(--amber, #f59e0b) 15%, transparent)', border: '1px solid var(--amber, #f59e0b)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--amber, #f59e0b)' }}>{t.demoBadge}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>{t.demoNote}</div>
        </div>

        {status === 'processing' ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '15px', padding: '20px 0' }}>{t.processing}</p>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: '10px' }}>
            <input
              placeholder={t.cardholder} value={form.cardholder} onChange={e => update('cardholder', e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder={t.cardNumber} value={form.number} onChange={e => update('number', e.target.value)}
              maxLength={19} style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                placeholder={t.expiry} value={form.expiry} onChange={e => update('expiry', e.target.value)}
                maxLength={5} style={{ ...inputStyle, flex: 1 }}
              />
              <input
                placeholder={t.cvv} value={form.cvv} onChange={e => update('cvv', e.target.value)}
                maxLength={4} style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            {error && <p style={{ color: 'var(--destructive, #d33)', fontSize: '14px', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '15px' }}>
                {t.cancel}
              </button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--green-primary)', color: '#fff', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                {t.pay} Rs. {total.toLocaleString()}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--input-bg)', color: 'var(--text)', fontSize: '15px', boxSizing: 'border-box',
};
