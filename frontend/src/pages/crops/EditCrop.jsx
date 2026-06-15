import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCrop, updateCrop } from '../../services/cropService';
import { getFarms } from '../../services/farmService';
import { useApp } from '../../context/AppContext';
import { LAND_T, GROWTH_STAGE_LABELS, CROP_STATUS_LABELS, SEA_LABELS } from '../../data/translations';
import Toast from '../../components/Toast';

const GROWTH_STAGES = ['Seed', 'Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'];
const STATUSES = ['Active', 'Completed', 'Failed'];
const SEASONS = ['Maha', 'Yala', 'Year-round'];

export default function EditCrop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;

  const [farms, setFarms] = useState([]);
  const [formData, setFormData] = useState({
    farm_id: '',
    crop_name: '',
    crop_type: '',
    category: '',
    growth_stage: GROWTH_STAGES[0],
    planting_date: '',
    expected_harvest_date: '',
    status: STATUSES[0],
    season: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const loadCropAndFarms = async () => {
      try {
        const [cropResponse, farmsResponse] = await Promise.all([getCrop(id), getFarms()]);
        setFormData({
          farm_id: cropResponse.farm_id,
          crop_name: cropResponse.crop_name,
          crop_type: cropResponse.crop_type,
          category: cropResponse.category,
          growth_stage: cropResponse.growth_stage,
          planting_date: cropResponse.planting_date,
          expected_harvest_date: cropResponse.expected_harvest_date,
          status: cropResponse.status,
          season: cropResponse.season || '',
        });
        setFarms(farmsResponse);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadCropAndFarms();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!formData.crop_name.trim()) return t.valCropName;
    if (!formData.crop_type.trim()) return t.valCropType;
    if (!formData.category.trim()) return t.valCropCategory;
    if (!formData.farm_id) return t.valFarmRequired;
    if (!formData.planting_date) return t.valPlantingDate;
    if (!formData.expected_harvest_date) return t.valHarvestDate;
    if (new Date(formData.expected_harvest_date) <= new Date(formData.planting_date)) {
      return t.valHarvestAfterPlanting;
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError('');

    const errorMessage = validate();
    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCrop(id, {
        farm_id: formData.farm_id,
        crop_name: formData.crop_name.trim(),
        crop_type: formData.crop_type.trim(),
        category: formData.category.trim(),
        growth_stage: formData.growth_stage,
        planting_date: formData.planting_date,
        expected_harvest_date: formData.expected_harvest_date,
        status: formData.status,
        season: formData.season || null,
      });
      navigate('/landowner/crops', { replace: true });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="crop-loading">{t.loadingCropDetails}</div>;
  }

  return (
    <section className="crop-form-page">
      <div className="crop-form-header">
        <p className="section__label">{t.editCropLabel}</p>
        <h1>{t.updateCropDetails}</h1>
        <p>{t.editCropDesc}</p>
      </div>

      <form className="crop-form" onSubmit={handleSubmit}>
        <div className="crop-form__grid">
          <label>
            {t.farmField}
            <select name="farm_id" value={formData.farm_id} onChange={handleChange} required>
              <option value="">{t.selectFarmPh}</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name} — {farm.location}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.cropNameField}
            <input name="crop_name" value={formData.crop_name} onChange={handleChange} required />
          </label>
          <label>
            {t.cropTypeField}
            <input name="crop_type" value={formData.crop_type} onChange={handleChange} required />
          </label>
          <label>
            {t.cropCategoryField}
            <input name="category" value={formData.category} onChange={handleChange} required />
          </label>
          <label>
            {t.growthStageField}
            <select name="growth_stage" value={formData.growth_stage} onChange={handleChange}>
              {GROWTH_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {GROWTH_STAGE_LABELS[lang]?.[stage] || stage}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.plantingDateField}
            <input name="planting_date" type="date" value={formData.planting_date} onChange={handleChange} required />
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
            <select name="status" value={formData.status} onChange={handleChange}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CROP_STATUS_LABELS[lang]?.[status] || status}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.seasonField || 'Season'}
            <select name="season" value={formData.season} onChange={handleChange}>
              <option value="">{t.selectSeasonPh || 'Select season…'}</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{SEA_LABELS[lang]?.[s] || s}</option>
              ))}
            </select>
          </label>
        </div>

        {validationError ? <div className="form-error">{validationError}</div> : null}

        <div className="crop-form__actions">
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/crops')}>
            {t.cancelBtn}
          </button>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.savingCropDots2 : t.saveChangesCropBtn}
          </button>
        </div>
      </form>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
