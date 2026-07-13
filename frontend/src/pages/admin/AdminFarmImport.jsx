import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRequest } from '../../services/api';
import { useApp } from '../../context/AppContext';

const T = {
  en: {
    title: 'Import Farms from CSV',
    instructions: 'Upload a CSV with columns: farmer_name, email, district, farm_name, soil_type, size, size_unit, irrigation_type',
    sampleRow: 'Example: Sunil Silva, sunil@example.com, Kurunegala, Silva Farm, Sandy Loam, 2.5, acres, Irrigated',
    chooseFile: 'Choose CSV File',
    noFile: 'No file selected',
    preview: 'Preview',
    rows: 'rows',
    defaultPassword: 'Default Password for New Accounts',
    passwordHint: 'Only used when creating new farmer accounts. Existing accounts are not changed.',
    importBtn: (n) => `Import ${n} Farms`,
    importing: 'Importing…',
    back: '← Back to Farms',
    resultUsers: 'New Accounts Created',
    resultFarms: 'Farms Created',
    resultSkipped: 'Existing Accounts (reused)',
    resultErrors: 'Errors',
    colFarmer: 'Farmer Name', colEmail: 'Email', colDistrict: 'District',
    colFarm: 'Farm Name', colSoil: 'Soil Type', colSize: 'Size',
    errNoFile: 'Please select a CSV file.',
    errNoPassword: 'Please enter a default password (min 8 characters).',
    errNoRows: 'No valid rows found in the CSV file.',
  },
  si: {
    title: 'CSV ගොනුවෙන් ගොවිපල ආයාත කරන්න',
    instructions: 'farmer_name, email, district, farm_name, soil_type, size, size_unit, irrigation_type තීරු සහිත CSV ගොනුවක් උඩුගත කරන්න',
    sampleRow: 'උදාහරණ: සුනිල් සිල්වා, sunil@example.com, කුරුණෑගල, සිල්වා ගොවිපළ, Sandy Loam, 2.5, acres, Irrigated',
    chooseFile: 'CSV ගොනුව තෝරන්න',
    noFile: 'ගොනුවක් තෝරා නැත',
    preview: 'පෙරදසුන',
    rows: 'පේළි',
    defaultPassword: 'නව ගිණුම් සඳහා සෙසු මුරපදය',
    passwordHint: 'නව ගොවි ගිණුම් සාදන විට පමණක් භාවිතා කරනු ලැබේ.',
    importBtn: (n) => `ගොවිපල ${n} ආයාත කරන්න`,
    importing: 'ආයාත කරමින්…',
    back: '← ගොවිපල වෙත ආපසු',
    resultUsers: 'නව ගිණුම් සාදන ලදී',
    resultFarms: 'ගොවිපල සාදන ලදී',
    resultSkipped: 'පවතින ගිණුම් (නැවත භාවිතා)',
    resultErrors: 'දෝෂ',
    colFarmer: 'ගොවියාගේ නම', colEmail: 'ඊ-මේල්', colDistrict: 'දිස්ත්‍රික්කය',
    colFarm: 'ගොවිපල නම', colSoil: 'පාංශු වර්ගය', colSize: 'ප්‍රමාණය',
    errNoFile: 'CSV ගොනුවක් තෝරන්න.',
    errNoPassword: 'සෙසු මුරපදයක් ඇතුළු කරන්න (අවම අකුරු 8).',
    errNoRows: 'CSV ගොනුවේ වලංගු පේළි හමු නොවීය.',
  },
  ta: {
    title: 'CSV இலிருந்து பண்ணைகளை இறக்கு',
    instructions: 'farmer_name, email, district, farm_name, soil_type, size, size_unit, irrigation_type நெடுவரிசைகளுடன் CSV கோப்பை பதிவேற்றவும்',
    sampleRow: 'உதாரணம்: சுனில் சில்வா, sunil@example.com, குருணேகல, சில்வா பண்ணை, Sandy Loam, 2.5, acres, Irrigated',
    chooseFile: 'CSV கோப்பை தேர்ந்தெடுக்கவும்',
    noFile: 'கோப்பு தேர்ந்தெடுக்கப்படவில்லை',
    preview: 'முன்னோட்டம்',
    rows: 'வரிசைகள்',
    defaultPassword: 'புதிய கணக்குகளுக்கான கடவுச்சொல்',
    passwordHint: 'புதிய விவசாயி கணக்குகள் உருவாக்கும்போது மட்டுமே பயன்படுத்தப்படும்.',
    importBtn: (n) => `${n} பண்ணைகளை இறக்கு`,
    importing: 'இறக்குகிறது…',
    back: '← பண்ணைகளுக்கு திரும்பு',
    resultUsers: 'புதிய கணக்குகள் உருவாக்கப்பட்டன',
    resultFarms: 'பண்ணைகள் உருவாக்கப்பட்டன',
    resultSkipped: 'தற்போதுள்ள கணக்குகள் (மீண்டும் பயன்படுத்தப்பட்டன)',
    resultErrors: 'பிழைகள்',
    colFarmer: 'விவசாயி பெயர்', colEmail: 'மின்னஞ்சல்', colDistrict: 'மாவட்டம்',
    colFarm: 'பண்ணை பெயர்', colSoil: 'மண் வகை', colSize: 'அளவு',
    errNoFile: 'CSV கோப்பை தேர்ந்தெடுக்கவும்.',
    errNoPassword: 'இயல்புநிலை கடவுச்சொல் உள்ளிடவும் (குறைந்தது 8 எழுத்துகள்).',
    errNoRows: 'CSV கோப்பில் செல்லுபடியான வரிசைகள் இல்லை.',
  },
};

