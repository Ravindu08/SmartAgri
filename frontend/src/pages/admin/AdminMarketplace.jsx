import { useEffect, useState } from 'react';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { SkeletonTable } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

const T = {
  en: {
    title: 'Marketplace Oversight', loading: 'Loading…',
    tabListings: 'listings', tabOrders: 'orders',
    searchListings: 'Search crop name or type…', searchOrders: 'Search order ID, buyer #, or seller #…',
    colCrop: 'Crop Name', colType: 'Type', colQty: 'Quantity', colPrice: 'Price/Unit',
    colStatus: 'Status', colCreated: 'Created', colAction: 'Action',
    archive: 'Archive', noListings: 'No listings',
    confirmArchive: 'Force-archive this listing?', toastArchived: 'Listing archived',
    colOrderId: 'Order ID', colBuyer: 'Buyer', colSeller: 'Seller',
    colQtyReq: 'Qty Requested', colAgreedPrice: 'Agreed Price', colDate: 'Date',
    noOrders: 'No orders', proposed: '(proposed)',
  },
  si: {
    title: 'වෙළඳසල අධීක්ෂණය', loading: 'පූරණය වෙමින්...',
    tabListings: 'ලැයිස්තු', tabOrders: 'ඇණවුම්',
    searchListings: 'බෝග නම හෝ වර්ගය සොයන්න...', searchOrders: 'ඇණවුම් ID, ගනුදෙනුකරු #, හෝ විකුණන්නා # සොයන්න...',
    colCrop: 'බෝග නම', colType: 'වර්ගය', colQty: 'ප්‍රමාණය', colPrice: 'මිල / ඒකය',
    colStatus: 'තත්ත්වය', colCreated: 'සාදන ලද', colAction: 'ක්‍රියාව',
    archive: 'සංරක්ෂණය', noListings: 'ලැයිස්තු නොමැත',
    confirmArchive: 'මෙම ලැයිස්තුව බලෙන් සංරක්ෂණය කරන්නද?', toastArchived: 'ලැයිස්තුව සංරක්ෂණය කරන ලදී',
    colOrderId: 'ඇණවුම් ID', colBuyer: 'ගනුදෙනුකරු', colSeller: 'විකුණන්නා',
    colQtyReq: 'ඉල්ලූ ප්‍රමාණය', colAgreedPrice: 'එකඟ වූ මිල', colDate: 'දිනය',
    noOrders: 'ඇණවුම් නොමැත', proposed: '(යෝජිත)',
  },
  ta: {
    title: 'சந்தை கண்காணிப்பு', loading: 'ஏற்றுகிறது...',
    tabListings: 'பட்டியல்கள்', tabOrders: 'ஆர்டர்கள்',
    searchListings: 'பயிர் பெயர் அல்லது வகையைத் தேடவும்…', searchOrders: 'ஆர்டர் ஐடி, வாங்குபவர் #, அல்லது விற்பவர் # தேடவும்…',
    colCrop: 'பயிர் பெயர்', colType: 'வகை', colQty: 'அளவு', colPrice: 'விலை/யூனிட்',
    colStatus: 'நிலை', colCreated: 'உருவாக்கப்பட்டது', colAction: 'நடவடிக்கை',
    archive: 'காப்பகப்படுத்து', noListings: 'பட்டியல்கள் இல்லை',
    confirmArchive: 'இந்த பட்டியலை வலுக்கட்டாயமாக காப்பகப்படுத்தவா?', toastArchived: 'பட்டியல் காப்பகப்படுத்தப்பட்டது',
    colOrderId: 'ஆர்டர் ID', colBuyer: 'வாங்குபவர்', colSeller: 'விற்பவர்',
    colQtyReq: 'கோரிய அளவு', colAgreedPrice: 'ஒப்புக்கொண்ட விலை', colDate: 'தேதி',
    noOrders: 'ஆர்டர்கள் இல்லை', proposed: '(முன்மொழியப்பட்டது)',
  },
};

const STATUS_COLOR = {
  Active: '#2d6a4f', Reserved: '#f57c00', Sold: '#1565c0',
  Archived: '#757575', archived: '#757575',
  Pending: '#f57c00', Confirmed: '#1565c0', Delivered: '#7c3aed',
  Completed: '#2d6a4f', Rejected: '#c62828', Cancelled: '#757575',
};

