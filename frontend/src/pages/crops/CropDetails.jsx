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
        <div className="crop-form-panel">
          <h1>Crop not found</h1>
          <p>This crop may have been removed or you do not have access.</p>
          <button className="button button--ghost" type="button" onClick={() => navigate('/landowner/crops')}>
            Back to crops
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="crop-detail-page">
      <div className="crop-detail-panel">
        <div className="crop-detail-header">
          <div>
            <p className="section__label">Crop details</p>
            <h1>{crop.crop_name}</h1>
            <p className="section__copy">Review the full crop record and expected harvest timeline.</p>
          </div>
          <div className="crop-detail-actions">
            <Link className="button button--ghost" to="/landowner/crops">
              Back to crops
            </Link>
            <Link className="button button--primary" to={`/landowner/crops/edit/${crop.id}`}>
              Edit crop
            </Link>
          </div>
        </div>

        <div className="crop-detail-grid">
          <article>
            <strong>Farm</strong>
            <p>{crop.farm_name}</p>
          </article>
          <article>
            <strong>Crop type</strong>
            <p>{crop.crop_type}</p>
          </article>
          <article>
            <strong>Category</strong>
            <p>{crop.category}</p>
          </article>
          <article>
            <strong>Growth stage</strong>
            <p>{crop.growth_stage}</p>
          </article>
          <article>
            <strong>Planting date</strong>
            <p>{new Date(crop.planting_date).toLocaleDateString()}</p>
          </article>
          <article>
            <strong>Expected harvest</strong>
            <p>{new Date(crop.expected_harvest_date).toLocaleDateString()}</p>
          </article>
          <article>
            <strong>Status</strong>
            <p>{crop.status}</p>
          </article>
          <article>
            <strong>Created date</strong>
            <p>{new Date(crop.created_at).toLocaleString()}</p>
          </article>
          <article>
            <strong>Updated date</strong>
            <p>{new Date(crop.updated_at).toLocaleString()}</p>
          </article>
        </div>
      </div>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
