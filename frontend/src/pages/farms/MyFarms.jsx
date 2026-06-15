import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteFarm, getFarms } from '../../services/farmService';
import { getCrops } from '../../services/cropService';
import { useApp } from '../../context/AppContext';
import { LAND_T, SEA_LABELS, IRR_LABELS } from '../../data/translations';
import { getSoilLabel } from '../../data/cropData';
import Toast from '../../components/Toast';

export default function MyFarms() {
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;

  const [farms,       setFarms]       = useState([]);
  const [cropCounts,  setCropCounts]  = useState({});
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchText,  setSearchText]  = useState('');
  const [toast,       setToast]       = useState({ type: 'success', message: '' });
  const [deleteTarget,setDeleteTarget]= useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [farmsData, cropsData] = await Promise.all([getFarms(), getCrops().catch(() => [])]);
      setFarms(farmsData);
      const counts = {};
      (cropsData || []).forEach(c => {
        if (c.farm_id) counts[c.farm_id] = (counts[c.farm_id] || 0) + 1;
      });
      setCropCounts(counts);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredFarms = useMemo(
    () => farms.filter((farm) => {
      const q = searchText.trim().toLowerCase();
      if (!q) return true;
      return [farm.farm_name, farm.location, farm.district, farm.soil_type, farm.irrigation_type, farm.season]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    }),
    [farms, searchText],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFarm(deleteTarget.id);
      setFarms(prev => prev.filter(f => f.id !== deleteTarget.id));
      setToast({ type: 'success', message: t.farmDeletedOk });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="farm-page">
      <div className="farm-page__header">
        <div>
          <p className="section__label">{t.landRegistry}</p>
          <h1>{t.myFarms}</h1>
          <p className="section__copy">{t.myFarmsDesc}</p>
        </div>
        <div className="farm-actions">
          <Link className="button button--primary" to="/landowner/farms/add">{t.addFarmBtn}</Link>
        </div>
      </div>

      <div className="farm-toolbar">
        <input
          className="farm-search"
          placeholder={t.searchFarmsPh}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="farm-loading">{t.loadingFarms}</div>
      ) : filteredFarms.length === 0 ? (
        <div className="farm-empty">
          <div className="farm-empty__icon">🌾</div>
          <p>{t.noFarmsYet}</p>
          <Link className="button button--primary" to="/landowner/farms/add">{t.registerFirstLand}</Link>
        </div>
      ) : (
        <div className="farm-grid">
          {filteredFarms.map((farm) => (
            <article key={farm.id} className="farm-card">
              <div className="farm-card__image">
                {farm.image_data ? (
                  <img src={farm.image_data} alt={farm.farm_name} className="farm-card__photo" />
                ) : (
                  <div className="farm-card__image-placeholder">🌾</div>
                )}
                <span className="farm-card__season-badge">{SEA_LABELS[lang]?.[farm.season] || farm.season}</span>
                {farm.district && (
                  <span className="farm-card__district-badge">📍 {farm.district}</span>
                )}
              </div>

              <div className="farm-card__body">
                <div className="farm-card__heading">
                  <p className="farm-card__name">{farm.farm_name}</p>
                  <p className="farm-card__meta">{farm.location}</p>
                </div>

                <div className="farm-card__details">
                  <div>
                    <span>{t.sizeLabel}</span>
                    <strong>{farm.farm_size} {farm.size_unit || 'acres'}</strong>
                  </div>
                  <div>
                    <span>{t.soilLabel}</span>
                    <strong>{getSoilLabel(farm.soil_type, lang)}</strong>
                  </div>
                  <div>
                    <span>{t.irrigLabel}</span>
                    <strong>{farm.irrigation_type ? (IRR_LABELS[lang]?.[farm.irrigation_type] || farm.irrigation_type) : '—'}</strong>
                  </div>
                  <div>
                    <span>{t.cropsLabel}</span>
                    <strong>{cropCounts[farm.id] ?? 0} {t.cultivatedSuffix}</strong>
                  </div>
                </div>

                <div className="farm-card__actions">
                  <Link className="button button--outline" to={`/landowner/farms/${farm.id}`}>{t.viewBtn}</Link>
                  <Link className="button button--outline" to={`/landowner/farms/edit/${farm.id}`}>{t.editBtn}</Link>
                  <button className="button button--danger" type="button" onClick={() => setDeleteTarget(farm)}>{t.deleteBtn}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>{t.confirmDelete}</h2>
            <p>{t.deleteFarmMsg(deleteTarget.farm_name)}</p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setDeleteTarget(null)}>{t.cancelBtn}</button>
              <button className="button button--danger" type="button" onClick={confirmDelete}>{t.deleteFarmBtn}</button>
            </div>
          </div>
        </div>
      )}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