export default function AdminMarketplace() {
  const { lang } = useApp();
  const t = T[lang] || T.en;

  const [tab, setTab]           = useState('listings');
  const [listings, setListings] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminRequest('/marketplace/listings').catch(() => []),
      adminRequest('/marketplace/orders').catch(() => []),
    ]).then(([l, o]) => { setListings(l); setOrders(o); setLoading(false); });
  }, []);

  useEffect(() => { setPage(1); }, [search, tab]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const filteredListings = listings.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.crop_name?.toLowerCase().includes(q) || l.crop_type?.toLowerCase().includes(q);
  });
  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.id?.toLowerCase().includes(q) || String(o.buyer_id).includes(q) || String(o.seller_id).includes(q);
  });
  const activeFiltered = tab === 'listings' ? filteredListings : filteredOrders;
  const totalPages = Math.max(1, Math.ceil(activeFiltered.length / PAGE_SIZE));
  const pageListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleArchive = async (id) => {
    if (!window.confirm(t.confirmArchive)) return;
    await adminRequest(`/marketplace/listings/${id}/archive`, { method: 'PATCH' });
    setListings(ls => ls.map(l => l.id === id ? { ...l, status: 'Archived' } : l));
    showToast(t.toastArchived);
  };

  if (loading) return <SkeletonTable rows={6} cols={4} />;

  const listingHeaders = [t.colCrop, t.colType, t.colQty, t.colPrice, t.colStatus, t.colCreated, t.colAction];
  const orderHeaders   = [t.colOrderId, t.colBuyer, t.colSeller, t.colQtyReq, t.colAgreedPrice, t.colStatus, t.colDate];

  return (
    <div style={{ padding: '28px', maxWidth: '1100px' }}>
      {toast && <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#333', color: '#fff', padding: '10px 18px', borderRadius: '8px', zIndex: 999 }}>{toast}</div>}

      <h2 style={{ margin: '0 0 20px', color: 'var(--text)' }}>{t.title}</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {(['listings', 'orders']).map(key => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '15px', textTransform: 'capitalize',
              background: tab === key ? '#7c3aed' : 'var(--card)', color: tab === key ? '#fff' : 'var(--muted)',
            }}>
            {key === 'listings' ? t.tabListings : t.tabOrders} ({key === 'listings' ? listings.length : orders.length})
          </button>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'listings' ? t.searchListings : t.searchOrders}
        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '16px', width: '100%', maxWidth: '360px', marginBottom: '20px' }} />

      {tab === 'listings' && (
        <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {listingHeaders.map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageListings.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>{l.crop_name}</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px', color: 'var(--muted)' }}>{l.crop_type}</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px' }}>{l.quantity} {l.unit}</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px' }}>Rs {l.price_per_unit}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: '12.5px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, background: (STATUS_COLOR[l.status] || '#888') + '18', color: STATUS_COLOR[l.status] || '#888' }}>{l.status}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '14px', color: 'var(--muted)' }}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {l.status !== 'Archived' && l.status !== 'archived' && (
                      <button onClick={() => handleArchive(l.id)}
                        style={{ fontSize: '14px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #f57c00', background: 'none', cursor: 'pointer', color: '#f57c00' }}>{t.archive}</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredListings.length === 0 && <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>{t.noListings}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {orderHeaders.map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '14px', color: 'var(--muted)' }}>{o.id.slice(0, 8)}…</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px' }}>#{o.buyer_id}</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px' }}>#{o.seller_id}</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px' }}>{o.requested_quantity}</td>
                  <td style={{ padding: '11px 14px', fontSize: '15px' }}>{o.agreed_price != null ? `Rs ${o.agreed_price}` : o.proposed_price != null ? `Rs ${o.proposed_price} ${t.proposed}` : '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: '12.5px', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, background: (STATUS_COLOR[o.status] || '#888') + '18', color: STATUS_COLOR[o.status] || '#888' }}>{o.status}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '14px', color: 'var(--muted)' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>{t.noOrders}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
