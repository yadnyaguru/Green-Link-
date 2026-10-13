import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyRequests, getIncomingRequests, updateRequestStatus } from '../services/index';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function Requests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Smart initial tab: check URL param or default to 'incoming' if provider, else 'mine'
  const initialTab = searchParams.get('tab') || (user?.isProvider ? 'incoming' : 'mine');
  const [tab, setTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, accepted, completed, rejected

  const [mineRequests, setMineRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of request being updated
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load both sets of requests simultaneously
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mineRes, incomingRes] = await Promise.allSettled([
        getMyRequests(),
        getIncomingRequests(),
      ]);

      const mine = mineRes.status === 'fulfilled' ? mineRes.value.data || [] : [];
      const incoming = incomingRes.status === 'fulfilled' ? incomingRes.value.data || [] : [];

      setMineRequests(mine);
      setIncomingRequests(incoming);

      // Smart tab auto-selection if not specified by user in query param:
      // If user has incoming requests but 0 sent requests, auto-switch to incoming
      if (!searchParams.get('tab')) {
        if (incoming.length > 0 && mine.length === 0) {
          setTab('incoming');
        }
      }
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setStatusFilter('all');
    setSearchParams({ tab: newTab });
  };

  const changeStatus = async (id, status) => {
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await updateRequestStatus(id, status);
      const actionName = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'marked as completed';
      setSuccess(`Request successfully ${actionName}!`);
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request status');
    } finally {
      setActionLoading(null);
    }
  };

  const currentList = tab === 'mine' ? mineRequests : incomingRequests;
  const filteredRequests = statusFilter === 'all'
    ? currentList
    : currentList.filter((r) => r.status === statusFilter);

  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'pending').length;
  const acceptedIncomingCount = incomingRequests.filter((r) => r.status === 'accepted').length;

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>📬 Requests & Orders</span>
              {pendingIncomingCount > 0 && (
                <span
                  style={{
                    fontSize: '.75rem',
                    background: '#e67e22',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    letterSpacing: '.03em',
                    boxShadow: '0 2px 6px rgba(230,126,34,0.3)'
                  }}
                >
                  {pendingIncomingCount} New Pending
                </span>
              )}
            </h2>
            <p className="page-subtitle">
              Manage your plant purchase orders, nursery requests, and customer chats
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={loadRequests}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <span>🔄</span> Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
            {error} <span style={{ float: 'right' }}>✕</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>
            {success} <span style={{ float: 'right' }}>✕</span>
          </div>
        )}

        {/* Segmented Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            borderBottom: '2px solid var(--border)',
            paddingBottom: 2
          }}
        >
          {/* Incoming Orders Tab */}
          <button
            className={`tab-btn ${tab === 'incoming' ? 'active' : ''}`}
            onClick={() => handleTabChange('incoming')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '.95rem',
              fontWeight: 600,
              position: 'relative'
            }}
          >
            <span>📥 Received Orders</span>
            <span
              style={{
                background: tab === 'incoming' ? 'var(--pine)' : 'var(--paper-mid)',
                color: tab === 'incoming' ? '#fff' : 'var(--pine)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '.78rem',
                fontWeight: 700
              }}
            >
              {incomingRequests.length}
            </span>
            {pendingIncomingCount > 0 && (
              <span
                className="notification-dot"
                title={`${pendingIncomingCount} order(s) awaiting your action`}
              />
            )}
          </button>

          {/* Sent Requests Tab */}
          <button
            className={`tab-btn ${tab === 'mine' ? 'active' : ''}`}
            onClick={() => handleTabChange('mine')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '.95rem',
              fontWeight: 600
            }}
          >
            <span>🛒 My Sent Requests</span>
            <span
              style={{
                background: tab === 'mine' ? 'var(--pine)' : 'var(--paper-mid)',
                color: tab === 'mine' ? '#fff' : 'var(--pine)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '.78rem',
                fontWeight: 700
              }}
            >
              {mineRequests.length}
            </span>
          </button>
        </div>

        {/* Status Filter Chips */}
        {currentList.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '.8rem', color: 'var(--ink-lite)', fontWeight: 600, textTransform: 'uppercase' }}>
              Filter:
            </span>
            {['all', 'pending', 'accepted', 'completed', 'rejected'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setStatusFilter(statusKey)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: statusFilter === statusKey ? '1px solid var(--pine)' : '1px solid var(--border)',
                  background: statusFilter === statusKey ? 'var(--pine)' : 'var(--paper)',
                  color: statusFilter === statusKey ? '#fff' : 'var(--ink-mid)',
                  fontSize: '.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {statusKey}
              </button>
            ))}
          </div>
        )}

        {/* Request List */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--ink-mid)' }}>Loading your requests…</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--cream)', borderRadius: '16px', padding: '48px 24px' }}>
            <div className="icon" style={{ fontSize: '3rem', marginBottom: 12 }}>📬</div>
            <h3 style={{ color: 'var(--pine)', marginBottom: 8 }}>
              {statusFilter !== 'all'
                ? `No ${statusFilter} requests found`
                : tab === 'mine'
                ? 'No Sent Requests Yet'
                : 'No Received Orders Yet'}
            </h3>
            <p style={{ maxWidth: 420, margin: '0 auto 20px', color: 'var(--ink-mid)', fontSize: '.92rem' }}>
              {tab === 'mine'
                ? 'Explore the catalog to request plants from verified nursery sellers near you.'
                : 'When customers request to buy your listed plants, their orders will appear here for you to accept or fulfill.'}
            </p>
            {tab === 'mine' ? (
              <button className="btn btn-primary" onClick={() => navigate('/plants')}>
                🌱 Explore Plant Catalog
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => navigate('/listings')}>
                🏪 Manage Your Listings
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredRequests.map((r) => {
              const other = tab === 'mine' ? r.provider : r.requester;
              const isIncomingPending = tab === 'incoming' && r.status === 'pending';
              const isAccepted = r.status === 'accepted';
              const plant = r.listing?.plant;

              return (
                <div
                  className="request-card"
                  key={r._id}
                  style={{
                    background: 'var(--paper)',
                    borderRadius: '14px',
                    border: isIncomingPending ? '2px solid rgba(230,126,34,0.4)' : '1px solid var(--border)',
                    boxShadow: isIncomingPending ? '0 4px 18px rgba(230,126,34,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                    padding: '20px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Card Header */}
                  <div className="request-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      {plant?.image ? (
                        <img
                          src={plant.image}
                          alt={plant.name || ''}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 10,
                            objectFit: 'cover',
                            border: '1px solid var(--border)'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 10,
                            background: 'var(--sage-lite)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem'
                          }}
                        >
                          🌿
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: 'var(--pine)', fontSize: '1.15rem' }}>
                            {plant?.name || 'Plant Listing'}
                          </strong>
                          {isIncomingPending && (
                            <span
                              style={{
                                fontSize: '.7rem',
                                fontWeight: 700,
                                background: '#fef3c7',
                                color: '#b45309',
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}
                            >
                              Action Required
                            </span>
                          )}
                        </div>
                        {plant?.scientificName && (
                          <div style={{ fontSize: '.8rem', color: 'var(--ink-lite)', fontStyle: 'italic' }}>
                            {plant.scientificName}
                          </div>
                        )}
                        <div style={{ fontSize: '.84rem', color: 'var(--ink-mid)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{tab === 'mine' ? '🏪 Seller:' : '👤 Customer:'}</span>
                          {other?.profileImage ? (
                            <img
                              src={other.profileImage}
                              alt=""
                              style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: 'var(--pine)',
                                color: '#fff',
                                fontSize: '.68rem',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700
                              }}
                            >
                              {other?.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                          <strong style={{ color: 'var(--ink)' }}>{other?.name || 'User'}</strong>
                          {other?.email && (
                            <span style={{ fontSize: '.78rem', color: 'var(--ink-lite)' }}>({other.email})</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  {/* Financial & Order Details Box */}
                  <div
                    style={{
                      background: 'var(--cream)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      margin: '12px 0'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'var(--paper)',
                          color: 'var(--pine)',
                          fontWeight: 700,
                          fontSize: '.85rem',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        📦 Quantity: {r.quantity || 1} {r.quantity === 1 ? 'plant' : 'plants'}
                      </span>
                      {r.listing?.price && (
                        <span style={{ fontSize: '.84rem', color: 'var(--ink-mid)' }}>
                          Unit Price: <strong>₹{r.listing.price}</strong>
                        </span>
                      )}
                      {r.listing?.address && (
                        <div style={{ fontSize: '.82rem', color: 'var(--ink-mid)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>📍</span>
                          <span><strong>Pickup:</strong> {r.listing.address}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '.74rem', color: 'var(--ink-lite)', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                        Total Payable
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--pine)', fontSize: '1.25rem' }}>
                        ₹{(r.totalPrice || ((r.listing?.price || 0) * (r.quantity || 1))).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Requester's Note */}
                  {r.message && (
                    <div
                      style={{
                        fontSize: '.88rem',
                        color: 'var(--ink-mid)',
                        background: 'var(--paper)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        margin: '10px 0',
                        borderLeft: '3px solid var(--pine)',
                        fontStyle: 'italic'
                      }}
                    >
                      "{r.message}"
                    </div>
                  )}

                  {/* Timestamp & Footer Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(0,0,0,0.06)'
                    }}
                  >
                    <div style={{ fontSize: '.78rem', color: 'var(--ink-lite)', fontFamily: 'var(--font-mono)' }}>
                      Requested: {new Date(r.createdAt).toLocaleString()}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* Chat Button */}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/chat/${r._id}`)}
                        title="Chat about this order"
                      >
                        💬 Chat
                      </button>

                      {/* Provider Action Buttons */}
                      {tab === 'incoming' && r.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading === r._id}
                            onClick={() => changeStatus(r._id, 'accepted')}
                            style={{ fontWeight: 600 }}
                          >
                            ✓ Accept Order
                          </button>
                          <button
                            className="btn btn-danger-ghost btn-sm"
                            disabled={actionLoading === r._id}
                            onClick={() => changeStatus(r._id, 'rejected')}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}

                      {/* Completed Action */}
                      {isAccepted && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={actionLoading === r._id}
                          onClick={() => changeStatus(r._id, 'completed')}
                          style={{ fontWeight: 600 }}
                        >
                          ✓ Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
