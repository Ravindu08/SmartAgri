import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFarm } from '../../services/farmService';
import { getCropsByFarm } from '../../services/cropService';
import Toast from '../../components/Toast';

export default function FarmDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const [farmResponse, cropsResponse] = await Promise.all([getFarm(id), getCropsByFarm(id)]);
        setFarm(farmResponse);
        setCrops(cropsResponse);
      } catch (error) {
        setToast({ type: 'error', message: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadFarm();
  }, [id]);

  if (isLoading) {
    return <div className="farm-loading">Loading farm details...</div>;
  }

  if (!farm) {
    return (
      <section className="farm-form-page">
        <div className="farm-form-panel">
          <h1>Farm not found</h1>
          <p>The farm may have been removed or you do not have access.</p>
          <button className="button button--ghost" type="button" onClick={() => navigate('/landowner/farms')}>
            Back to farms
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="farm-detail-page">
      <div className="farm-detail-panel">
        <div className="farm-detail-header">
          <div>
            <p className="section__label">Farm details</p>
            <h1>{farm.farm_name}</h1>
            <p className="section__copy">Full record for this farm, including created and updated metadata.</p>
          </div>
          <div className="farm-detail-actions">
            <Link className="button button--ghost" to="/landowner/farms">
              Back to farms
            </Link>
            <Link className="button button--ghost" to={`/landowner/crops/add?farm_id=${farm.id}`}>
              Add crop for this farm
            </Link>
            <Link className="button button--primary" to={`/landowner/farms/edit/${farm.id}`}>
              Edit farm
            </Link>
          </div>
        </div>

        <div className="farm-detail-grid">
          <article>
            <strong>Location</strong>
            <p>{farm.location}</p>
          </article>
          <article>
            <strong>Farm size</strong>
            <p>{farm.farm_size} acres</p>
          </article>
          <article>
            <strong>Soil type</strong>
            <p>{farm.soil_type}</p>
          </article>
          <article>
            <strong>Season</strong>
            <p>{farm.season}</p>
          </article>
          <article>
            <strong>Owner ID</strong>
            <p>{farm.owner_id}</p>
          </article>
          <article>
            <strong>Created date</strong>
            <p>{new Date(farm.created_at).toLocaleString()}</p>
          </article>
          <article>
            <strong>Updated date</strong>
            <p>{new Date(farm.updated_at).toLocaleString()}</p>
          </article>
        </div>
      </div>

      <div className="farm-crops-panel">
        <div className="farm-detail-section-header">
          <h2>Crop records</h2>
          <p>Review crops planted on this farm and navigate to crop details.</p>
        </div>
        {crops.length === 0 ? (
          <div className="farm-crops-empty">
            <p>No crops are currently associated with this farm.</p>
            <Link className="button button--primary" to={`/landowner/crops/add?farm_id=${farm.id}`}>
              Add first crop
            </Link>
          </div>
        ) : (
          <div className="farm-crops-list">
            {crops.map((crop) => (
              <article key={crop.id} className="farm-crop-card">
                <div>
                  <p className="farm-crop-name">{crop.crop_name}</p>
                  <p className="farm-crop-meta">{crop.crop_type} / {crop.category}</p>
                </div>
                <div className="farm-crop-actions">
                  <Link className="button button--ghost" to={`/landowner/crops/${crop.id}`}>
                    View crop
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
