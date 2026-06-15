import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getCrops, deleteCrop } from '../../services/cropService';
import { listCultivations, abandonCultivation } from '../../utils/cultivationApi';
import { getAuthSession } from '../../services/api';
import { CROP_EMOJI, getCropLabel } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { T, LAND_T } from '../../data/translations';
import CultivationTracker from '../../components/CultivationTracker';
import Toast from '../../components/Toast';

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

export default function MyCultivations() {
  const { lang }   = useApp();
  const t          = T[lang] || T.en;
  const lt         = LAND_T[lang] || LAND_T.en;
  const { user }   = getAuthSession();
  const userId     = user?.id ? String(user.id) : null;
  const location   = useLocation();

  const [view,              setView]              = useState('list');
  const [activeSessionId,   setActiveSessionId]   = useState(null);
  const [startCrop,         setStartCrop]         = useState('');
  const [startExistingCrop, setStartExistingCrop] = useState(null);
  const [crops,             setCrops]             = useState([]);
  const [sessions,          setSessions]          = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [abandonTarget,     setAbandonTarget]     = useState(null);
  const [isAbandoning,      setIsAbandoning]      = useState(false);
  const [toast,             setToast]             = useState({ type: 'success', message: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cropData, cultData] = await Promise.all([
        getCrops(),
        userId
          ? listCultivations(userId).catch(() => ({ sessions: [] }))
          : Promise.resolve({ sessions: [] }),
      ]);
      setCrops(cropData.filter(c => c.status === 'Active'));
      setSessions(cultData.sessions || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (location.state?.sessionId) {
      setActiveSessionId(location.state.sessionId);
      setView('tracker');
    }
  }, []);

  function getSession(crop) {
    return sessions.find(s =>
      (s.status === 'active') && (
        (crop.id && s.crop_id && s.crop_id === String(crop.id)) ||
        s.crop.toLowerCase() === crop.crop_name.toLowerCase()
      )
    ) || null;
  }

  function goBack() {
    setView('list');
    setActiveSessionId(null);
    setStartCrop('');
    setStartExistingCrop(null);
    loadData();
  }

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

  // ── Render in a stable section so the fadeInUp animation doesn't replay on view switch
  return (
    <section className="crop-page">
      {view === 'tracker' ? (
        <>
          <CultivationTracker
            key={activeSessionId || 'new-' + startCrop}
            t={t}
            userId={userId}
            initialSessionId={activeSessionId || undefined}
            initialView={activeSessionId ? undefined : 'start'}
            initialCrop={startCrop || undefined}
            existingCropData={startExistingCrop || undefined}
            onExternalBack={goBack}
          />
          <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
        </>
      ) : (
        // ── Crop list view ──────────────────────────────────────────────────
        <>
      <div className="crop-page__header" style={{ marginBottom: 0 }}>
        <div>
          <p className="section__label">{lt.cultivationTracking}</p>
          <h1>{lt.myCultivationsTitle}</h1>
          <p className="section__copy">{lt.myCultivationsDesc}</p>
        </div>
        <div className="crop-actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => { setStartCrop(''); setActiveSessionId(null); setView('tracker'); }}
          >
            {lt.startNewCultBtn}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="crop-loading">{lt.loading}</div>
      ) : crops.length === 0 ? (
        <div className="crop-empty">
          <p>{lt.noCultivationsYet}</p>
        </div>
      ) : (
        <div className="cult-crop-list">
          {crops.map(crop => {
            const session = getSession(crop);
            const prog    = session ? sessionProgress(session) : null;
            const emoji   = CROP_EMOJI[crop.crop_name] || '🌱';

            return (
              <div key={crop.id} className="cult-crop-card">
                <div className="cult-crop-card__left">
                  <span className="cult-crop-card__emoji">{emoji}</span>
                </div>
                <div className="cult-crop-card__body">
                  <div className="cult-crop-card__top">
                    <div>
                      <span className="cult-crop-card__name">{getCropLabel(crop.crop_name, lang)}</span>
                      <span className="cult-crop-card__farm">📍 {crop.farm_name || '—'}</span>
                    </div>
                    <span className={`cult-status-badge status-${session ? 'active' : 'pending'}`}>
                      {session ? lt.trackingBadge : lt.noTrackingBadge}
                    </span>
                  </div>

                  <div className="cult-crop-card__meta">
                    {lt.startedLabel}: <strong>{new Date(crop.planting_date).toLocaleDateString()}</strong>
                    &nbsp;·&nbsp;
                    {lt.harvestCardLabel}: <strong>{new Date(crop.expected_harvest_date).toLocaleDateString()}</strong>
                    {prog?.elapsed !== null && prog?.elapsed !== undefined && (
                      <>&nbsp;·&nbsp;{lt.dayPrefix} <strong>{prog.elapsed}</strong></>
                    )}
                  </div>

                  {prog && (
                    <div className="cult-crop-card__progress">
                      <div className="cult-progress-bar">
                        <div className="cult-progress-fill" style={{ width: `${prog.pct}%` }} />
                      </div>
                      <span className="cult-crop-card__prog-label">
                        {prog.done}/{prog.total} {lt.tasksWord} · {prog.pct}%
                        {prog.overdue > 0 && (
                          <span className="cult-overdue-badge" style={{ marginLeft: 8 }}>⚠ {prog.overdue} {lt.statOverdue}</span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="cult-crop-card__actions">
                    {session ? (
                      <button
                        className="cult-btn cult-btn-open"
                        type="button"
                        onClick={() => { setActiveSessionId(session.id); setView('tracker'); }}
                      >
                        {lt.openTrackingBtn}
                      </button>
                    ) : (
                      <button
                        className="cult-btn cult-btn-open"
                        type="button"
                        onClick={() => {
                          setStartCrop(crop.crop_name);
                          setStartExistingCrop(crop);
                          setActiveSessionId(null);
                          setView('tracker');
                        }}
                      >
                        {lt.startTrackingBtn}
                      </button>
                    )}
                    <button
                      className="cult-btn cult-btn-abandon"
                      type="button"
                      onClick={() => setAbandonTarget({ crop, session })}
                    >
                      {lt.abandonBtn}
                    </button>
                  </div>
                </div>
              </div>
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
              <button
                className="button button--danger"
                type="button"
                onClick={confirmAbandon}
                disabled={isAbandoning}
              >
                {isAbandoning ? lt.abandoningDots : lt.yesAbandonBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
        </>
      )}
    </section>
  );
}
