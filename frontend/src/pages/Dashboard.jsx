import { useState, useEffect } from 'react';
import { getDashboardStats, getProviderStats, getMyListings } from '../services/index';
import { getProviderRatings } from '../services/index';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats]           = useState(null);
  const [providerStats, setProvStats] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [ratings, setRatings]       = useState({ ratings: [], averageRating: 0, count: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch platform stats + provider-specific data in parallel
        const baseRequests = [getDashboardStats()];
        const isProvider = user?.isProvider;

        if (isProvider) {
          const [statsRes, psRes, mlRes, ratRes] = await Promise.all([
            getDashboardStats(),
            getProviderStats(),
            getMyListings(),
            getProviderRatings(user._id),
          ]);
          setStats(statsRes.data);
          setProvStats(psRes.data);
          setMyListings(mlRes.data);
          setRatings(ratRes.data);
        } else {
          const [statsRes] = await Promise.all(baseRequests);
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);


  if (loading) return <div className="page"><div className="container"><div className="spinner" /></div></div>;

  const platformCards = stats
    ? [
        { icon: '🌱', label: 'Total Plants',    value: stats.totalPlants,    accent: false },
        { icon: '🏪', label: 'Total Listings',  value: stats.totalListings,  accent: false },
        { icon: '📬', label: 'Total Requests',  value: stats.totalRequests,  accent: false },
        { icon: '👥', label: 'Users',           value: stats.totalUsers,     accent: false },
        { icon: '🌿', label: 'Providers',       value: stats.totalProviders, accent: false },
        { icon: '⭐', label: 'Avg Rating',      value: stats.averageRating,  accent: true  },
      ]
    : [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h2>📊 Dashboard</h2>
            <p className="page-subtitle">Platform overview and your stats</p>
          </div>
        </div>

        {error && <div className="alert alert-error" onClick={() => setError('')}>{error} ✕</div>}

        {/* Platform stats */}
        <h3 style={{ marginBottom: 16, color: 'var(--pine)' }}>Platform Overview</h3>
        <div className="stats-grid">
          {platformCards.map((c) => (
            <div className={`stat-card ${c.accent ? 'accent' : ''}`} key={c.label}>
              <div className="stat-icon">{c.icon}</div>
              <div className="stat-value">{c.value ?? '–'}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        {stats?.recentActivity?.length > 0 && (
          <div className="chart-section">
            <h3>Requests — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.recentActivity} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="var(--pine-lite)" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Provider section */}
        {user?.isProvider ? (
          <>
            <h3 style={{ marginBottom: 16, color: 'var(--pine)' }}>Your Provider Stats</h3>
            {providerStats && (
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {[
                  { icon: '🏪', label: 'My Listings',    value: providerStats.myListings   },
                  { icon: '📬', label: 'My Requests',    value: providerStats.myRequests   },
                  { icon: '⭐', label: 'My Avg Rating',  value: providerStats.averageRating, accent: true },
                  { icon: '🗳️', label: 'Total Ratings',  value: providerStats.totalRatings  },
                ].map((c) => (
                  <div className={`stat-card ${c.accent ? 'accent' : ''}`} key={c.label}>
                    <div className="stat-icon">{c.icon}</div>
                    <div className="stat-value">{c.value ?? '–'}</div>
                    <div className="stat-label">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* My listings */}
            {myListings.length > 0 && (
              <div className="chart-section" style={{ marginTop: 24 }}>
                <h3>My Active Listings ({myListings.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {myListings.slice(0, 5).map((l) => (
                    <div
                      key={l._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        background: 'var(--paper)', borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {l.plant?.image ? (
                        <img src={l.plant.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--sage-lite)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🌿</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--pine)' }}>{l.plant?.name}</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--ink-lite)' }}>
                          {l.availability ? '✅ Available' : '❌ Unavailable'}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--pine)' }}>
                        ₹{l.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reviews */}
            {ratings.ratings.length > 0 && (
              <div className="chart-section" style={{ marginTop: 24 }}>
                <h3>Recent Reviews <span style={{ fontSize: '.9rem', color: 'var(--ink-lite)', fontFamily: 'var(--font-mono)' }}>({ratings.averageRating} ★ avg)</span></h3>
                {ratings.ratings.slice(0, 5).map((r) => (
                  <div
                    key={r._id}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', gap: 12,
                    }}
                  >
                    {r.user?.profileImage ? (
                      <img src={r.user.profileImage} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--pine-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                        {r.user?.name?.[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{r.user?.name}</div>
                      <StarRating value={r.rating} />
                      {r.comment && <p style={{ fontSize: '.85rem', color: 'var(--ink-mid)', marginTop: 4 }}>{r.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌿</div>
            <h3 style={{ color: 'var(--pine)', marginBottom: 8 }}>Become a Provider</h3>
            <p style={{ color: 'var(--ink-lite)', marginBottom: 20 }}>
              Share your plants with the community. Enable provider mode to create listings and start earning.
            </p>
            <a href="/profile" className="btn btn-primary">Go to Profile Settings</a>
          </div>
        )}
      </div>
    </div>
  );
}
