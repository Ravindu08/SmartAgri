import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCrop } from '../../services/cropService';
import Toast from '../../components/Toast';

export default function CropDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  useEffect(() => {
    const loadCrop = async () => {
      try {
        const response = await getCrop(id);
        setCrop(response);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadCrop();
  }, [id]);

  if (isLoading) {
    return <div className="crop-loading">Loading crop details...</div>;
  }

  if (!crop) {
    return (
      <section className="crop-form-page">
        <div className="crop-form-header">
          <h1>Crop not found</h1>
          <p>This crop may have been removed or you do not have access.</p>
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/crops')}>
            Back to crops
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="crop-detail-page">
      <Link className="crop-detail-back" to="/landowner/crops">← Back to Crops</Link>

      <div className="crop-detail-card">
        <div className="crop-detail-header">
          <div>
            <p className="section__label">Crop Details</p>
            <h1>{crop.crop_name}</h1>
            <p className="crop-detail-header__meta">{crop.crop_type} · {crop.category}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link className="button button--primary" to={`/landowner/crops/edit/${crop.id}`}>
              ✏️ Edit Crop
            </Link>
          </div>
        </div>

        <div className="crop-detail-body">
          <div className="detail-section">
            <h3>Crop Information</h3>
            <div className="detail-row">
              <span className="detail-row__label">Farm</span>
              <span className="detail-row__value">{crop.farm_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Crop Type</span>
              <span className="detail-row__value">{crop.crop_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Category</span>
              <span className="detail-row__value">{crop.category}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Status</span>
              <span className="detail-row__value">{crop.status}</span>
            </div>
          </div>
          <div className="detail-section">
            <h3>Timeline</h3>
            <div className="detail-row">
              <span className="detail-row__label">Growth Stage</span>
              <span className="detail-row__value">{crop.growth_stage}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Planting Date</span>
              <span className="detail-row__value">{new Date(crop.planting_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Expected Harvest</span>
              <span className="detail-row__value">{new Date(crop.expected_harvest_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Created</span>
              <span className="detail-row__value">{new Date(crop.created_at).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Updated</span>
              <span className="detail-row__value">{new Date(crop.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="crop-detail-footer">
          <Link className="button button--outline" to="/landowner/crops">← All Crops</Link>
          <Link className="button button--primary" to={`/landowner/crops/edit/${crop.id}`}>Edit Crop</Link>
        </div>
      </div>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
