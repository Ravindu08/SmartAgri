import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createCrop } from '../../services/cropService';
import { getFarms } from '../../services/farmService';
import Toast from '../../components/Toast';

const GROWTH_STAGES = ['Seed', 'Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest'];
const STATUSES = ['Active', 'Completed', 'Failed'];

export default function AddCrop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [farms, setFarms] = useState([]);
  const [formData, setFormData] = useState({
    farm_id: searchParams.get('farm_id') || '',
    crop_name: '',
    crop_type: '',
    category: '',
    growth_stage: GROWTH_STAGES[0],
    planting_date: '',
    expected_harvest_date: '',
    status: STATUSES[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const response = await getFarms();
        setFarms(response);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadFarms();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!formData.crop_name.trim()) return 'Crop name is required.';
    if (!formData.crop_type.trim()) return 'Crop type is required.';
    if (!formData.category.trim()) return 'Crop category is required.';
    if (!formData.farm_id) return 'Farm selection is required.';
    if (!formData.planting_date) return 'Planting date is required.';
    if (!formData.expected_harvest_date) return 'Expected harvest date is required.';
    if (new Date(formData.expected_harvest_date) <= new Date(formData.planting_date)) {
      return 'Expected harvest date must be after planting date.';
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
      await createCrop({
        farm_id: formData.farm_id,
        crop_name: formData.crop_name.trim(),
        crop_type: formData.crop_type.trim(),
        category: formData.category.trim(),
        growth_stage: formData.growth_stage,
        planting_date: formData.planting_date,
        expected_harvest_date: formData.expected_harvest_date,
        status: formData.status,
      });
      navigate('/landowner/crops', { replace: true });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="crop-form-page">
      <div className="crop-form-panel">
        <div>
          <p className="section__label">Add Crop</p>
          <h1>Create a new crop record</h1>
          <p className="section__copy">Capture planting details, growth stage, and harvest expectations for this farm.</p>
        </div>

        <form className="crop-form" onSubmit={handleSubmit}>
          <label>
            Farm
            <select name="farm_id" value={formData.farm_id} onChange={handleChange} required>
              <option value="">Select a farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name} — {farm.location}
                </option>
              ))}
            </select>
          </label>
          <label>
            Crop Name
            <input name="crop_name" value={formData.crop_name} onChange={handleChange} required />
          </label>
          <label>
            Crop Type
            <input name="crop_type" value={formData.crop_type} onChange={handleChange} required />
          </label>
          <label>
            Crop Category
            <input name="category" value={formData.category} onChange={handleChange} required />
          </label>
          <label>
            Growth Stage
            <select name="growth_stage" value={formData.growth_stage} onChange={handleChange}>
              {GROWTH_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <label>
            Planting Date
            <input name="planting_date" type="date" value={formData.planting_date} onChange={handleChange} required />
          </label>
          <label>
            Expected Harvest Date
            <input
              name="expected_harvest_date"
              type="date"
              value={formData.expected_harvest_date}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Status
            <select name="status" value={formData.status} onChange={handleChange}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          {validationError ? <div className="form-error">{validationError}</div> : null}
          {isLoading ? <div className="form-loading">Loading farms...</div> : null}

          <div className="crop-form__actions">
            <button className="button button--ghost" type="button" onClick={() => navigate('/landowner/crops')}>
              Cancel
            </button>
            <button className="button button--primary" type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving crop...' : 'Save crop'}
            </button>
          </div>
        </form>
      </div>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
