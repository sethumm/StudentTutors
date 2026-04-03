import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

interface Connection {
  id: string;
  status: string;
  tutor: { id: string; fullName: string };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  tutor: { fullName: string };
}

export default function CustomerDashboard() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ connections: Connection[] }>('/api/connections'),
      api.get<{ payments: Payment[] }>('/api/payments/history'),
    ])
      .then(([connData, payData]) => {
        setConnections(connData.connections ?? []);
        setPayments(payData.payments ?? []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p className="text-muted">Loading…</p></Layout>;

  return (
    <Layout>
      <h1 className="page-title">My Dashboard</h1>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {/* Connections */}
      <section className="card" aria-labelledby="connections-section">
        <h2 id="connections-section" className="section-title">My Connections</h2>
        {connections.length === 0 ? (
          <p className="text-muted">No connections yet. <Link to="/tutors">Find a tutor</Link> to get started.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/tutors/${c.tutor?.id}`}>{c.tutor?.fullName ?? '—'}</Link>
                    </td>
                    <td>
                      <span className={`badge ${
                        c.status === 'accepted' ? 'badge-green' :
                        c.status === 'pending' ? 'badge-yellow' : 'badge-red'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.status === 'accepted' && (
                        <Link to={`/messages/${c.id}`} className="btn btn-sm btn-primary">Open Chat</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payment History */}
      <section className="card" aria-labelledby="payments-section">
        <h2 id="payments-section" className="section-title">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-muted">No payments yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.tutor?.fullName ?? '—'}</td>
                    <td>£{(p.amount / 100).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