const COLS = ['farmer_name', 'email', 'district', 'farm_name', 'soil_type', 'size', 'size_unit', 'irrigation_type'];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    const [farmer_name, email, district, farm_name, soil_type, size, size_unit, irrigation_type] = parts;
    if (!farmer_name || !email || !email.includes('@') || !farm_name) return null;
    return {
      farmer_name, email, district: district || '', farm_name,
      soil_type: soil_type || 'Sandy Loam',
      size: parseFloat(size) || 1,
      size_unit: size_unit || 'acres',
      irrigation_type: irrigation_type || 'Rain-fed',
    };
  }).filter(Boolean);
}

const card = { background: 'var(--card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px', marginBottom: '20px' };

export default function AdminFarmImport() {
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
    if (!fileName)           { setError(t.errNoFile);     return; }
    if (rows.length === 0)   { setError(t.errNoRows);     return; }
    if (password.length < 8) { setError(t.errNoPassword); return; }
    setError('');
    setImporting(true);
    try {
      const res = await adminRequest('/farms/bulk', {
        method: 'POST',
        body: JSON.stringify({ farms: rows, default_password: password }),
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const previewCols = [t.colFarmer, t.colEmail, t.colDistrict, t.colFarm, t.colSoil, t.colSize];

  return (
    <div style={{ padding: '28px', maxWidth: '900px' }}>
      <button onClick={() => navigate('/admin/farms')} type="button"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '15px', marginBottom: '16px', padding: 0 }}>
        {t.back}
      </button>
      <h2 style={{ margin: '0 0 24px', color: 'var(--text)' }}>{t.title}</h2>

      <div style={card}>
        <p style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--text)' }}>{t.instructions}</p>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{t.sampleRow}</p>
      </div>

      <div style={card}>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => fileRef.current.click()}
            style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            📂 {t.chooseFile}
          </button>
          <span style={{ fontSize: '15px', color: fileName ? 'var(--text)' : 'var(--muted)' }}>
            {fileName || t.noFile}
          </span>
          {rows.length > 0 && (
            <span style={{ fontSize: '14px', color: '#2d6a4f', fontWeight: 600, marginLeft: 'auto' }}>
              ✓ {rows.length} {t.rows}
            </span>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
            {t.preview} ({rows.length} {t.rows})
          </div>
          <div style={{ maxHeight: '240px', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {previewCols.map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: '15px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{r.farmer_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: '14px', color: 'var(--muted)' }}>{r.email}</td>
                    <td style={{ padding: '10px 14px', fontSize: '15px' }}>{r.district}</td>
                    <td style={{ padding: '10px 14px', fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{r.farm_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: '14px', color: 'var(--muted)' }}>{r.soil_type}</td>
                    <td style={{ padding: '10px 14px', fontSize: '14px' }}>{r.size} {r.size_unit}</td>
                  </tr>
                ))}
                {rows.length > 50 && (
                  <tr><td colSpan={6} style={{ padding: '10px 14px', fontSize: '14px', color: 'var(--muted)', textAlign: 'center' }}>…and {rows.length - 50} more</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={card}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--muted)' }}>{t.defaultPassword}</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '16px' }} />
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{t.passwordHint}</span>
        </label>

        {error && (
          <div style={{ color: '#e53935', fontSize: '15px', padding: '8px 12px', background: '#e5393512', borderRadius: '8px', marginBottom: '12px' }}>⚠️ {error}</div>
        )}

        <button type="button" onClick={handleImport} disabled={importing || rows.length === 0}
          style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 600, fontSize: '16px', cursor: 'pointer', opacity: (importing || rows.length === 0) ? 0.6 : 1 }}>
          {importing ? t.importing : t.importBtn(rows.length)}
        </button>
      </div>

      {result && (
        <div style={{ ...card, borderColor: '#2d6a4f44', background: '#2d6a4f0a' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#1565c0' }}>{result.created_users}</div><div style={{ fontSize: '14px', color: 'var(--muted)' }}>{t.resultUsers}</div></div>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#2d6a4f' }}>{result.created_farms}</div><div style={{ fontSize: '14px', color: 'var(--muted)' }}>{t.resultFarms}</div></div>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#f57c00' }}>{result.skipped}</div><div style={{ fontSize: '14px', color: 'var(--muted)' }}>{t.resultSkipped}</div></div>
            <div><div style={{ fontSize: '28px', fontWeight: 700, color: '#e53935' }}>{result.errors?.length || 0}</div><div style={{ fontSize: '14px', color: 'var(--muted)' }}>{t.resultErrors}</div></div>
          </div>
          {result.errors?.length > 0 && (
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#e53935' }}>
              {result.errors.map((e, i) => <div key={i}>{e.email}: {e.error}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
