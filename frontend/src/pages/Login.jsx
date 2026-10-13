import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const passwordInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginApi({ email: email.trim(), password });
      login(data);
      navigate('/plants');
    } catch (err) {
      const backendMsg = err.response?.data?.message;
      let displayMsg = 'Login failed. Please check your credentials and try again.';

      if (backendMsg) {
        displayMsg = backendMsg;
      } else if (!err.response) {
        displayMsg = 'Unable to reach the server. Please check your connection and try again.';
      }

      setError(displayMsg);
      // Cleanly clear password and focus it so user can quickly retry
      setPassword('');
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>🌿 GreenLink</h1>
          <p>Welcome back — sign in to continue</p>
        </div>
        <div className="auth-card-body">
          {error && (
            <div
              className="alert alert-error"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 20,
                fontSize: '.88rem',
                lineHeight: 1.4
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div>{error}</div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Verifying Credentials…' : 'Sign In'}
            </button>
          </form>
          <div className="auth-divider">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
