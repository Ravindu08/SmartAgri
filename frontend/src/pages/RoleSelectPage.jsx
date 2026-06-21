import { useNavigate } from 'react-router-dom';
import { getAuthSession, setActiveRole, getUserRoles, clearAuthSession } from '../services/api';
import { useApp } from '../context/AppContext';

const T = {
  en: {
    title: 'Choose Your Role',
    sub: 'You have multiple roles. Select which one you want to use now.',
    landOwner: 'Land Owner',
    landOwnerDesc: 'Manage your farms, crops, and cultivations.',
    trader: 'Trader',
    traderDesc: 'Browse requests, manage orders, and track transactions.',
    continue: 'Continue →',
    logout: 'Log out',
  },
  si: {
    title: 'ඔබේ භූමිකාව තෝරන්න',
    sub: 'ඔබට භූමිකා දෙකක් ඇත. දැන් භාවිතා කිරීමට කැමති එකක් තෝරන්න.',
    landOwner: 'ඉඩම් හිමිකරු',
    landOwnerDesc: 'ඔබේ ගොවිපළ, බෝග සහ වගාවන් කළමනාකරණය කරන්න.',
    trader: 'ව්‍යාපාරිකයා',
    traderDesc: 'ඉල්ලීම් බලන්න, ඇණවුම් කළමනාකරණය කරන්න.',
    continue: 'ඉදිරියට →',
    logout: 'ලොග් අවුට්',
  },
  ta: {
    title: 'உங்கள் பாத்திரத்தை தேர்ந்தெடுங்கள்',
    sub: 'உங்களிடம் இரண்டு பாத்திரங்கள் உள்ளன. இப்போது பயன்படுத்த விரும்புவதை தேர்ந்தெடுங்கள்.',
    landOwner: 'நில உரிமையாளர்',
    landOwnerDesc: 'உங்கள் பண்ணைகள், பயிர்கள் மற்றும் சாகுபடிகளை நிர்வகிக்கவும்.',
    trader: 'வணிகர்',
    traderDesc: 'கோரிக்கைகளை உலாவி, ஆர்டர்களை நிர்வகிக்கவும்.',
    continue: 'தொடர்க →',
    logout: 'வெளியேறு',
  },
};

const ROLE_CONFIG = {
  'Land Owner': { icon: '🌾', descKey: 'landOwnerDesc', labelKey: 'landOwner', path: '/landowner/dashboard', color: '#2d6a4f' },
  'Trader':     { icon: '🏪', descKey: 'traderDesc',    labelKey: 'trader',    path: '/trader/dashboard',   color: '#1565c0' },
};

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = T[lang] || T.en;
  const { user } = getAuthSession();
  const roles = getUserRoles();

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSelect = (role) => {
    setActiveRole(role);
    const cfg = ROLE_CONFIG[role];
    navigate(cfg ? cfg.path : '/marketplace', { replace: true });
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌿</div>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.title}</h1>
        <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>{t.sub}</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '640px', width: '100%' }}>
        {roles.map((role) => {
          const cfg = ROLE_CONFIG[role];
          if (!cfg) return null;
          return (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              style={{
                flex: '1 1 260px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '12px', padding: '32px 24px', borderRadius: '16px',
                border: '2px solid var(--border)', background: 'var(--card)',
                cursor: 'pointer', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.boxShadow = `0 4px 20px ${cfg.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '48px' }}>{cfg.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)' }}>{t[cfg.labelKey]}</div>
              <div style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', lineHeight: '1.5' }}>{t[cfg.descKey]}</div>
              <div style={{
                marginTop: '8px', padding: '8px 24px', borderRadius: '8px',
                background: cfg.color, color: '#fff', fontSize: '14px', fontWeight: 600,
              }}>
                {t.continue}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '32px', background: 'none', border: 'none',
          color: 'var(--muted)', cursor: 'pointer', fontSize: '14px',
        }}
      >
        {t.logout}
      </button>
    </main>
  );
}
