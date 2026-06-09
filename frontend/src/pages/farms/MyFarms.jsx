import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteFarm, getFarms } from '../../services/farmService';
import Toast from '../../components/Toast';

export default function MyFarms() {
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const response = await getFarms();
      setFarms(response);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const filteredFarms = useMemo(
    () =>
      farms.filter((farm) => {
        const query = searchText.trim().toLowerCase();
        if (!query) {
          return true;
        }
        return [farm.farm_name, farm.location, farm.soil_type, farm.season, String(farm.owner_id)]
          .join(' ')
          .toLowerCase()
          .includes(query);
      }),
    [farms, searchText],
  );

  const handleDelete = (farm) => {
    setDeleteTarget(farm);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteFarm(deleteTarget.id);
      setFarms((current) => current.filter((farm) => farm.id !== deleteTarget.id));
      setToast({ type: 'success', message: 'Farm deleted successfully' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="farm-page">
      <div className="farm-page__header">
        <div>
          <p className="section__label">Farm Management</p>
          <h1>My Farms</h1>
          <p className="section__copy">Review your land inventory, update farm records, and manage field details.</p>
        </div>

        <div className="farm-actions">
          <Link className="button button--primary" to="/landowner/farms/add">
            Add Farm
          </Link>
        </div>
      </div>

      <div className="farm-toolbar">
        <input
          className="farm-search"
          placeholder="Search farms by name, location, soil type, season or owner"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="farm-loading">Loading farms...</div>
      ) : filteredFarms.length === 0 ? (
        <div className="farm-empty">
          <p>No farms were found.</p>
          <Link className="button button--primary" to="/landowner/farms/add">
            Add your first farm
          </Link>
        </div>
      ) : (
        <div className="farm-grid">
          {filteredFarms.map((farm) => (
            <article key={farm.id} className="farm-card">
              <div className="farm-card__image">
                <div className="farm-card__image-placeholder">🌾</div>
                <span className="farm-card__season-badge">{farm.season}</span>
              </div>
              <div className="farm-card__body">
                <div className="farm-card__heading">
                  <p className="farm-card__name">{farm.farm_name}</p>
                  <p className="farm-card__meta">📍 {farm.location}</p>
                </div>
                <div className="farm-card__details">
                  <div><span>Size</span><strong>{farm.farm_size} acres</strong></div>
                  <div><span>Soil</span><strong>{farm.soil_type}</strong></div>
                  <div><span>Owner ID</span><strong>{farm.owner_id}</strong></div>
                </div>
                <div className="farm-card__actions">
                  <Link className="button button--outline" to={`/landowner/farms/${farm.id}`}>View</Link>
                  <Link className="button button--outline" to={`/landowner/farms/edit/${farm.id}`}>✏️ Edit</Link>
                  <button className="button button--danger" type="button" onClick={() => handleDelete(farm)}>Delete</button>
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
              Are you sure you want to delete <strong>{deleteTarget.farm_name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="button button--danger" type="button" onClick={confirmDelete}>
                Delete farm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: '', message: '' })} />
    </section>
  );
}
