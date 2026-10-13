import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getIncomingRequests } from '../services/index';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Poll or fetch pending incoming orders when user is authenticated
  useEffect(() => {
    if (!user) {
      setPendingOrdersCount(0);
      return;
    }

    let isMounted = true;
    const fetchPendingOrders = async () => {
      try {
        const { data } = await getIncomingRequests();
        if (isMounted && Array.isArray(data)) {
          const pending = data.filter((r) => r.status === 'pending').length;
          setPendingOrdersCount(pending);
        }
      } catch {
        // Silently catch if not authorized or network issue
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 10000); // Check every 10s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  const Avatar = () =>
    user?.profileImage ? (
      <img src={user.profileImage} alt={user.name} className="nav-avatar" />
    ) : (
      <div className="nav-avatar-placeholder">{user?.name?.[0]?.toUpperCase()}</div>
    );

  const links = user ? (
    <>
      <li><NavLink to="/plants" onClick={() => setOpen(false)}>Plants</NavLink></li>
      <li><NavLink to="/listings" onClick={() => setOpen(false)}>Listings</NavLink></li>
      <li>
        <NavLink
          to="/requests"
          onClick={() => setOpen(false)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          Requests
          {pendingOrdersCount > 0 && (
            <span
              className="notification-badge-pill"
              title={`${pendingOrdersCount} pending incoming order(s)`}
            >
              {pendingOrdersCount}
            </span>
          )}
        </NavLink>
      </li>
      <li><NavLink to="/chat" onClick={() => setOpen(false)}>Messages</NavLink></li>
      <li><NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink></li>
      <li><NavLink to="/profile" onClick={() => setOpen(false)}><Avatar /></NavLink></li>
      <li><button className="btn-logout" onClick={handleLogout}>Logout</button></li>
    </>
  ) : (
    <>
      <li><NavLink to="/login" onClick={() => setOpen(false)}>Login</NavLink></li>
      <li><NavLink to="/signup" onClick={() => setOpen(false)}>Sign Up</NavLink></li>
    </>
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            🌿 Green<span>Link</span>
          </NavLink>
          <ul className="navbar-links">{links}</ul>
          <button
            className="nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>
      {/* Mobile menu — rendered below navbar in DOM */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999 }}>
        <div className={`nav-mobile-menu ${open ? 'open' : ''}`}>
          {user ? (
            <>
              <NavLink to="/plants" onClick={() => setOpen(false)}>🌱 Plants</NavLink>
              <NavLink to="/listings" onClick={() => setOpen(false)}>🏪 Listings</NavLink>
              <NavLink
                to="/requests"
                onClick={() => setOpen(false)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>📬 Requests</span>
                {pendingOrdersCount > 0 && (
                  <span className="notification-badge-pill">
                    {pendingOrdersCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/chat" onClick={() => setOpen(false)}>💬 Messages</NavLink>
              <NavLink to="/dashboard" onClick={() => setOpen(false)}>📊 Dashboard</NavLink>
              <NavLink to="/profile" onClick={() => setOpen(false)}>👤 Profile</NavLink>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)}>Login</NavLink>
              <NavLink to="/signup" onClick={() => setOpen(false)}>Sign Up</NavLink>
            </>
          )}
        </div>
      </div>
    </>
  );
}
