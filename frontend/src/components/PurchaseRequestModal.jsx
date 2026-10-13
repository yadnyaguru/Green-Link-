import { useState } from 'react';

export default function PurchaseRequestModal({ listing, onClose, onSubmit, loading }) {
  const maxStock = listing?.quantity > 0 ? listing.quantity : 1;
  const unitPrice = listing?.price || 0;
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  const handleQtyChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setQuantity(1);
    } else {
      setQuantity(Math.min(Math.max(1, num), maxStock));
    }
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(prev + 1, maxStock));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      listingId: listing._id,
      quantity,
      message: message.trim() || `I would like to purchase ${quantity} ${listing.plant?.name || 'plant'}(s).`,
    });
  };

  const totalPrice = quantity * unitPrice;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: 'var(--pine)', fontSize: '1.25rem' }}>
            🛒 Purchase Request
          </h3>
          <button className="close-pill-btn" onClick={onClose}>✕</button>
        </div>

        {/* Plant & Provider overview card */}
        <div style={{
          background: 'var(--paper)',
          padding: '14px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          marginBottom: 18
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                {listing.plant?.name || 'Plant'}
              </div>
              <div style={{ fontSize: '.84rem', color: 'var(--ink-lite)', marginTop: 2 }}>
                Seller: <strong>{listing.provider?.name || 'Provider'}</strong>
              </div>
              {listing.address && (
                <div style={{ fontSize: '.82rem', color: 'var(--ink-mid)', marginTop: 4 }}>
                  📍 <strong>Address:</strong> {listing.address}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.78rem', color: 'var(--ink-lite)' }}>Price per plant</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--pine)' }}>
                ₹{unitPrice}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--ink-lite)' }}>
                Stock: <strong>{maxStock}</strong> available
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleFormSubmit}>
          {/* Quantity Selector */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Quantity Needed *</span>
              <span style={{ fontSize: '.78rem', textTransform: 'none', color: 'var(--ink-lite)' }}>
                Max {maxStock} available
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: 42, height: 42, padding: 0, fontSize: '1.2rem', fontWeight: 700 }}
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={maxStock}
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                value={quantity}
                onChange={(e) => handleQtyChange(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: 42, height: 42, padding: 0, fontSize: '1.2rem', fontWeight: 700 }}
                onClick={handleIncrement}
                disabled={quantity >= maxStock}
              >
                +
              </button>
            </div>

            {/* Quick quantity chips if high stock */}
            {maxStock >= 5 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[5, 10, 20, 50, maxStock].filter((n, i, arr) => n <= maxStock && arr.indexOf(n) === i).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{
                      background: quantity === n ? 'var(--pine)' : 'transparent',
                      color: quantity === n ? 'var(--white)' : 'var(--ink-mid)'
                    }}
                    onClick={() => setQuantity(n)}
                  >
                    {n === maxStock ? `All (${n})` : `${n} plants`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Total Price Calculation Box */}
          <div style={{
            background: 'var(--cream)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            border: '1.5px dashed var(--pine)',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '.8rem', color: 'var(--ink-lite)' }}>
                Calculation: {quantity} × ₹{unitPrice}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--pine)', fontSize: '.9rem' }}>
                Total Payable Amount
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--pine)'
            }}>
              ₹{totalPrice.toLocaleString()}
            </div>
          </div>

          {/* Optional Message */}
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label">Note for Seller (Optional)</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 70 }}
              placeholder="e.g. Can I pick these up on Saturday morning? Need healthy seedlings."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : `Confirm Request (₹${totalPrice.toLocaleString()})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
