import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createCrop, getCropsByFarm } from '../../services/cropService';
import { getFarm, getFarms } from '../../services/farmService';
import { CROP_EMOJI, getCropLabel, getSoilLabel } from '../../data/cropData';
import { useApp } from '../../context/AppContext';
import { LAND_T, GROWTH_STAGE_LABELS, CROP_STATUS_LABELS, SEA_LABELS, IRR_LABELS } from '../../data/translations';
import Toast from '../../components/Toast';
import CustomSelect from '../../components/CustomSelect';

const GROWTH_STAGES = ['Seed', 'Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'];
const STATUSES = ['Active', 'Completed', 'Failed'];
const SEASONS = ['Maha', 'Yala', 'Year-round'];

export default function AddCrop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const farmIdParam = searchParams.get('farm_id');
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;

  const [farms, setFarms] = useState([]);
  const [contextFarm, setContextFarm] = useState(null);
  const [existingCrops, setExistingCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    farm_id: farmIdParam || '',
    crop_name: '',
    crop_name_other: '',
    crop_type: '',
    category: '',
    growth_stage: GROWTH_STAGES[0],
    planting_date: '',
    expected_harvest_date: '',
    status: STATUSES[0],
    season: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const promises = [getFarms()];
        if (farmIdParam) {
          promises.push(getFarm(farmIdParam));
          promises.push(getCropsByFarm(farmIdParam));
        }
        const [farmsData, farmData, cropsData] = await Promise.all(promises);
        setFarms(farmsData);
        if (farmData) setContextFarm(farmData);
        if (cropsData) setExistingCrops(cropsData);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [farmIdParam]);

  const plannedCrops = contextFarm?.cultivated_crops
    ? contextFarm.cultivated_crops.split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const effectiveCropName =
    formData.crop_name === '__other__' ? formData.crop_name_other : formData.crop_name;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!effectiveCropName.trim()) return t.valCropName;
    if (!formData.crop_type.trim()) return t.valCropType;
    if (!formData.category.trim()) return t.valCropCategory;
    if (!formData.farm_id) return t.valFarmRequired;
    if (!formData.planting_date) return t.valPlantingDate;
    if (!formData.expected_harvest_date) return t.valHarvestDate;
    if (new Date(formData.expected_harvest_date) <= new Date(formData.planting_date))
      return t.valHarvestAfterPlanting;
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = validate();
    if (err) { setValidationError(err); return; }

    setIsSubmitting(true);
    try {
      await createCrop({
        farm_id: formData.farm_id,
        crop_name: effectiveCropName.trim(),
        crop_type: formData.crop_type.trim(),
        category: formData.category.trim(),
        growth_stage: formData.growth_stage,
        planting_date: formData.planting_date,
        expected_harvest_date: formData.expected_harvest_date,
        status: formData.status,
        season: formData.season || null,
      });
      if (farmIdParam) {
        navigate(`/landowner/farms/${farmIdParam}`, { replace: true });
      } else {
        navigate('/landowner/crops', { replace: true });
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="crop-form-page">

      {farmIdParam && (
        <div className="add-crop-context">
          <Link className="add-crop-back" to={`/landowner/farms/${farmIdParam}`}>
            {t.backToFarmLink(contextFarm ? contextFarm.farm_name : 'Farm')}
          </Link>

          {contextFarm && (
            <div className="add-crop-farm-banner">
              {contextFarm.image_data && (
                <img
                  className="add-crop-farm-banner__img"
                  src={contextFarm.image_data}
                  alt={contextFarm.farm_name}
                />
              )}
              <div className="add-crop-farm-banner__info">
                <h2 className="add-crop-farm-banner__name">{contextFarm.farm_name}</h2>
                <div className="add-crop-farm-banner__meta">
                  {contextFarm.district && (
                    <span className="add-crop-farm-badge">📍 {contextFarm.district}</span>
                  )}
                  <span>{contextFarm.farm_size} {contextFarm.size_unit}</span>
                  <span>{getSoilLabel(contextFarm.soil_type, lang)}</span>
                  <span>{SEA_LABELS[lang]?.[contextFarm.season] || contextFarm.season} {t.seasonSuffix}</span>
                  {contextFarm.irrigation_type && <span>{IRR_LABELS[lang]?.[contextFarm.irrigation_type] || contextFarm.irrigation_type}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="add-crop-summary">
            <div className="add-crop-summary__header">
              <h3>{t.currentlyCultivating}</h3>
              <span className="add-crop-summary__count">
                {t.cropCountBadge(existingCrops.length)}
              </span>
            </div>

            {isLoading ? (
              <p className="add-crop-summary__empty">{t.loadingDots}</p>
            ) : existingCrops.length === 0 ? (
              <p className="add-crop-summary__empty">{t.noExistingCrops}</p>
            ) : (
              <div className="add-crop-summary__grid">
                {existingCrops.map(crop => (
                  <Link
                    key={crop.id}
                    className="add-crop-summary-card"
                    to={`/landowner/crops/${crop.id}`}
                  >
                    <span className="add-crop-summary-card__emoji">
                      {CROP_EMOJI[crop.crop_name] || '🌱'}
                    </span>
                    <div className="add-crop-summary-card__body">
                      <strong>{getCropLabel(crop.crop_name, lang)}</strong>
                      <span className="add-crop-summary-card__stage">{GROWTH_STAGE_LABELS[lang]?.[crop.growth_stage] || crop.growth_stage}</span>
                    </div>
                    <span className={`add-crop-summary-card__status status--${(crop.status || '').toLowerCase()}`}>
                      {CROP_STATUS_LABELS[lang]?.[crop.status] || crop.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="crop-form-header">
        <p className="section__label">{t.addCropLabel}</p>
        <h1>{t.recordNewCult}</h1>
        <p>{t.addCropDesc}</p>
      </div>

      <form className="crop-form" onSubmit={handleSubmit}>
        <div className="crop-form__grid">

          <label>
            {t.farmField}
            {farmIdParam && contextFarm ? (
              <input
                className="input--readonly"
                value={`${contextFarm.farm_name}${contextFarm.district ? ` — ${contextFarm.district}` : ''}`}
                readOnly
              />
            ) : (
              <CustomSelect name="farm_id" value={formData.farm_id} onChange={handleChange}>
                <option value="">{t.selectFarmPh}</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.farm_name} — {farm.location}
                  </option>
                ))}
              </CustomSelect>
            )}
          </label>

          <label>
            {t.cropNameField}
            {plannedCrops.length > 0 ? (
              <CustomSelect name="crop_name" value={formData.crop_name} onChange={handleChange}>
                <option value="">{t.selectCropPh}</option>
                {plannedCrops.map(c => (
                  <option key={c} value={c}>{CROP_EMOJI[c] || '🌱'} {getCropLabel(c, lang)}</option>
                ))}
                <option value="__other__">{t.otherCropOpt}</option>
              </CustomSelect>
            ) : (
              <input
                name="crop_name"
                value={formData.crop_name}
                onChange={handleChange}
                required
                placeholder="e.g. Chilli"
              />
            )}
          </label>

          {formData.crop_name === '__other__' && (
            <label>
              {t.cropNameSpecify}
              <input
                name="crop_name_other"
                value={formData.crop_name_other}
                onChange={handleChange}
                required
                placeholder={t.cropNamePh}
              />
            </label>
          )}

          <label>
            {t.cropTypeField}
            <input
              name="crop_type"
              value={formData.crop_type}
              onChange={handleChange}
              required
              placeholder={t.cropTypePh}
            />
          </label>
          <label>
            {t.cropCategoryField}
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder={t.cropCategoryPh}
            />
          </label>
          <label>
            {t.growthStageField}
            <CustomSelect name="growth_stage" value={formData.growth_stage} onChange={handleChange}>
              {GROWTH_STAGES.map((stage) => (
                <option key={stage} value={stage}>{GROWTH_STAGE_LABELS[lang]?.[stage] || stage}</option>
              ))}
            </CustomSelect>
          </label>
          <label>
            {t.plantingDateField}
            <input
              name="planting_date"
              type="date"
              value={formData.planting_date}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t.harvestDateField}
            <input
              name="expected_harvest_date"
              type="date"
              value={formData.expected_harvest_date}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t.statusField}
            <CustomSelect name="status" value={formData.status} onChange={handleChange}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{CROP_STATUS_LABELS[lang]?.[status] || status}</option>
              ))}
            </CustomSelect>
          </label>
          <label>
            {t.seasonField || 'Season'}
            <CustomSelect name="season" value={formData.season} onChange={handleChange}>
              <option value="">{t.selectSeasonPh || 'Select season…'}</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{SEA_LABELS[lang]?.[s] || s}</option>
              ))}
            </CustomSelect>
          </label>
        </div>

        {validationError && <div className="form-error">{validationError}</div>}
        {isLoading && <div className="form-loading">{t.loadingDots}</div>}

        <div className="crop-form__actions">
          <button
            className="button button--outline"
            type="button"
            onClick={() =>
              farmIdParam
                ? navigate(`/landowner/farms/${farmIdParam}`)
                : navigate('/landowner/crops')
            }
          >
            {t.cancelBtn}
          </button>
          <button
            className="button button--primary"
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? t.savingCropDots : t.saveCropBtn}
          </button>
        </div>
      </form>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
