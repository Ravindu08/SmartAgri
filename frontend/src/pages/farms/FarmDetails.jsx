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
        <div className="farm-form-header">
          <h1>Farm not found</h1>
          <p>The farm may have been removed or you do not have access.</p>
          <button className="button button--outline" type="button" onClick={() => navigate('/landowner/farms')}>
            Back to farms
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="farm-detail-page">
      <Link className="farm-detail-back" to="/landowner/farms">← Back to Farms</Link>

      <div className="farm-detail-card">
        <div className="farm-detail-header">
          <div>
            <p className="section__label">Farm Details</p>
            <h1>{farm.farm_name}</h1>
            <p className="farm-detail-header__meta">📍 {farm.location}</p>
          </div>
          <div className="farm-detail-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link className="button button--outline" to={`/landowner/crops/add?farm_id=${farm.id}`}>
              Add Crop
            </Link>
            <Link className="button button--primary" to={`/landowner/farms/edit/${farm.id}`}>
              ✏️ Edit Farm
            </Link>
          </div>
        </div>

        <div className="farm-detail-body">
          <div className="detail-section">
            <h3>Farm Information</h3>
            <div className="detail-row">
              <span className="detail-row__label">Location</span>
              <span className="detail-row__value">{farm.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Farm Size</span>
              <span className="detail-row__value">{farm.farm_size} acres</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Soil Type</span>
              <span className="detail-row__value">{farm.soil_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Season</span>
              <span className="detail-row__value">{farm.season}</span>
            </div>
          </div>
          <div className="detail-section">
            <h3>Record Info</h3>
            <div className="detail-row">
              <span className="detail-row__label">Owner ID</span>
              <span className="detail-row__value">{farm.owner_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Created</span>
              <span className="detail-row__value">{new Date(farm.created_at).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row__label">Updated</span>
              <span className="detail-row__value">{new Date(farm.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="farm-detail-footer">
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>Crops on this farm: {crops.length}</p>
          {crops.length > 0 && crops.map((crop) => (
            <Link key={crop.id} className="button button--outline" to={`/landowner/crops/${crop.id}`} style={{ fontSize: '12px', minHeight: '32px', padding: '4px 12px' }}>
              {crop.crop_name}
            </Link>
          ))}
          {crops.length === 0 && (
            <Link className="button button--primary" to={`/landowner/crops/add?farm_id=${farm.id}`}>
              Add First Crop
            </Link>
          )}
        </div>
      </div>

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
