import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'Import Users from CSV',
    instructions: 'Upload a CSV file with columns: name, email (one user per row, first row is header).',
    sampleRow: 'Example: Kamal Perera, kamal@example.com',
    chooseFile: 'Choose CSV File',
    noFile: 'No file selected',
    preview: 'Preview',
    rows: 'rows',
    defaultPassword: 'Default Password',
    passwordHint: 'All imported accounts will use this password. Users should change it on first login.',
    importBtn: (n) => `Import ${n} Users`,
    importing: 'Importing…',
    back: '← Back to Users',
    resultCreated: 'Created',
    resultSkipped: 'Skipped (already exist)',
    resultErrors: 'Errors',
    colName: 'Name', colEmail: 'Email',
    errNoFile: 'Please select a CSV file.',
    errNoPassword: 'Please enter a default password (min 8 characters).',
    errNoRows: 'No valid rows found in the CSV file.',
  },
  si: {
    title: 'CSV ගොනුවෙන් පරිශීලකයන් ආයාත කරන්න',
    instructions: 'name, email තීරු සහිත CSV ගොනුවක් උඩුගත කරන්න (පළමු පේළිය header).',
    sampleRow: 'උදාහරණ: කමල් පෙරේරා, kamal@example.com',
    chooseFile: 'CSV ගොනුව තෝරන්න',
    noFile: 'ගොනුවක් තෝරා නැත',
    preview: 'පෙරදසුන',
    rows: 'පේළි',
    defaultPassword: 'සෙසු මුරපදය',
    passwordHint: 'ආනයනය කළ සියලු ගිණුම් මෙම මුරපදය භාවිතා කරනු ඇත.',
    importBtn: (n) => `පරිශීලකයන් ${n} ආයාත කරන්න`,
    importing: 'ආයාත කරමින්…',
    back: '← පරිශීලකයන් වෙත ආපසු',
    resultCreated: 'සාදන ලද',
    resultSkipped: 'මඟහරින ලද (දැනටමත් ඇත)',
    resultErrors: 'දෝෂ',
    colName: 'නම', colEmail: 'ඊ-මේල්',
    errNoFile: 'CSV ගොනුවක් තෝරන්න.',
    errNoPassword: 'සෙසු මුරපදයක් ඇතුළු කරන්න (අවම අකුරු 8).',
    errNoRows: 'CSV ගොනුවේ වලංගු පේළි හමු නොවීය.',
  },
  ta: {
    title: 'CSV இலிருந்து பயனர்களை இறக்கு',
    instructions: 'name, email நெடுவரிசைகளுடன் CSV கோப்பை பதிவேற்றவும் (முதல் வரிசை header).',
    sampleRow: 'உதாரணம்: கமல் பெரேரா, kamal@example.com',
    chooseFile: 'CSV கோப்பை தேர்ந்தெடுக்கவும்',
    noFile: 'கோப்பு தேர்ந்தெடுக்கப்படவில்லை',
    preview: 'முன்னோட்டம்',
    rows: 'வரிசைகள்',
    defaultPassword: 'இயல்புநிலை கடவுச்சொல்',
    passwordHint: 'இறக்கப்பட்ட அனைத்து கணக்குகளும் இந்த கடவுச்சொல்லை பயன்படுத்தும்.',
    importBtn: (n) => `${n} பயனர்களை இறக்கு`,
    importing: 'இறக்குகிறது…',
    back: '← பயனர்களுக்கு திரும்பு',
    resultCreated: 'உருவாக்கப்பட்டது',
    resultSkipped: 'தவிர்க்கப்பட்டது (ஏற்கனவே உள்ளது)',
    resultErrors: 'பிழைகள்',
    colName: 'பெயர்', colEmail: 'மின்னஞ்சல்',
    errNoFile: 'CSV கோப்பை தேர்ந்தெடுக்கவும்.',
    errNoPassword: 'இயல்புநிலை கடவுச்சொல் உள்ளிடவும் (குறைந்தது 8 எழுத்துகள்).',
    errNoRows: 'CSV கோப்பில் செல்லுபடியான வரிசைகள் இல்லை.',
  },
};

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    return { full_name: parts[0] || '', email: parts[1] || '' };
  }).filter(r => r.full_name && r.email && r.email.includes('@'));
}

const card = { background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px', marginBottom: '20px' };

export default function AdminUserImport() {
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [rows, setRows]         = useState([]);
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setRows(parsed);
      if (parsed.length === 0) setError(t.errNoRows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileName)          { setError(t.errNoFile);     return; }
    if (rows.length === 0)  { setError(t.errNoRows);     return; }
    if (password.length < 8){ setError(t.errNoPassword); return; }
    setError('');
    setImporting(true);
    try {
      const res = await adminRequest('/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ users: rows, default_password: password, role: 'Land Owner' }),
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '780px' }}>
      <button onClick={() => navigate('/admin/users')} type="button"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0 }}>
        {t.back}
      </button>
      <h2 style={{ margin: '0 0 24px', color: 'var(--text)' }}>{t.title}</h2>

      {/* Instructions */}
      <div style={card}>
        <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--text)' }}>{t.instructions}</p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', fontFamily: 'monospace' }}>{t.sampleRow}</p>
      </div>

      {/* File picker */}
      <div style={card}>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => fileRef.current.click()}
            style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            📂 {t.chooseFile}
          </button>
          <span style={{ fontSize: '13px', color: fileName ? 'var(--text)' : 'var(--muted)' }}>
            {fileName || t.noFile}
          </span>
          {rows.length > 0 && (
            <span style={{ fontSize: '12px', color: '#2d6a4f', fontWeight: 600, marginLeft: 'auto' }}>
              ✓ {rows.length} {t.rows}
            </span>
          )}
        </div>
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
            {t.preview} ({rows.length} {t.rows})
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {[t.colName, t.colEmail].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text)' }}>{r.full_name}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--muted)' }}>{r.email}</td>
                  </tr>
                ))}
                {rows.length > 50 && (
                  <tr><td colSpan={2} style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>…and {rows.length - 50} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password + submit */}
      <div style={card}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>{t.defaultPassword}</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' }} />
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.passwordHint}</span>
        </label>

        {error && (
          <div style={{ color: '#e53935', fontSize: '13px', padding: '8px 12px', background: '#e5393512', borderRadius: '8px', marginBottom: '12px' }}>⚠️ {error}</div>
        )}

        <button type="button" onClick={handleImport} disabled={importing || rows.length === 0}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: (importing || rows.length === 0) ? 0.6 : 1 }}>
          {importing ? t.importing : t.importBtn(rows.length)}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ ...card, borderColor: '#2d6a4f44', background: '#2d6a4f0a' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#2d6a4f' }}>{result.created}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.resultCreated}</div></div>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#f57c00' }}>{result.skipped}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.resultSkipped}</div></div>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#e53935' }}>{result.errors?.length || 0}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.resultErrors}</div></div>
          </div>
          {result.errors?.length > 0 && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#e53935' }}>
              {result.errors.map((e, i) => <div key={i}>{e.email}: {e.error}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
