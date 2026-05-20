import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authed') {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-side">
        <div>
          <div className="sidebar-brand" style={{ background: 'transparent', border: 0, padding: 0 }}>
            <span className="sidebar-brand-mark" style={{ background: 'rgba(255,255,255,0.18)' }}>A</span>
            <span style={{ color: 'white' }}>Admin Platform</span>
          </div>
          <h1 style={{ marginTop: 60 }}>Admin Platform</h1>
          <p className="tagline">
            Manage users, sites, and roles for a multi-tenant admin workspace.
          </p>
        </div>
        <div className="footer">© {new Date().getFullYear()} Admin Platform</div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={onSubmit}>
          <h2>Sign in</h2>
          <p className="sub">Enter your credentials to continue.</p>

          {error && <div className="login-error">{error}</div>}

          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-hint">
            Try the seeded admin: <code>admin@example.com</code> / <code>Admin@12345</code>
          </div>
        </form>
      </div>
    </div>
  );
}
