import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ maxWidth: 400 }}>
        <h1 className="page-title">Forgot Password</h1>

        {sent ? (
          <div className="alert alert-success" role="alert">
            If an account exists for that email, we've sent a password reset link. Please check your inbox.
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <p className="mb-2 text-muted">Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-2 text-muted">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </Layout>
  );
}
