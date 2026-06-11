import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCrops, updateCrop } from '../../services/cropService';
import { listCultivations, abandonCultivation } from '../../utils/cultivationApi';
import { getAuthSession } from '../../services/api';
import { CROP_EMOJI } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { LAND_T } from '../../data/translations';
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
  const [toast,        setToast]        = useState({ type: 'success', message: '' });
  const [abandonTarget, setAbandonTarget] = useState(null);
  const [isAbandoning,  setIsAbandoning]  = useState(false);

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
      setSessions((cultData.sessions || []).filter(s => s.status === 'active'));
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  function getSession(cropName) {
    return sessions.find(s => s.crop.toLowerCase() === cropName.toLowerCase()) || null;
  }

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter(c =>
      [c.crop_name, c.crop_type, c.farm_name].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [crops, searchText]);

  const confirmAbandon = async () => {
    if (!abandonTarget) return;
    setIsAbandoning(true);
    const { crop, session } = abandonTarget;
    try {
      if (session) await abandonCultivation(userId, session.id);
      await updateCrop(crop.id, { status: 'Failed' });
      setToast({ type: 'success', message: `${crop.crop_name} cultivation abandoned.` });
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
          <p className="section__label">Current Cultivations</p>
          <h1>{lt.myCropsTitle}</h1>
          <p className="section__copy">All crops currently being cultivated on your farms.</p>
        </div>
      </div>

      <div className="crop-toolbar">
        <input
          className="crop-search"
          placeholder="Search by crop name, type, or farm…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="crop-loading">{lt.loadingCropsDots}</div>
      ) : filtered.length === 0 ? (
        <div className="crop-empty">
          <p>No active crops found.</p>
          <Link className="button button--primary" to="/landowner/cultivations">
            Start a Cultivation
          </Link>
        </div>
      ) : (
        <div className="crop-grid">
          {filtered.map(crop => {
            const session = getSession(crop.crop_name);
            const prog = session ? sessionProgress(session) : null;
            const emoji = CROP_EMOJI[crop.crop_name] || '🌱';

            return (
              <article key={crop.id} className="crop-card">
                <div className="crop-card__image crop-card__image--emoji">
                  <span className="crop-card__emoji">{emoji}</span>
                  <span className="crop-card__status-badge crop-card__status-badge--active">Active</span>
                </div>
                <div className="crop-card__body">
                  <div className="crop-card__heading">
                    <p className="crop-card__name">{crop.crop_name}</p>
                    <p className="crop-card__meta">{crop.crop_type}</p>
                  </div>
                  <div className="crop-card__details">
                    <div><span>{lt.farmCardLabel}</span><strong>{crop.farm_name || '—'}</strong></div>
                    <div><span>Started</span><strong>{new Date(crop.planting_date).toLocaleDateString()}</strong></div>
                    <div><span>{lt.harvestCardLabel}</span><strong>{new Date(crop.expected_harvest_date).toLocaleDateString()}</strong></div>
                  </div>

                  {session && prog && (
                    <div className="crop-card__cult">
                      <div className="crop-card__cult-row">
                        <span className="crop-card__cult-label">🌱 {lt.dayPrefix} {prog.elapsed ?? '—'}</span>
                        {prog.overdue > 0 && (
                          <span className="crop-card__cult-overdue">⚠ {prog.overdue} overdue</span>
                        )}
                        <span className="crop-card__cult-active">Tracking 🟢</span>
                      </div>
                      <div className="crop-card__cult-track">
                        <div className="crop-card__cult-bar">
                          <div className="crop-card__cult-fill" style={{ width: `${prog.pct}%` }} />
                        </div>
                        <span className="crop-card__cult-pct">{prog.done}/{prog.total} · {prog.pct}%</span>
                      </div>
                    </div>
                  )}

                  <div className="crop-card__actions">
                    <Link className="button button--outline" to={`/landowner/crops/${crop.id}`}>
                      {lt.viewBtn}
                    </Link>
                    {session && (
                      <button
                        className="button button--primary"
                        type="button"
                        onClick={() => navigate('/landowner/cultivations', { state: { sessionId: session.id } })}
                      >
                        📊 Track
                      </button>
                    )}
                    <button
                      className="button button--danger"
                      type="button"
                      onClick={() => setAbandonTarget({ crop, session })}
                    >
                      Abandon
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
            <h2>Abandon Cultivation</h2>
            <p>
              Stop cultivating <strong>{abandonTarget.crop.crop_name}</strong>? This will mark the crop
              as abandoned{abandonTarget.session ? ' and end the tracking session' : ''}.
            </p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setAbandonTarget(null)}>
                {lt.cancelBtn}
              </button>
              <button className="button button--danger" type="button" onClick={confirmAbandon} disabled={isAbandoning}>
                {isAbandoning ? 'Abandoning…' : 'Yes, Abandon'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
