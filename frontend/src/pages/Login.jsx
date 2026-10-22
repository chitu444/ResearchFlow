import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon, ShieldCheckIcon } from '../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ email, password });
      navigate(
        user.role === 'researcher'
          ? '/'
          : user.role === 'lab_manager'
          ? '/reservations'
          : '/analytics'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? 'Cannot reach the ResearchFlow backend. Make sure the API server is running on port 5000.'
            : 'Login failed. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="theme-float" onClick={toggle} title="Toggle theme">
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>

      <div className="auth-art">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span>ResearchFlow</span>
        </div>

        <div>
          <span className="eyebrow">RESEARCH OPERATIONS PLATFORM</span>
          <h1>Turn experiments into a connected research workflow.</h1>
          <p>
            Coordinate people, instruments, schedules, detector evidence, and compliance in one auditable workspace.
          </p>
        </div>

        <div className="feature-strip">
          <span>
            <ShieldCheckIcon /> RBAC Security
          </span>
          <span>Live Equipment Locking</span>
          <span>Detector Datasets</span>
        </div>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Sign in</h2>
        <p className="muted">Use your registered institutional account.</p>

        {error && <div className="error">{error}</div>}

        <label>
          Institutional Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            placeholder="you@researchflow.com"
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>

        <button className="primary full" type="submit" disabled={loading}>
          {loading ? 'Authenticating…' : 'Login'}
        </button>

        <div className="demo-hint">
          Development demo accounts: <strong>admin@researchflow.com</strong>, <strong>manager@researchflow.com</strong>, <strong>researcher@researchflow.com</strong> / <strong>ResearchFlow@123</strong>
        </div>
      </form>
    </div>
  );
}
