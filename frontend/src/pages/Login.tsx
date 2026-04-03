import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLockoutMinutes(null);
    setUnverified(false);
    setLoading(true);

    try {
      const data = await api.post<{ user: { id: string; email: string; role: string }; accessToken: string }>(
        '/api/auth/login',
        { email, password }
      );
      setAuth(data.user, data.accessToken);

      const role = data.user.role;
      if (role === 'tutor') navigate('/dashboard/tutor');
      else if (role === 'customer') navigate('/dashboard/customer');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string; minutesRemaining?: number } } };
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? '';

      if (status === 423) {
        setLockoutMinutes(e?.response?.data?.minutesRemaining ?? 15);
      } else if (status === 401 && msg.toLowerCase().includes('verif')) {
        setUnverified(true);
      } else {
        setError(msg || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 400 }}>
        <h1 className="page-title">Log In</h1>

        {lockoutMinutes !== null && (
          <div className="alert alert-error" role="alert">
            Your account is temporarily locked due to too many failed login attempts.
            Please try again in {lockoutMinutes} minute{lockoutMinutes !== 1 ? 's' : ''}.
          </div>
        )}
        {unverified && (
          <div className="alert alert-info" role="alert">
            Please verify your email address before logging in. Check your inbox for a verification link.
          </div>
        )}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-2 text-muted">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="mt-1 text-muted">
          Don't have an account?{' '}
          <Link to="/register/customer">Register as a customer</Link> or{' '}
          <Link to="/register/tutor">register as a tutor</Link>
        </p>
      </div>
    </Layout>
  );
}
