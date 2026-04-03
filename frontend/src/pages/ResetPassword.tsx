import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!token) { setError('Invalid or missing reset token.'); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 400 }}>
        <h1 className="page-title">Reset Password</h1>

        {!token && (
          <div className="alert alert-error" role="alert">
            Invalid reset link. Please request a new one.
          </div>
        )}

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" minLength={8} />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm New Password</label>
            <input id="confirm" type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required autoComplete="new-password" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !token} style={{ width: '100%' }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-2 text-muted">
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      </div>
    </Layout>
  );
}
