import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', isProvider: false });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await register(form);
      login(data);
      navigate('/plants');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>🌿 GreenLink</h1>
          <p>Create your account to get started</p>
        </div>
        <div className="auth-card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={set('name')} required placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="isProvider"
                checked={form.isProvider}
                onChange={set('isProvider')}
                style={{ width: 18, height: 18, accentColor: 'var(--pine)', cursor: 'pointer' }}
              />
              <label htmlFor="isProvider" style={{ cursor: 'pointer', fontWeight: 500 }}>
                Register as a Provider <span className="badge badge-provider" style={{ marginLeft: 6 }}>Provider</span>
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <div className="auth-divider">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
