/**
 * PlantSellersModal
 * Displays all available marketplace sellers for a specific plant in an elegant,
 * professional modal without stretching or distorting the catalog grid.
 */
export default function PlantSellersModal({
  plant,
  listings = [],
  loading = false,
  user,
  onClose,
  onRequestBuy,
  onCreateListing
}) {
  if (!plant) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 9998,
        backgroundColor: 'rgba(12, 28, 20, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--paper)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          padding: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, var(--cream) 0%, var(--paper-mid) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {plant.image ? (
              <img
                src={plant.image}
                alt={plant.name}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid #fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'var(--sage-lite)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem'
                }}
              >
                🌿
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, color: 'var(--pine)', fontSize: '1.35rem' }}>
                  {plant.name}
                </h3>
                <span
                  style={{
                    fontSize: '.75rem',
                    fontWeight: 700,
                    background: 'var(--pine)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}
                >
                  {listings.length} {listings.length === 1 ? 'Seller' : 'Sellers'} Available
                </span>
              </div>
              {plant.scientificName && (
                <div style={{ fontSize: '.84rem', color: 'var(--ink-lite)', fontStyle: 'italic', marginTop: 2 }}>
                  {plant.scientificName}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="close-pill-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Seller List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-mid)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p>Fetching verified sellers near you…</p>
            </div>
          ) : listings.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--cream)',
                borderRadius: '14px',
                border: '1px dashed var(--border)'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🏪</div>
              <h4 style={{ margin: '0 0 8px', color: 'var(--pine)' }}>
                No Active Sellers for this Plant Yet
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '.9rem', color: 'var(--ink-mid)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Be the first provider to list this plant in the community marketplace!
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCreateListing}
              >
                + List this Plant for Sale
              </button>
            </div>
          ) : (
            listings.map((l) => (
              <div
                key={l._id}
                style={{
                  background: 'var(--cream)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Seller Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {l.provider?.profileImage ? (
                      <img
                        src={l.provider.profileImage}
                        alt=""
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'var(--pine)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1rem'
                        }}
                      >
                        {l.provider?.name?.[0]?.toUpperCase() || 'P'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>
                        {l.provider?.name || 'Local Nursery'}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--pine)', fontWeight: 600 }}>
                        🌿 Verified Plant Provider
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Stock */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--pine)', fontSize: '1.3rem' }}>
                      ₹{l.price} <span style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--ink-lite)' }}>/ plant</span>
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '.78rem',
                        fontWeight: 600,
                        background: 'var(--paper-mid)',
                        color: 'var(--pine)',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}
                    >
                      📦 {l.quantity || 1} available in stock
                    </span>
                  </div>
                </div>

                {/* Pickup Address */}
                {l.address && (
                  <div style={{ fontSize: '.84rem', color: 'var(--ink-mid)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📍</span>
                    <span><strong>Pickup Address:</strong> {l.address}</span>
                  </div>
                )}

                {/* Seller Description */}
                {l.description && (
                  <p style={{
                    fontSize: '.88rem',
                    color: 'var(--ink-mid)',
                    background: 'var(--paper)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    margin: '8px 0 14px',
                    lineHeight: 1.45,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    "{l.description}"
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  {user && user._id === l.provider?._id ? (
                    <span style={{ fontSize: '.82rem', color: 'var(--ink-lite)', fontStyle: 'italic', alignSelf: 'center' }}>
                      (This is your listing)
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-accent btn-sm"
                      onClick={() => onRequestBuy(l)}
                      style={{ padding: '8px 18px', fontWeight: 600, fontSize: '.9rem' }}
                    >
                      🛒 Request / Buy Plant
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--cream)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCreateListing}
            style={{ fontSize: '.84rem', color: 'var(--pine)' }}
          >
            + Also sell this plant
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
