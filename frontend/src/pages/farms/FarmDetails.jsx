import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFarm } from '../../services/farmService';
import { createCrop, getCropsByFarm } from '../../services/cropService';
import { listCultivations } from '../../utils/cultivationApi';
import { getAuthSession } from '../../services/api';
import { CROP_EMOJI, ALL_CROPS } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { LAND_T, SEA_LABELS, IRR_LABELS } from '../../data/translations';
import Toast from '../../components/Toast';

export default function FarmDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;
  const { user } = getAuthSession();
  const userId = user?.id ? String(user.id) : null;

  const [farm,     setFarm]     = useState(null);
  const [crops,    setCrops]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({ crop_name: '', planting_date: '' });
  const [isStarting, setIsStarting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [farmData, cropsData, cultData] = await Promise.all([
          getFarm(id),
          getCropsByFarm(id),
          userId
            ? listCultivations(userId).catch(() => ({ sessions: [] }))
            : Promise.resolve({ sessions: [] }),
        ]);
        setFarm(farmData);
        setCrops(cropsData);
        setSessions((cultData.sessions || []).filter(s => s.status === 'active'));
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, userId]);

  const openModal = () => {
    setModalError('');
    setModalForm(f => ({ ...f, crop_name: '', planting_date: '' }));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError('');
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStartCultivating = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!modalForm.crop_name) { setModalError(t.pleaseSelectCrop); return; }
    if (!modalForm.planting_date) { setModalError(t.pleaseSelectDate); return; }

    setIsStarting(true);
    try {
      // Fetch crop-specific duration from ML service (port 8000 via Vite proxy)
      let duration = 120;
      try {
        const gr = await fetch(`/guidance/${encodeURIComponent(modalForm.crop_name)}`);
        const gd = await gr.json();
        const stages = gd.data?.stages || [];
        const maxDay = stages.reduce((m, s) => Math.max(m, s.day_end || 0), 0);
        duration = maxDay > 0 ? maxDay : (gd.data?.duration_days || 120);
      } catch {}

      const planting = new Date(modalForm.planting_date);
      const harvest = new Date(planting);
      harvest.setDate(harvest.getDate() + duration);
      const harvestStr = harvest.toISOString().split('T')[0];

      await createCrop({
        farm_id: id,
        crop_name: modalForm.crop_name,
        crop_type: modalForm.crop_name,
        category: 'General',
        growth_stage: 'Seed',
        planting_date: modalForm.planting_date,
        expected_harvest_date: harvestStr,
        status: 'Active',
      });
      navigate('/landowner/cultivations');
    } catch (error) {
      setModalError(error.message);
      setIsStarting(false);
    }
  };

  const cropOptions = ALL_CROPS;

  function findSession(cropName) {
    return sessions.find(s => s.crop.toLowerCase() === cropName.toLowerCase()) || null;
  }

  if (isLoading) return <div className="farm-loading">{t.loadingFarmDetails}</div>;

  if (!farm) {
    return (
      <section className="farm-form-page">
        <div className="farm-form-header">
          <h1>{t.farmNotFound}</h1>
          <p>{t.farmNotFoundDesc}</p>
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/farms')}>
            {t.backToFarmsBtn}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="farm-detail-page">
      <Link className="farm-detail-back" to="/landowner/farms">{t.backToFarmsLink}</Link>

      <div className="farm-detail-card">

        {farm.image_data && (
          <div className="farm-detail-hero">
            <img src={farm.image_data} alt={farm.farm_name} />
          </div>
        )}

        <div className="farm-detail-header">
          <div>
            <p className="section__label">{t.farmDetailsLabel}</p>
            <h1>{farm.farm_name}</h1>
            {farm.district && (
              <p className="farm-detail-header__district">📍 {farm.district} {t.districtSuffix}</p>
            )}
            <p className="farm-detail-header__meta">{farm.location}</p>
          </div>
          <div className="farm-detail-actions">
            <button className="button button--primary" type="button" onClick={openModal}>
              {t.startCultivationBtn}
            </button>
            <Link className="button button--outline" to={`/landowner/farms/edit/${farm.id}`}>
              {t.editFarmLink}
            </Link>
          </div>
        </div>

        <div className="farm-detail-body">
          <div className="detail-section">
            <h3>{t.landInfoSection}</h3>
            <div className="detail-row">
              <span className="detail-row__label">{t.districtRow}</span>
              <span className="detail-row__value">{farm.district || '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.locationRow}</span>
              <span className="detail-row__value">{farm.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.farmSizeRow}</span>
              <span className="detail-row__value">{farm.farm_size} {farm.size_unit || 'acres'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.soilTypeRow}</span>
              <span className="detail-row__value">{farm.soil_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.irrigationRow}</span>
              <span className="detail-row__value">{farm.irrigation_type ? (IRR_LABELS[lang]?.[farm.irrigation_type] || farm.irrigation_type) : '—'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.seasonRow}</span>
              <span className="detail-row__value">{SEA_LABELS[lang]?.[farm.season] || farm.season}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>{t.cultivatedCropsSection}</h3>

            {farm.cultivated_crops && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{t.plannedCropsLabel}</p>
                <div className="farm-detail-crops">
                  {farm.cultivated_crops.split(',').map(c => c.trim()).filter(Boolean).map(crop => (
                    <span key={crop} className="farm-detail-crop-chip farm-detail-crop-chip--planned">
                      {CROP_EMOJI[crop] || '🌱'} {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {crops.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{t.noActiveCult}</p>
            ) : (
              <>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{t.activeCultLabel}</p>
                <div className="farm-detail-crops">
                  {crops.map(crop => {
                    const session = findSession(crop.crop_name);
                    return (
                      <div key={crop.id} className="farm-detail-crop-row">
                        <Link
                          className="farm-detail-crop-chip"
                          to={`/landowner/crops/${crop.id}`}
                        >
                          {CROP_EMOJI[crop.crop_name] || '🌱'} {crop.crop_name}
                          {crop.growth_stage && <span className="chip-stage">{crop.growth_stage}</span>}
                        </Link>
                        {session && (
                          <button
                            className="button button--outline farm-detail-track-btn"
                            type="button"
                            onClick={() => navigate('/landowner/cultivations', { state: { sessionId: session.id } })}
                          >
                            📊 Track
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="detail-section">
            <h3>{t.recordInfoSection}</h3>
            <div className="detail-row">
              <span className="detail-row__label">{t.createdRow}</span>
              <span className="detail-row__value">{new Date(farm.created_at).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">{t.lastUpdatedRow}</span>
              <span className="detail-row__value">{new Date(farm.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="cult-modal-overlay" onClick={closeModal}>
          <div className="cult-modal" onClick={e => e.stopPropagation()}>
            <div className="cult-modal__header">
              <div>
                <h2>{t.startACultivation}</h2>
                <p>{farm.farm_name}</p>
              </div>
              <button className="cult-modal__close" type="button" onClick={closeModal}>✕</button>
            </div>

            <form className="cult-modal__form" onSubmit={handleStartCultivating}>
              <label>
                {t.whichCropLabel}
                <select name="crop_name" value={modalForm.crop_name} onChange={handleModalChange} required>
                  <option value="">{t.selectACropPh}</option>
                  {cropOptions.map(c => (
                    <option key={c} value={c}>{CROP_EMOJI[c] || '🌱'} {c}</option>
                  ))}
                </select>
              </label>

              <label>
                {t.plantingDateLabel}
                <input
                  name="planting_date"
                  type="date"
                  value={modalForm.planting_date}
                  onChange={handleModalChange}
                  required
                />
              </label>

              {modalError && <p className="cult-modal__error">{modalError}</p>}

              <div className="cult-modal__actions">
                <button className="button button--outline" type="button" onClick={closeModal}>
                  {t.cancelBtn}
                </button>
                <button className="button button--primary" type="submit" disabled={isStarting}>
                  {isStarting ? t.startingDots : t.startCultivatingBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
