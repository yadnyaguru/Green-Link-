import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getListings, getNearbyListings, getMyListings,
  createListing, updateListing, deleteListing,
} from '../services/index';
import { getPlants } from '../services/plantService';
import { createRequest } from '../services/index';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import PurchaseRequestModal from '../components/PurchaseRequestModal';
import PlantImageModal from '../components/PlantImageModal';
import { generateListingPitch } from '../services/aiService';

export default function Listings() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab]           = useState('all');
  const [listings, setListings] = useState([]);
  const [plants, setPlants]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ plant: '', price: '', quantity: 1, address: '', description: '', lat: '18.5204', lng: '73.8567' });
  const [formLoading, setFormLoading] = useState(false);
  const [aiPitchLoading, setAiPitchLoading] = useState(false);
  const [aiPitchMsg, setAiPitchMsg] = useState('');

  useEffect(() => {
    // Attempt auto-geolocation on mount so coordinates are ready
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setForm((f) => ({
            ...f,
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6)
          }));
        },
        () => {} // silently keep default coordinates
      );
    }
  }, []);

  useEffect(() => {
    const plantParam = searchParams.get('plant');
    if (plantParam) {
      setShowForm(true);
      setForm((f) => ({ ...f, plant: plantParam }));
    }
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'mine') {
        const { data } = await getMyListings();
        setListings(data);
        setLoading(false);
      } else if (tab === 'nearby') {
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
          try {
            const { data } = await getNearbyListings(coords.latitude, coords.longitude);
            setListings(data);
          } catch {
            setError('Failed to load nearby listings');
          } finally {
            setLoading(false);
          }
        }, () => { setError('Location denied'); setLoading(false); });
      } else {
        const { data } = await getListings();
        setListings(data);
        setLoading(false);
      }
    } catch {
      setError('Failed to load listings');
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Load plants catalog unconditionally so dropdown is never empty
  useEffect(() => {
    getPlants().then(({ data }) => setPlants(data)).catch(() => {});
  }, []);

  const handleAiGeneratePitch = async () => {
    const selectedPlant = plants.find((p) => p._id === form.plant);
    const plantName = selectedPlant ? selectedPlant.name : '';
    if (!plantName) {
      setAiPitchMsg('⚠️ Please select a plant first');
      return;
    }
    setAiPitchLoading(true);
    setAiPitchMsg('');
    try {
      const pitch = await generateListingPitch({
        plantName,
        price: form.price,
        quantity: form.quantity,
        address: form.address
      });
      setForm((f) => ({ ...f, description: pitch }));
      setAiPitchMsg('✨ AI description generated!');
      setTimeout(() => setAiPitchMsg(''), 3500);
    } catch {
      setAiPitchMsg('Could not generate description right now.');
    } finally {
      setAiPitchLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const latVal = parseFloat(form.lat) || 18.5204;
      const lngVal = parseFloat(form.lng) || 73.8567;
      await createListing({
        ...form,
        quantity: parseInt(form.quantity, 10) || 1,
        price: parseFloat(form.price) || 0,
        lat: latVal,
        lng: lngVal
      });

      // Automatically update current user to provider if needed
      if (user && !user.isProvider && updateUser) {
        updateUser({ ...user, isProvider: true });
      }

      setShowForm(false);
      setForm({ plant: '', price: '', quantity: 1, address: '', description: '', lat: '18.5204', lng: '73.8567' });
      setSuccess('Listing created successfully! Your plant is now live for buyers.');
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUseLocation = () => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setForm((f) => ({ ...f, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) }));
    }, () => setError('Location access denied'));
  };

  const handlePurchaseSubmit = async ({ listingId, quantity, message }) => {
    setRequestLoading(true);
    try {
      await createRequest({ listingId, quantity, message });
      setRequestTarget(null);
      setSuccess(`Purchase request for ${quantity} plant(s) sent! Track it in Requests.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteListing(deleteTarget._id);
      setDeleteTarget(null);
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleRestock = async (id) => {
    try {
      await updateListing(id, { quantity: 5, availability: true });
      setSuccess('Listing restocked with 5 plants and live on marketplace!');
      fetchListings();
    } catch {
      setError('Failed to restock listing');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h2>🏪 Plant Listings</h2>
            <p className="page-subtitle">Browse available plants from local nurseries and providers</p>
          </div>
          {user && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : '+ Create Listing'}
            </button>
          )}
        </div>

        {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error} ✕</div>}
        {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success} ✓</div>}

        {/* Create Listing Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-seed-header" />
            <div className="card-body">
              <h3 style={{ marginBottom: 20 }}>New Listing</h3>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Plant *</label>
                  <select className="form-select" value={form.plant} onChange={(e) => setForm({ ...form, plant: e.target.value })} required>
                    <option value="">Select a plant</option>
                    {plants.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Price per plant (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                      placeholder="e.g. 299"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available Stock (Quantity) *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                      placeholder="e.g. 10 or 50"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Manual Nursery / Pickup Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                    placeholder="e.g. Green Paradise Nursery, Baner Road, Pune, Maharashtra"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Description & Quality Details</label>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleAiGeneratePitch}
                      disabled={aiPitchLoading}
                      style={{ fontSize: '.78rem', padding: '3px 10px', borderRadius: '16px', color: 'var(--pine)', borderColor: 'var(--pine)' }}
                    >
                      {aiPitchLoading ? '✨ Generating…' : '✨ AI Generate Description'}
                    </button>
                  </div>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Details about plant age, nursery pot size, health condition..."
                  />
                  {aiPitchMsg && (
                    <div style={{ fontSize: '.78rem', marginTop: 4, color: aiPitchMsg.startsWith('✨') ? 'var(--pine)' : '#b91c1c', fontWeight: 500 }}>
                      {aiPitchMsg}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">GPS Latitude *</label>
                    <input type="number" step="any" className="form-input" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required placeholder="18.5204" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GPS Longitude *</label>
                    <input type="number" step="any" className="form-input" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required placeholder="73.8567" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={handleUseLocation}>📍 Auto-Fill GPS Location</button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Creating…' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {['all', 'nearby', user && 'mine'].filter(Boolean).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'all' ? '🌍 All Listings' : t === 'nearby' ? '📍 Near Me' : '📋 My Listings'}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-lite)' }}>
            Loading listings…
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No listings found</h3>
            <p>
              {tab === 'mine'
                ? "You haven't listed any plants yet. Click '+ Create Listing' above to start selling!"
                : tab === 'nearby'
                ? 'No providers found within 50 km of your location.'
                : 'No plants currently listed for sale.'}
            </p>
          </div>
        ) : (
          <div className="plant-grid">
            {listings.map((l) => (
              <div className="card" key={l._id}>
                <div className="card-seed-header" />
                <div
                  className="card-img-container"
                  onClick={() => l.plant?.image && setSelectedImage({ url: l.plant.image, title: l.plant.name, subtitle: `Listed by ${l.provider?.name || 'Provider'}` })}
                  title={l.plant?.image ? "Click to view full-resolution photo" : ""}
                >
                  {l.plant?.image ? (
                    <>
                      <img
                        src={l.plant.image}
                        alt={l.plant.name}
                        className="card-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="card-img-placeholder" style={{ display: 'none' }}>🌿</div>
                      <span className="card-img-zoom-badge">🔍 Full Photo</span>
                    </>
                  ) : (
                    <div className="card-img-placeholder">🌿</div>
                  )}
                </div>
                <div className="card-body">
                  <div className="card-title">{l.plant?.name || 'Unknown Plant'}</div>
                  <div className="card-meta">
                    {l.provider?.name}
                    {l.provider?.profileImage && (
                      <img src={l.provider.profileImage} alt="" style={{ width: 20, height: 20, borderRadius: '50%', marginLeft: 6, verticalAlign: 'middle' }} />
                    )}
                  </div>
                  {l.address && (
                    <div style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>📍</span>
                      <span>{l.address}</span>
                    </div>
                  )}
                  {l.description && (
                    <p style={{ fontSize: '.88rem', color: 'var(--ink-mid)', marginBottom: 8 }}>
                      {l.description.slice(0, 80)}{l.description.length > 80 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--pine)', fontSize: '1.25rem' }}>
                      ₹{l.price} <span style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--ink-lite)' }}>/ plant</span>
                    </div>
                    {l.quantity > 0 ? (
                      <div className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--pine)', fontWeight: 600 }}>
                        📦 {l.quantity} available
                      </div>
                    ) : (
                      <div className="badge" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                        🔴 Sold Out (0 in stock)
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-actions">
                  {user && user._id !== l.provider?._id && (
                    <button
                      className="btn btn-accent btn-sm btn-full"
                      disabled={l.quantity <= 0}
                      onClick={() => setRequestTarget(l)}
                    >
                      {l.quantity > 0 ? '📬 Request / Buy Plant' : 'Sold Out'}
                    </button>
                  )}
                  {user && user._id === l.provider?._id && (
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      {l.quantity <= 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, fontWeight: 600 }}
                          onClick={() => handleRestock(l._id)}
                        >
                          📦 Restock (+5)
                        </button>
                      )}
                      <button
                        className="btn btn-danger-ghost btn-sm"
                        style={{ flex: l.quantity <= 0 ? '0 0 auto' : '1' }}
                        onClick={() => setDeleteTarget(l)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to remove listing for "${deleteTarget.plant?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Purchase Request Modal */}
      {requestTarget && (
        <PurchaseRequestModal
          listing={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSubmit={handlePurchaseSubmit}
          loading={requestLoading}
        />
      )}

      {/* Full-Resolution Lightbox Modal */}
      {selectedImage && (
        <PlantImageModal
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          subtitle={selectedImage.subtitle}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
