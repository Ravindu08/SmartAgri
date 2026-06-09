import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFarm, updateFarm } from '../../services/farmService';
import Toast from '../../components/Toast';

const SEASONS = ['Yala', 'Maha'];

export default function EditFarm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    farm_name: '',
    location: '',
    farm_size: '',
    soil_type: '',
    season: SEASONS[0],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const response = await getFarm(id);
        setFormData({
          farm_name: response.farm_name,
          location: response.location,
          farm_size: response.farm_size,
          soil_type: response.soil_type,
          season: response.season,
        });
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadFarm();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!formData.farm_name.trim()) {
      return 'Farm name is required.';
    }
    if (!formData.location.trim()) {
      return 'Location is required.';
    }
    const size = Number(formData.farm_size);
    if (!size || size <= 0) {
      return 'Farm size must be greater than 0.';
    }
    if (!formData.soil_type.trim()) {
      return 'Soil type is required.';
    }
    if (!SEASONS.includes(formData.season)) {
      return 'Season must be Yala or Maha.';
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
      await updateFarm(id, {
        farm_name: formData.farm_name.trim(),
        location: formData.location.trim(),
        farm_size: Number(formData.farm_size),
        soil_type: formData.soil_type.trim(),
        season: formData.season,
      });
      navigate('/landowner/farms', { replace: true });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="farm-loading">Loading farm details...</div>;
  }

  return (
    <section className="farm-form-page">
      <div className="farm-form-header">
        <p className="section__label">Edit Farm</p>
        <h1>Update farm details</h1>
        <p>Edit fields and save changes for this farm.</p>
      </div>

      <form className="farm-form" onSubmit={handleSubmit}>
        <div className="farm-form__grid">
          <label>
            Farm Name
            <input name="farm_name" value={formData.farm_name} onChange={handleChange} required />
          </label>
          <label>
            Location
            <input name="location" value={formData.location} onChange={handleChange} required />
          </label>
          <label>
            Farm Size (acres)
            <input
              name="farm_size"
              type="number"
              min="0"
              step="0.1"
              value={formData.farm_size}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Soil Type
            <input name="soil_type" value={formData.soil_type} onChange={handleChange} required />
          </label>
          <label>
            Season
            <select name="season" value={formData.season} onChange={handleChange}>
              {SEASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {validationError ? <div className="form-error">{validationError}</div> : null}

        <div className="farm-form__actions">
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/farms')}>
            Cancel
          </button>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving farm...' : 'Save changes'}
          </button>
        </div>
      </form>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
