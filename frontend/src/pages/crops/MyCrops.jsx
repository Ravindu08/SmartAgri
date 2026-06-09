import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteCrop, getCrops } from '../../services/cropService';
import Toast from '../../components/Toast';

export default function MyCrops() {
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCrops = async () => {
    setIsLoading(true);
    try {
      const response = await getCrops();
      setCrops(response);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const filteredCrops = useMemo(
    () =>
      crops.filter((crop) => {
        const query = searchText.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return [
          crop.crop_name,
          crop.crop_type,
          crop.category,
          crop.growth_stage,
          crop.status,
          crop.farm_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      }),
    [crops, searchText],
  );

  const handleDelete = (crop) => {
    setDeleteTarget(crop);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteCrop(deleteTarget.id);
      setCrops((current) => current.filter((crop) => crop.id !== deleteTarget.id));
      setToast({ type: 'success', message: 'Crop deleted successfully' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="crop-page">
      <div className="crop-page__header">
        <div>
          <p className="section__label">Crop Management</p>
          <h1>My Crops</h1>
          <p className="section__copy">Track crop progress, update growth stages, and manage harvest plans.</p>
        </div>

        <div className="crop-actions">
          <Link className="button button--primary" to="/landowner/crops/add">
            Add Crop
          </Link>
        </div>
      </div>

      <div className="crop-toolbar">
        <input
          className="crop-search"
          placeholder="Search crops by name, type, farm, stage, or status"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="crop-loading">Loading crops...</div>
      ) : filteredCrops.length === 0 ? (
        <div className="crop-empty">
          <p>No crops were found.</p>
          <Link className="button button--primary" to="/landowner/crops/add">
            Add your first crop
          </Link>
        </div>
      ) : (
        <div className="crop-grid">
          {filteredCrops.map((crop) => (
            <article key={crop.id} className="crop-card">
              <div className="crop-card__image">
                <div className="crop-card__image-placeholder">🌱</div>
                <span className={`crop-card__status-badge crop-card__status-badge--${(crop.status || '').toLowerCase().replace(/\s/g,'-')}`}>{crop.status}</span>
              </div>
              <div className="crop-card__body">
                <div className="crop-card__heading">
                  <p className="crop-card__name">{crop.crop_name}</p>
                  <p className="crop-card__meta">{crop.crop_type}</p>
                </div>
                <div className="crop-card__details">
                  <div><span>Farm</span><strong>{crop.farm_name}</strong></div>
                  <div><span>Stage</span><strong>{crop.growth_stage}</strong></div>
                  <div><span>Harvest</span><strong>{new Date(crop.expected_harvest_date).toLocaleDateString()}</strong></div>
                </div>
                <div className="crop-card__actions">
                  <Link className="button button--outline" to={`/landowner/crops/${crop.id}`}>View</Link>
                  <Link className="button button--outline" to={`/landowner/crops/edit/${crop.id}`}>✏️ Edit</Link>
                  <button className="button button--danger" type="button" onClick={() => handleDelete(crop)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget ? (
        <div className="modal-overlay">
          <div className="modal-panel">
            <h2>Confirm delete</h2>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.crop_name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="button button--danger" type="button" onClick={confirmDelete}>
                Delete crop
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
