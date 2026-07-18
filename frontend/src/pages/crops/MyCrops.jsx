import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCrops, deleteCrop } from '../../services/cropService';
import { listCultivations, abandonCultivation } from '../../utils/cultivationApi';
import { getAuthSession } from '../../services/api';
import { CROP_EMOJI, getCropLabel } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { LAND_T, CROP_STATUS_LABELS } from '../../data/translations';
import Toast from '../../components/Toast';
import SpotlightTour   from '../../components/tour/SpotlightTour';
import useAutoOpenOnce from '../../components/tour/useAutoOpenOnce';
import HelpButton      from '../../components/tour/HelpButton';

const MC_TOUR_T = {
  en: {
    steps: [
      { target: 'crop-status-tabs', title: 'Filter by status', body: 'Switch between Active, Completed, Failed and All to find what you’re looking for.' },
      { target: 'crop-card-actions', title: 'Manage a crop', body: 'View details, jump to its cultivation tracker, or abandon it from here.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'crop-status-tabs', title: 'තත්ත්වය අනුව පෙරහන් කරන්න', body: 'ඔබ සොයන දේ සොයාගැනීමට ක්‍රියාකාරී, සම්පූර්ණ, අසාර්ථක සහ සියල්ල අතර මාරු වන්න.' },
      { target: 'crop-card-actions', title: 'බෝගයක් කළමනාකරණය කරන්න', body: 'විස්තර බලන්න, එහි වගා ලුහුබැඳීමට යන්න, හෝ මෙතැනින් අත්හරින්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'crop-status-tabs', title: 'நிலை மூலம் வடிகட்டவும்', body: 'நீங்கள் தேடுவதைக் கண்டறிய செயலில், முடிந்தது, தோல்வி மற்றும் அனைத்திற்கும் இடையே மாறவும்.' },
      { target: 'crop-card-actions', title: 'ஒரு பயிரை நிர்வகிக்கவும்', body: 'விவரங்களைப் பார்க்க, அதன் சாகுபடி கண்காணிப்பாளருக்குச் செல்ல, அல்லது இங்கிருந்து கைவிடவும்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

function sessionProgress(session) {
  const tasks = Object.values(session.tasks || {});
  if (!tasks.length) return { done: 0, total: 0, pct: 0, overdue: 0, elapsed: null };
  const today   = new Date().toISOString().slice(0, 10);
  const done    = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t =>
    t.status !== 'done' && t.status !== 'skipped' && t.scheduled_date < today
  ).length;
  const elapsed = session.planting_date
    ? Math.floor((Date.now() - new Date(session.planting_date).getTime()) / 86400000)
    : null;
  return { done, total: tasks.length, pct: Math.round((done / tasks.length) * 100), overdue, elapsed };
}

export default function MyCrops() {
  const { lang }  = useApp();
  const lt        = LAND_T[lang] || LAND_T.en;
  const navigate  = useNavigate();
  const { user }  = getAuthSession();
  const userId    = user?.id ? String(user.id) : null;

  const [crops,        setCrops]        = useState([]);
  const [sessions,     setSessions]     = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [searchText,   setSearchText]   = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [toast,        setToast]        = useState({ type: 'success', message: '' });
  const [abandonTarget, setAbandonTarget] = useState(null);
  const [isAbandoning,  setIsAbandoning]  = useState(false);
  const mcTourT = MC_TOUR_T[lang] || MC_TOUR_T.en;
  const [tourOpen, setTourOpen] = useAutoOpenOnce('sa_tour_mycrops_seen_v1', !isLoading);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cropData, cultData] = await Promise.all([
        getCrops(),
        userId
          ? listCultivations(userId).catch(() => ({ sessions: [] }))
          : Promise.resolve({ sessions: [] }),
      ]);
      setCrops(cropData);
      setSessions(cultData.sessions || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  function getSession(crop) {
    return sessions.find(s =>
      (crop.id && s.crop_id && s.crop_id === String(crop.id)) ||
      s.crop.toLowerCase() === crop.crop_name.toLowerCase()
    ) || null;
  }

  const filtered = useMemo(() => {
    const bySt = statusFilter === 'All' ? crops : crops.filter(c => c.status === statusFilter);
    const q = searchText.trim().toLowerCase();
    if (!q) return bySt;
    return bySt.filter(c =>
      [c.crop_name, c.crop_type, c.farm_name].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [crops, searchText, statusFilter]);

  const confirmAbandon = async () => {
    if (!abandonTarget) return;
    setIsAbandoning(true);
    const { crop, session } = abandonTarget;
    try {
      if (session) await abandonCultivation(userId, session.id);
      await deleteCrop(crop.id);
      setToast({ type: 'success', message: lt.cropRemovedMsg(crop.crop_name) });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setAbandonTarget(null);
      setIsAbandoning(false);
    }
  };

  return (
    <section className="crop-page">
      <div className="crop-page__header">
        <div>
          <p className="section__label">{lt.cultivationTracking}</p>
          <h1>{lt.myCropsTitle}</h1>
          <p className="section__copy">{lt.myCropsDesc}</p>
        </div>
      </div>

      <div className="crop-toolbar">
        <div className="crop-status-tabs" data-tour="crop-status-tabs">
          {[
            { key: 'Active',    label: lt.statusActiveTab,    icon: '🌱', color: 'active'    },
            { key: 'Completed', label: lt.statusCompletedTab, icon: '✅', color: 'completed' },
            { key: 'Failed',    label: lt.statusFailedTab,    icon: '❌', color: 'failed'    },
            { key: 'All',       label: lt.statusAllTab,       icon: '📋', color: 'all'       },
          ].map(({ key, label, icon, color }) => {
            const count = key === 'All' ? crops.length : crops.filter(c => c.status === key).length;
            return (
              <button
                key={key}
                type="button"
                className={`crop-status-tab crop-status-tab--${color}${statusFilter === key ? ' active' : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                <span className="crop-status-tab__icon">{icon}</span>
                <span className="crop-status-tab__label">{label}</span>
                <span className="crop-status-tab__count">{count}</span>
              </button>
            );
          })}
        </div>
        <input
          className="crop-search"
          placeholder={lt.searchCropsPh}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          data-tour="crop-search"
        />
      </div>

      {isLoading ? (
        <div className="crop-loading">{lt.loadingCropsDots}</div>
      ) : filtered.length === 0 ? (
        <div className="crop-empty">
          <p>{lt.noCropsFound}</p>
          <Link className="button button--primary" to="/landowner/cultivations">
            {lt.startTrackingBtn}
          </Link>
        </div>
      ) : (
        <div className="crop-grid">
          {filtered.map((crop, i) => {
            const session = getSession(crop);
            const prog = session ? sessionProgress(session) : null;
            const emoji = CROP_EMOJI[crop.crop_name] || '🌱';

            return (
              <article key={crop.id} className="crop-card" data-tour={i === 0 ? 'crop-card' : undefined}>
                <div className="crop-card__image crop-card__image--emoji">
                  <span className="crop-card__emoji">{emoji}</span>
                  <span className={`crop-card__status-badge crop-card__status-badge--${(crop.status || 'active').toLowerCase()}`}>{CROP_STATUS_LABELS[lang]?.[crop.status] || crop.status}</span>
                </div>
                <div className="crop-card__body">
                  <div className="crop-card__heading">
                    <p className="crop-card__name">{getCropLabel(crop.crop_name, lang)}</p>
                    <p className="crop-card__meta">{getCropLabel(crop.crop_type, lang)}</p>
                  </div>
                  <div className="crop-card__details">
                    <div><span>{lt.farmCardLabel}</span><strong>{crop.farm_name || '—'}</strong></div>
                    <div><span>{lt.startedLabel}</span><strong>{new Date(crop.planting_date).toLocaleDateString()}</strong></div>
                    <div><span>{lt.harvestCardLabel}</span><strong>{new Date(crop.expected_harvest_date).toLocaleDateString()}</strong></div>
                  </div>

                  {session && prog && (
                    <div className="crop-card__cult">
                      <div className="crop-card__cult-row">
                        <span className="crop-card__cult-label">🌱 {lt.dayPrefix} {prog.elapsed ?? '—'}</span>
                        {prog.overdue > 0 && (
                          <span className="crop-card__cult-overdue">⚠ {prog.overdue} {lt.statOverdue}</span>
                        )}
                        <span className="crop-card__cult-active">{lt.trackingBadge}</span>
                      </div>
                      <div className="crop-card__cult-track">
                        <div className="crop-card__cult-bar">
                          <div className="crop-card__cult-fill" style={{ width: `${prog.pct}%` }} />
                        </div>
                        <span className="crop-card__cult-pct">{prog.done}/{prog.total} · {prog.pct}%</span>
                      </div>
                    </div>
                  )}

                  <div className="crop-card__actions" data-tour={i === 0 ? 'crop-card-actions' : undefined}>
                    <Link className="button button--outline" to={`/landowner/crops/${crop.id}`}>
                      {lt.viewBtn}
                    </Link>
                    {session && (
                      <button
                        className="button button--primary"
                        type="button"
                        onClick={() => navigate('/landowner/cultivations', { state: { sessionId: session.id } })}
                      >
                        {lt.trackBtn}
                      </button>
                    )}
                    <button
                      className="button button--danger"
                      type="button"
                      onClick={() => setAbandonTarget({ crop, session })}
                    >
                      {lt.abandonBtn}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {abandonTarget && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>{lt.abandonCultivationTitle}</h2>
            <p>
              {lt.abandonBtn} <strong>{getCropLabel(abandonTarget.crop.crop_name, lang)}</strong>? {abandonTarget.session ? lt.abandonCropMsg : lt.abandonCropOnlyMsg}
            </p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setAbandonTarget(null)}>
                {lt.cancelBtn}
              </button>
              <button className="button button--danger" type="button" onClick={confirmAbandon} disabled={isAbandoning}>
                {isAbandoning ? lt.abandoningDots : lt.yesAbandonBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />

      <HelpButton label={mcTourT.needHelp} ariaLabel={mcTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={mcTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey="sa_tour_mycrops_seen_v1"
        labels={{ next: mcTourT.next, back: mcTourT.back, skip: mcTourT.skip, done: mcTourT.done }}
      />
    </section>
  );
}
