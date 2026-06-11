import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFarm, updateFarm } from '../../services/farmService';
import { DISTRICTS, IRRIGATION_TYPES, SEASONS, SIZE_UNITS, SOIL_TYPES } from '../../data/farmOptions';
import { useApp } from '../../context/AppContext';
import { LAND_T } from '../../data/translations';
import CropPicker from '../../components/CropPicker';
import Toast from '../../components/Toast';

export default function EditFarm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { lang } = useApp();
  const t = LAND_T[lang] || LAND_T.en;

  const [formData, setFormData] = useState({
    farm_name: '',
    district: '',
    location: '',
    farm_size: '',
    size_unit: 'acres',
    soil_type: '',
    irrigation_type: '',
    season: SEASONS[0],
    image_data: '',
  });
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const r = await getFarm(id);
        setFormData({
          farm_name: r.farm_name,
          district: r.district || '',
          location: r.location,
          farm_size: r.farm_size,
          size_unit: r.size_unit || 'acres',
          soil_type: r.soil_type,
          irrigation_type: r.irrigation_type || '',
          season: r.season,
          image_data: r.image_data || '',
        });
        if (r.cultivated_crops) {
          setSelectedCrops(r.cultivated_crops.split(',').map(c => c.trim()).filter(Boolean));
        }
        if (r.image_data) setImagePreview(r.image_data);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    loadFarm();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setValidationError(t.imgTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setFormData((prev) => ({ ...prev, image_data: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_data: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    if (!formData.farm_name.trim()) return t.valFarmName;
    if (!formData.district) return t.valDistrict;
    if (!formData.location.trim()) return t.valLocation;
    const size = Number(formData.farm_size);
    if (!size || size <= 0) return t.valFarmSize;
    if (!formData.soil_type) return t.valSoilType;
    if (!SEASONS.includes(formData.season)) return t.valSeason;
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    const err = validate();
    if (err) { setValidationError(err); return; }

    setIsSubmitting(true);
    try {
      await updateFarm(id, {
        farm_name: formData.farm_name.trim(),
        district: formData.district || null,
        location: formData.location.trim(),
        farm_size: Number(formData.farm_size),
        size_unit: formData.size_unit,
        soil_type: formData.soil_type,
        irrigation_type: formData.irrigation_type || null,
        cultivated_crops: selectedCrops.length ? selectedCrops.join(',') : null,
        season: formData.season,
        image_data: formData.image_data || null,
      });
      navigate('/landowner/farms', { replace: true });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="farm-loading">{t.loadingFarmDetails}</div>;

  return (
    <section className="farm-form-page">
      <div className="farm-form-header">
        <p className="section__label">{t.editFarmLabel}</p>
        <h1>{t.updateFarmDetails}</h1>
        <p>{t.editFarmDesc}</p>
      </div>

      <form className="farm-form" onSubmit={handleSubmit}>

        <div className="farm-form__image-upload">
          {imagePreview ? (
            <div className="farm-form__image-preview">
              <img src={imagePreview} alt="Farm preview" />
              <button type="button" className="farm-form__image-remove" onClick={removeImage}>{t.removeImg}</button>
            </div>
          ) : (
            <label className="farm-form__image-drop" htmlFor="farm-image-input">
              <span className="farm-form__image-icon">🖼️</span>
              <span>{t.uploadPhoto}</span>
              <span className="farm-form__image-hint">{t.uploadHint}</span>
            </label>
          )}
          <input
            id="farm-image-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>

        <div className="farm-form__grid">
          <label>
            {t.farmNameField} <span className="req">*</span>
            <input name="farm_name" value={formData.farm_name} onChange={handleChange} required />
          </label>

          <label>
            {t.districtField} <span className="req">*</span>
            <select name="district" value={formData.district} onChange={handleChange} required>
              <option value="">{t.selectDistrictPh}</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <label>
            {t.locationField} <span className="req">*</span>
            <input name="location" value={formData.location} onChange={handleChange} placeholder={t.locationPh} required />
          </label>

          <label className="farm-form__size-row">
            {t.farmSizeField} <span className="req">*</span>
            <div className="farm-form__size-inputs">
              <input
                name="farm_size"
                type="number"
                min="0"
                step="0.01"
                value={formData.farm_size}
                onChange={handleChange}
                required
              />
              <select name="size_unit" value={formData.size_unit} onChange={handleChange}>
                {SIZE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </label>

          <label>
            {t.soilTypeField} <span className="req">*</span>
            <select name="soil_type" value={formData.soil_type} onChange={handleChange} required>
              <option value="">{t.selectSoilPh}</option>
              {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label>
            {t.irrigTypeField}
            <select name="irrigation_type" value={formData.irrigation_type} onChange={handleChange}>
              <option value="">{t.selectIrrigPh}</option>
              {IRRIGATION_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>

          <label>
            {t.seasonField} <span className="req">*</span>
            <select name="season" value={formData.season} onChange={handleChange}>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="farm-form__section">
          <label className="farm-form__section-label">{t.cultivatedCropsField}</label>
          <p className="farm-form__section-hint">{t.cropsHintEdit}</p>
          <CropPicker selected={selectedCrops} onChange={setSelectedCrops} />
        </div>

        {validationError && <div className="form-error">{validationError}</div>}

        <div className="farm-form__actions">
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/farms')}>
            {t.cancelBtn}
          </button>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.savingDots : t.saveChangesBtn}
          </button>
        </div>
      </form>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
