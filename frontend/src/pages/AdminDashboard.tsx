import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

interface Metrics {
  totalTutors: number;
  totalCustomers: number;
  activeConnections: number;
  completedPayments: number;
  totalReviews: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Metrics>('/api/admin/dashboard')
      .then(setMetrics)
      .catch(() => setError('Failed to load dashboard metrics.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="page-title">Admin Dashboard</h1>

      <nav aria-label="Admin navigation" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/admin/users" className="btn btn-secondary">User Management</Link>
        <Link to="/admin/reviews" className="btn btn-secondary">Review Moderation</Link>
        <Link to="/admin/audit" className="btn btn-secondary">Audit Log</Link>
      </nav>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p className="text-muted">Loading metrics…</p>}

      {metrics && (
        <div className="grid-3">
          <div className="metric-card">
            <div className="metric-value">{metrics.totalTutors}</div>
            <div className="metric-label">Total Tutors</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.totalCustomers}</div>
            <div className="metric-label">Total Customers</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.activeConnections}</div>
            <div className="metric-label">Active Connections</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.completedPayments}</div>
            <div className="metric-label">Completed Payments</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.totalReviews}</div>
            <div className="metric-label">Total Reviews</div>
          </div>
        </div>
      )}
    </Layout>
  );
}
