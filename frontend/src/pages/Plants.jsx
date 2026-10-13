import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPlants, createPlant, updatePlant, deletePlant } from '../services/plantService';
import { getNearbyListings, getListings, createRequest } from '../services/index';
import { useAuth } from '../context/AuthContext';
import PlantForm from '../components/PlantForm';
import ConfirmModal from '../components/ConfirmModal';
import PurchaseRequestModal from '../components/PurchaseRequestModal';
import PlantImageModal from '../components/PlantImageModal';
import PlantSellersModal from '../components/PlantSellersModal';

export default function Plants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants]           = useState([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [formOpen, setFormOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);  // plant being edited
  const [deleteTarget, setDeleteTarget] = useState(null); // plant pending delete
  const [requestTarget, setRequestTarget] = useState(null); // listing to buy
  const [selectedImage, setSelectedImage] = useState(null); // image for lightbox
  const [sellerModalPlant, setSellerModalPlant] = useState(null); // plant in sellers modal
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [plantListings, setPlantListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const fetchPlants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getPlants(search);
      setPlants(data);
    } catch {
      setError('Failed to load plants');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchPlants, 300);
    return () => clearTimeout(t);
  }, [fetchPlants]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (fd) => {
    setFormLoading(true);
    try {
      await createPlant(fd);
      setFormOpen(false);
      setSuccess('Plant added successfully to catalogue!');
      fetchPlants();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add plant');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update ──────────────────────────────────────────────────────────────────
  const handleUpdate = async (fd) => {
    setFormLoading(true);
    try {
      await updatePlant(editTarget._id, fd);
      setEditTarget(null);
      setSuccess('Plant updated successfully!');
      fetchPlants();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update plant');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await deletePlant(deleteTarget._id);
      setDeleteTarget(null);
      setSuccess('Plant deleted successfully');
      fetchPlants();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plant');
    }
  };

  // ── Open Sellers Modal for Plant (Buy / Adopt) ──────────────────────────
  const openSellersModal = async (plant) => {
    setSellerModalPlant(plant);
    setListingsLoading(true);
    try {
      const { data } = await getListings();
      const matched = data.filter((l) => (l.plant?._id || l.plant) === plant._id);
      setPlantListings(matched);
    } catch {
      setError('Could not load sellers for this plant');
    } finally {
      setListingsLoading(false);
    }
  };

  // ── Nearby providers ────────────────────────────────────────────────────────
  const findNearby = (plant) => {
    setSellerModalPlant(plant);
    setListingsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await getNearbyListings(coords.latitude, coords.longitude);
          const relevant = data.filter((l) => (l.plant?._id || l.plant) === plant._id);
          setPlantListings(relevant);
          if (relevant.length === 0) {
            setError(`No sellers found within 50 km for "${plant.name}". Showing all active sellers.`);
            const all = await getListings();
            setPlantListings(all.data.filter((l) => (l.plant?._id || l.plant) === plant._id));
          }
        } catch {
          setError('Could not fetch nearby providers');
        } finally {
          setListingsLoading(false);
        }
      },
      async () => {
        setError('Location permission denied. Showing all active marketplace sellers.');
        try {
          const { data } = await getListings();
          setPlantListings(data.filter((l) => (l.plant?._id || l.plant) === plant._id));
        } finally {
          setListingsLoading(false);
        }
      }
    );
  };

  // ── Purchase Request Modal Submit ──────────────────────────────────────────
  const handlePurchaseSubmit = async ({ listingId, quantity, message }) => {
    setRequestLoading(true);
    try {
      await createRequest({ listingId, quantity, message });
      setRequestTarget(null);
      setSellerModalPlant(null);
      setSuccess(`Purchase request for ${quantity} plant(s) sent successfully! The seller has been notified under Requests.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send request');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h2>🌱 Plant Catalogue</h2>
            <p className="page-subtitle">Browse and manage the community plant library</p>
          </div>
          {user && (
            <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
              + Add Plant
            </button>
          )}
        </div>

        {error   && <div className="alert alert-error"   onClick={() => setError('')}>{error} ✕</div>}
        {success && <div className="alert alert-success" onClick={() => setSuccess('')}>{success} ✓</div>}

        {/* Search */}
        <div className="search-bar">
          <input
            className="form-input"
            placeholder="Search by name, species, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Create form inline */}
        {formOpen && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-seed-header" />
            <div className="card-body">
              <h3 style={{ marginBottom: 20 }}>Add New Plant</h3>
              <PlantForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} loading={formLoading} />
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editTarget && (
          <div className="modal-backdrop" onClick={() => setEditTarget(null)}>
            <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginBottom: 20 }}>Edit Plant</h3>
              <PlantForm
                initial={editTarget}
                onSubmit={handleUpdate}
                onCancel={() => setEditTarget(null)}
                loading={formLoading}
              />
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteTarget && (
          <ConfirmModal
            title="Delete Plant"
            message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* Grid */}
        {loading ? (
          <div className="spinner" />
        ) : plants.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🌿</div>
            <h3>No plants found</h3>
            <p>{search ? 'Try a different search term' : 'Be the first to add a plant!'}</p>
          </div>
        ) : (
          <div className="plant-grid">
            {plants.map((p) => (
              <div className="card" key={p._id}>
                <div className="card-seed-header" />
                <div
                  className="card-img-container"
                  onClick={() => p.image && setSelectedImage({ url: p.image, title: p.name, subtitle: p.scientificName })}
                  title={p.image ? "Click to view full-resolution photo" : ""}
                >
                  {p.image ? (
                    <>
                      <img
                        src={p.image}
                        alt={p.name}
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
                  <div className="card-title">{p.name}</div>
                  {p.scientificName && (
                    <div className="card-meta" style={{ fontStyle: 'italic' }}>{p.scientificName}</div>
                  )}
                  {p.description && (
                    <p style={{ fontSize: '.88rem', color: 'var(--ink-mid)', marginBottom: 8 }}>
                      {p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}
                    </p>
                  )}
                  <div style={{ fontSize: '.8rem', color: 'var(--ink-lite)' }}>
                    Added by {p.addedBy?.name || 'Unknown'}
                  </div>
                </div>

                <div className="card-actions">
                  {/* Primary public actions in balanced grid */}
                  <div className="card-btn-grid">
                    <button
                      className="btn btn-sm btn-accent"
                      onClick={() => openSellersModal(p)}
                      title="View sellers and purchase this plant"
                    >
                      🛒 Buy / Listings
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => findNearby(p)}
                      title="Find nearby providers"
                    >
                      📍 Nearby
                    </button>
                  </div>

                  {/* Owner / Provider management toolbar */}
                  {(user?.isProvider || (user && p.addedBy?._id === user._id)) && (
                    <div className="card-admin-actions">
                      {user?.isProvider && (
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => navigate(`/listings?plant=${p._id}`)}
                          title="Create a market listing for this plant"
                        >
                          + List for Sale
                        </button>
                      )}
                      {user && p.addedBy?._id === user._id && (
                        <>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setEditTarget(p)}
                            title="Edit plant"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger-ghost btn-xs"
                            onClick={() => setDeleteTarget(p)}
                            title="Delete plant"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plant Sellers & Marketplace Modal (Opens without stretching grid) */}
        {sellerModalPlant && (
          <PlantSellersModal
            plant={sellerModalPlant}
            listings={plantListings}
            loading={listingsLoading}
            user={user}
            onClose={() => setSellerModalPlant(null)}
            onRequestBuy={(listing) => setRequestTarget(listing)}
            onCreateListing={() => navigate(`/listings?plant=${sellerModalPlant._id}`)}
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
    </div>
  );
}
