export default function StarRating({ value = 0, max = 5, interactive = false, onChange }) {
  return (
    <div className="stars">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <span
          key={star}
          className={`star ${star <= Math.round(value) ? 'star-filled' : 'star-empty'}`}
          onClick={() => interactive && onChange?.(star)}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${star} stars` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}
