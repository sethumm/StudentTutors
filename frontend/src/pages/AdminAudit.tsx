import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

interface AuditEntry {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export default function AdminAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get<{ entries: AuditEntry[]; totalPages: number }>(`/api/admin/audit?page=${page}`)
      .then((data) => {
        setEntries(data.entries ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError('Failed to load audit log.'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Layout>
      <h1 className="page-title">Audit Log</h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p className="text-muted">Loading…</p>}

      {!loading && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Admin ID</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>No audit entries found.</td></tr>
                ) : entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.adminUserId}</td>
                    <td><span className="badge badge-blue">{e.action}</span></td>
                    <td>{e.targetType}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.targetId}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(e.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={p === page ? 'active' : ''}
                  aria-current={p === page ? 'page' : undefined}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next</button>
            </nav>
          )}
        </>
      )}
    </Layout>
  );
}
