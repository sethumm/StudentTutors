import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];

export default function CustomerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'student' as 'student' | 'parent',
    yearGroup: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!acceptTerms) { setError('You must accept the Terms of Service and Privacy Policy.'); return; }
    if (form.role === 'student' && !form.yearGroup) { setError('Please select your year group.'); return; }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        acceptTerms,
      };
      if (form.role === 'student') payload.yearGroup = parseInt(form.yearGroup);

      await api.post('/api/auth/register/customer', payload);
      setSuccess('Registration successful! Please check your email to confirm your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 className="page-title">Register as a Customer</h1>
      <div style={{ maxWidth: 480 }}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input id="fullName" name="fullName" type="text" value={form.fullName}
              onChange={handleChange} required autoComplete="name" />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input id="email" name="email" type="email" value={form.email}
              onChange={handleChange} required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input id="password" name="password" type="password" value={form.password}
              onChange={handleChange} required autoComplete="new-password" minLength={8} />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input id="phone" name="phone" type="tel" value={form.phone}
              onChange={handleChange} required autoComplete="tel" />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a *</label>
            <select id="role" name="role" value={form.role} onChange={handleChange} required>
              <option value="student">Student</option>
              <option value="parent">Parent / Guardian</option>
            </select>
          </div>

          {form.role === 'student' && (
            <div className="form-group">
              <label htmlFor="yearGroup">Current Year Group *</label>
              <select id="yearGroup" name="yearGroup" value={form.yearGroup}
                onChange={handleChange} required>
                <option value="">Select year group…</option>
                {YEAR_GROUPS.map((yg) => (
                  <option key={yg} value={yg}>Year {yg}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-check" style={{ marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
            />
            <label htmlFor="acceptTerms">
              I accept the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link> *
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering…' : 'Create Account'}
          </button>

          <p className="mt-2 text-muted">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          <p className="mt-1 text-muted">
            Are you a tutor? <Link to="/register/tutor">Register as a tutor</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
