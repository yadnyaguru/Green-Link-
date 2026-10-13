import { useState, useEffect } from 'react';

/**
 * High-Resolution Image Lightbox Modal
 * Allows inspection of plant photos irrespective of aspect ratio or original resolution.
 */
export default function PlantImageModal({ imageUrl, title, subtitle, onClose }) {
  const [zoom, setZoom] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(10, 20, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: zoom ? '95vw' : '860px',
          maxHeight: '92vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--paper)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          transition: 'all 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div style={{
          width: '100%',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'var(--cream)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pine)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🌿</span> {title || 'Plant Photo'}
            </div>
            {subtitle && (
              <div style={{ fontSize: '.82rem', color: 'var(--ink-lite)', fontStyle: 'italic' }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setZoom(!zoom)}
              title={zoom ? "Fit view" : "Zoom view"}
              style={{ padding: '6px 12px', fontSize: '.85rem' }}
            >
              {zoom ? '🔍 Fit' : '🔍 Expand'}
            </button>
            <button
              type="button"
              className="close-pill-btn"
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image Container with Full Resolution Display */}
        <div style={{
          width: '100%',
          minHeight: '260px',
          maxHeight: zoom ? '80vh' : '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          background: 'radial-gradient(circle, #edf4ef 0%, #d8e5dc 100%)',
          padding: 12
        }}>
          {!loaded && !hasError && (
            <div style={{ color: 'var(--pine)', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', animation: 'spin 1.5s infinite linear' }}>🌱</div>
              <p style={{ marginTop: 8, fontSize: '.9rem' }}>Loading high-resolution preview…</p>
            </div>
          )}

          {hasError ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mid)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>🌿</div>
              <p style={{ fontWeight: 600 }}>Image unavailable</p>
              <p style={{ fontSize: '.85rem', color: 'var(--ink-lite)' }}>The image URL could not be reached.</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={title || 'Plant preview'}
              onLoad={() => setLoaded(true)}
              onError={() => { setLoaded(true); setHasError(true); }}
              style={{
                maxWidth: zoom ? 'none' : '100%',
                maxHeight: zoom ? 'none' : '65vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                display: loaded ? 'block' : 'none',
                transition: 'transform 0.2s ease',
                cursor: zoom ? 'zoom-out' : 'zoom-in'
              }}
              onClick={() => setZoom(!zoom)}
            />
          )}
        </div>

        {/* Lightbox Footer Bar */}
        <div style={{
          width: '100%',
          padding: '10px 20px',
          fontSize: '.8rem',
          color: 'var(--ink-lite)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--cream)',
          borderTop: '1px solid var(--border)'
        }}>
          <span>💡 Click photo to toggle zoom. Irrespective of resolution, natural aspect ratio is preserved.</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
