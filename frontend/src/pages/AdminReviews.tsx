import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

interface AdminReview {
  id: string;
  reviewer: { fullName: string; email: string };
  tutor: { fullName: string };
  rating: number;
  reviewText: string;
  isHidden: boolean;
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get<{ reviews: AdminReview[]; totalPages: number }>(`/api/admin/reviews?page=${page}`)
      .then((data) => {
        setReviews(data.reviews ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleRemove(reviewId: string) {
    if (!window.confirm('Are you sure you want to remove this review? This action cannot be undone.')) return;
    setActionError('');
    try {
      await api.delete(`/api/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionError(e?.response?.data?.message ?? 'Failed to remove review.');
    }
  }

  return (
    <Layout>
      <h1 className="page-title">Review Moderation</h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {actionError && <div className="alert alert-error" role="alert">{actionError}</div>}
      {loading && <p className="text-muted">Loading…</p>}

      {!loading && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Tutor</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>No reviews found.</td></tr>
                ) : reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.reviewer?.fullName ?? '—'}</td>
                    <td>{r.tutor?.fullName ?? '—'}</td>
                    <td>
                      <span className="stars" aria-label={`${r.rating} stars`}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reviewText || '—'}
                    </td>
                    <td>
                      <span className={`badge ${r.isHidden ? 'badge-red' : 'badge-green'}`}>
                        {r.isHidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      {!r.isHidden && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemove(r.id)}>
                          Remove
                        </button>
                      )}
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
