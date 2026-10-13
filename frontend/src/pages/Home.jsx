import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <div className="hero">
        <h1>Connect with <em>Plant Providers</em><br />Near You</h1>
        <p>
          GreenLink makes it easy to discover local plant sellers, request
          cuttings, and grow your collection — all in one place.
        </p>
        <div className="hero-cta">
          {user ? (
            <>
              <Link to="/plants"   className="btn btn-accent btn-lg">Browse Plants</Link>
              <Link to="/listings" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>View Listings</Link>
            </>
          ) : (
            <>
              <Link to="/signup" className="btn btn-accent btn-lg">Get Started Free</Link>
              <Link to="/login"  className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>Sign In</Link>
            </>
          )}
        </div>
      </div>

      <div className="container">
        <div className="features-grid">
          {[
            { icon: '🌱', title: 'Discover Plants', desc: 'Browse a community-built catalogue of plants with care guides and photos.' },
            { icon: '📍', title: 'Find Nearby Providers', desc: 'Geolocation search surfaces providers within your chosen radius instantly.' },
            { icon: '📬', title: 'Request & Chat', desc: 'Send requests to providers and coordinate through built-in messaging.' },
            { icon: '⭐', title: 'Verified Reviews', desc: 'Ratings are gated to completed transactions — only genuine experiences count.' },
          ].map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
