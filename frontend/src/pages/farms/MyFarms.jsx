import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteFarm, getFarms } from '../../services/farmService';
import { getCrops } from '../../services/cropService';
import { useApp } from '../../context/AppContext';
import { LAND_T, SEA_LABELS, IRR_LABELS } from '../../data/translations';
import { getSoilLabel } from '../../data/cropData';
import Toast from '../../components/Toast';
import SpotlightTour   from '../../components/tour/SpotlightTour';
import useAutoOpenOnce from '../../components/tour/useAutoOpenOnce';
import HelpButton      from '../../components/tour/HelpButton';

const MF_TOUR_T = {
  en: {
    steps: [
      { target: 'farm-add-btn', title: 'Add your first farm', body: 'Register a farm to start tracking crops, cultivations, and marketplace listings for it.' },
      { target: 'farm-card-actions', title: 'Manage a farm', body: 'View full details, edit, or delete a farm from here.' },
    ],
    next: 'Next →', back: '← Back', skip: 'Skip tour', done: 'Got it', helpAria: 'Replay the guided tour', needHelp: 'Need Help',
  },
  si: {
    steps: [
      { target: 'farm-add-btn', title: 'ඔබේ පළමු ගොවිපළ එකතු කරන්න', body: 'එහි බෝග, වගාවන් සහ වෙළඳසැල් ලැයිස්තු ලුහුබැඳීම ආරම්භ කිරීමට ගොවිපළක් ලියාපදිංචි කරන්න.' },
      { target: 'farm-card-actions', title: 'ගොවිපළක් කළමනාකරණය කරන්න', body: 'මෙතැනින් සම්පූර්ණ විස්තර බලන්න, සංස්කරණය කරන්න, හෝ මකන්න.' },
    ],
    next: 'ඊළඟට →', back: '← ආපසු', skip: 'මඟ හරින්න', done: 'තේරුණා', helpAria: 'මාර්ගෝපදේශය නැවත ධාවනය කරන්න', needHelp: 'උදව්',
  },
  ta: {
    steps: [
      { target: 'farm-add-btn', title: 'உங்கள் முதல் பண்ணையைச் சேர்க்கவும்', body: 'பயிர்கள், சாகுபடிகள் மற்றும் சந்தை பட்டியல்களைக் கண்காணிக்கத் தொடங்க ஒரு பண்ணையைப் பதிவு செய்யுங்கள்.' },
      { target: 'farm-card-actions', title: 'ஒரு பண்ணையை நிர்வகிக்கவும்', body: 'முழு விவரங்களைப் பார்க்க, திருத்த அல்லது நீக்க இங்கிருந்து செய்யலாம்.' },
    ],
    next: 'அடுத்து →', back: '← பின்', skip: 'தவிர்', done: 'சரி', helpAria: 'வழிகாட்டலை மீண்டும் இயக்கு', needHelp: 'உதவி',
  },
};

export default function MyFarms() {
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;
  const mfTourT = MF_TOUR_T[lang] || MF_TOUR_T.en;

  const [farms,       setFarms]       = useState([]);
  const [cropCounts,  setCropCounts]  = useState({});
  const [isLoading,   setIsLoading]   = useState(true);
  const [searchText,  setSearchText]  = useState('');
  const [toast,       setToast]       = useState({ type: 'success', message: '' });
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [tourOpen, setTourOpen] = useAutoOpenOnce('sa_tour_myfarms_seen_v1', !isLoading);

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
          <Link className="button button--primary" to="/landowner/farms/add" data-tour="farm-add-btn">{t.addFarmBtn}</Link>
        </div>
      </div>

      <div className="farm-toolbar">
        <input
          className="farm-search"
          placeholder={t.searchFarmsPh}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          data-tour="farm-search"
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
          {filteredFarms.map((farm, i) => (
            <article key={farm.id} className="farm-card" data-tour={i === 0 ? 'farm-card' : undefined}>
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

                <div className="farm-card__actions" data-tour={i === 0 ? 'farm-card-actions' : undefined}>
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

      <HelpButton label={mfTourT.needHelp} ariaLabel={mfTourT.helpAria} onClick={() => setTourOpen(true)} />
      <SpotlightTour
        steps={mfTourT.steps}
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        storageKey="sa_tour_myfarms_seen_v1"
        labels={{ next: mfTourT.next, back: mfTourT.back, skip: mfTourT.skip, done: mfTourT.done }}
      />
    </section>
  );
}
