import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCrop, deleteCrop } from '../../services/cropService';
import { listCultivations, abandonCultivation } from '../../utils/cultivationApi';
import { getAuthSession } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { LAND_T } from '../../data/translations';
import Toast from '../../components/Toast';

function resolveCultStatus(sessions, cropName) {
  if (!sessions || !sessions.length || !cropName) return null;
  const match = sessions.find(s => s.crop.toLowerCase() === cropName.toLowerCase());
  if (!match) return null;
  if (match.status === 'abandoned') return 'Abandoned';
  if (match.status === 'completed') return 'Completed';
  return 'Active';
}

export default function CropDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;
  const { user } = getAuthSession();
  const userId = user?.id ? String(user.id) : null;

  const [crop,          setCrop]          = useState(null);
  const [cultStatus,    setCultStatus]    = useState(null);
  const [cultSession,   setCultSession]   = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [showAbandon,   setShowAbandon]   = useState(false);
  const [isAbandoning,  setIsAbandoning]  = useState(false);
  const [toast,         setToast]         = useState({ type: 'success', message: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [cropData, cultData] = await Promise.all([
          getCrop(id),
          userId
            ? listCultivations(userId).catch(() => ({ sessions: [] }))
            : Promise.resolve({ sessions: [] }),
        ]);
        const allSessions = cultData.sessions || [];
        const matchedSession = allSessions.find(
          s => s.crop.toLowerCase() === cropData?.crop_name?.toLowerCase()
        ) || null;
        setCrop(cropData);
        setCultStatus(resolveCultStatus(allSessions, cropData?.crop_name));
        setCultSession(matchedSession);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, userId]);

  const confirmAbandon = async () => {
    setIsAbandoning(true);
    try {
      if (cultSession && userId) await abandonCultivation(userId, cultSession.id);
      await deleteCrop(id);
      navigate('/landowner/crops');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setShowAbandon(false);
    } finally {
      setIsAbandoning(false);
    }
  };

  if (isLoading) return <div className="crop-loading">{t.loadingCropDetails}</div>;

  if (!crop) {
    return (
      <section className="crop-form-page">
        <div className="crop-form-header">
          <h1>{t.cropNotFound}</h1>
          <p>{t.cropNotFoundDesc}</p>
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/crops')}>
            {t.backToCropsBtn}
          </button>
        </div>
      </section>
    );
  }

  const displayStatus = cultStatus || crop.status;
  const statusCls = displayStatus.toLowerCase().replace(/\s/g, '-');

  return (
    <section className="crop-detail-page">
      <Link className="crop-detail-back" to="/landowner/crops">{t.backToCropsLink}</Link>

      <div className="crop-detail-card">
        <div className="crop-detail-header">
          <div>
            <p className="section__label">{t.cropDetailsLabel}</p>
            <h1>{crop.crop_name}</h1>
            <p className="crop-detail-header__meta">{crop.crop_type}</p>
          </div>
          <span className={`crop-card__status-badge crop-card__status-badge--${statusCls}`}>
            {displayStatus}
          </span>
        </div>

        <div className="crop-detail-body">
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-row__label">{t.farmField}</span>
              <span className="detail-row__value">
                {crop.farm_id
                  ? <Link to={`/landowner/farms/${crop.farm_id}`}>{crop.farm_name || crop.farm_id}</Link>
                  : (crop.farm_name || '—')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.cropTypeRow}</span>
              <span className="detail-row__value">{crop.crop_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.statusRow}</span>
              <span className="detail-row__value">{displayStatus}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Started Date</span>
              <span className="detail-row__value">
                {crop.planting_date ? new Date(crop.planting_date).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.expectedHarvestRow}</span>
              <span className="detail-row__value">
                {crop.expected_harvest_date ? new Date(crop.expected_harvest_date).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="crop-detail-footer">
          <Link className="button button--outline" to="/landowner/crops">{t.allCropsLink}</Link>
          <button
            className="button button--danger"
            type="button"
            onClick={() => setShowAbandon(true)}
          >
            Abandon Crop
          </button>
        </div>
      </div>

      {showAbandon && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>Abandon Crop</h2>
            <p>
              Abandon <strong>{crop.crop_name}</strong>? This will permanently delete the crop
              {cultSession ? ' and its tracking session' : ''}. There is no way to undo this.
            </p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setShowAbandon(false)}>
                Cancel
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
