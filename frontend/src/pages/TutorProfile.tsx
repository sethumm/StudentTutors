import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

interface TutorProfileData {
  id: string;
  fullName: string;
  educationLevel: string;
  institutionName: string;
  bio: string;
  hourlyRate: number;
  subjects: { name: string; level: string }[];
  yearGroups: number[];
  availability: { dayOfWeek: number; startHour: number }[];
  averageRating: number | null;
  reviewCount: number;
}

interface Review {
  id: string;
  reviewerFirstName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  tutorProfileId: string;
}

function Stars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const full = Math.round(rating);
  return (
    <span className="stars" style={{ fontSize: size === 'sm' ? '0.9rem' : '1.1rem' }}
      aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [tutor, setTutor] = useState<TutorProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [connection, setConnection] = useState<Connection | null | undefined>(undefined);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Review form
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingProfile(true);
    Promise.all([
      api.get<TutorProfileData>(`/api/tutors/${id}`),
      api.get<{ reviews: Review[]; averageRating: number | null }>(`/api/tutors/${id}/reviews`),
    ])
      .then(([profileData, reviewData]) => {
        setTutor(profileData);
        setReviews(reviewData.reviews ?? []);
      })
      .catch(() => setError('Failed to load tutor profile.'))
      .finally(() => setLoadingProfile(false));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'customer' || !id) return;
    api.get<{ connections: Connection[] }>('/api/connections')
      .then((data) => {
        const conn = (data.connections ?? []).find((c) => c.tutorProfileId === id);
        setConnection(conn ?? null);
      })
      .catch(() => setConnection(null));

    // Check if customer can review (has completed payment)
    api.get<{ payments: { tutorProfileId: string; status: string }[] }>('/api/payments/history')
      .then((data) => {
        const paid = (data.payments ?? []).some((p) => p.tutorProfileId === id && p.status === 'completed');
        setCanReview(paid);
      })
      .catch(() => {});
  }, [user, id]);

  async function handleConnect() {
    if (!user) { navigate('/register/customer'); return; }
    setConnectError('');
    setConnectLoading(true);
    try {
      const data = await api.post<{ connection: Connection }>('/api/connections', { tutorProfileId: id });
      setConnection(data.connection);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setConnectError(e?.response?.data?.message ?? 'Failed to send connection request.');
    } finally {
      setConnectLoading(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewError('');
    setReviewLoading(true);
    try {
      if (existingReview) {
        await api.put(`/api/reviews/${existingReview.id}`, { rating: reviewRating, reviewText });
      } else {
        await api.post(`/api/tutors/${id}/reviews`, { rating: reviewRating, reviewText });
      }
      setReviewSuccess('Review submitted successfully!');
      // Refresh reviews
      const reviewData = await api.get<{ reviews: Review[] }>(`/api/tutors/${id}/reviews`);
      setReviews(reviewData.reviews ?? []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setReviewError(e?.response?.data?.message ?? 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  }

  function getConnectionButton() {
    if (!user || user.role !== 'customer') return null;
    if (connection === undefined) return null;

    if (connection === null) {
      return (
        <button className="btn btn-primary" onClick={handleConnect} disabled={connectLoading}>
          {connectLoading ? 'Sending…' : 'Connect'}
        </button>
      );
    }
    if (connection.status === 'pending') {
      return <button className="btn btn-secondary" disabled>Pending</button>;
    }
    if (connection.status === 'accepted') {
      return (
        <button className="btn btn-secondary" onClick={() => navigate(`/messages/${connection.id}`)}>
          Connected — Open Chat
        </button>
      );
    }
    return <button className="btn btn-secondary" disabled>Declined</button>;
  }

  if (loadingProfile) return <Layout><p className="text-muted">Loading…</p></Layout>;
  if (error || !tutor) return <Layout><div className="alert alert-error">{error || 'Tutor not found.'}</div></Layout>;

  // Build availability grid data
  const availSet = new Set(tutor.availability.map((a) => `${a.dayOfWeek}-${a.startHour}`));

  return (
    <Layout>
      <div style={{ maxWidth: 800 }}>
        {/* Header */}
        <div className="card">
          <div className="flex-between flex wrap gap-2">
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tutor.fullName}</h1>
              <p className="text-muted">
                {tutor.educationLevel === 'university' ? 'University Student' : 'A-Level Student'}
                {tutor.institutionName ? ` · ${tutor.institutionName}` : ''}
              </p>
              {tutor.averageRating !== null ? (
                <div className="mt-1">
                  <Stars rating={tutor.averageRating} />
                  <span className="text-muted" style={{ marginLeft: 6, fontSize: '0.9rem' }}>
                    {tutor.averageRating.toFixed(1)} ({tutor.reviewCount} review{tutor.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              ) : (
                <p className="text-muted mt-1" style={{ fontSize: '0.9rem' }}>No reviews yet</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>£{tutor.hourlyRate}/hr</p>
              {getConnectionButton()}
              {connectError && <p className="text-muted" style={{ color: '#dc2626', marginTop: 4, fontSize: '0.85rem' }}>{connectError}</p>}
              {!user && (
                <p className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  <a href="/register/customer">Register</a> to connect
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {tutor.bio && (
          <div className="card">
            <h2 className="section-title">About</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{tutor.bio}</p>
          </div>
        )}

        {/* Subjects */}
        <div className="card">
          <h2 className="section-title">Subjects</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {tutor.subjects.map((s) => (
              <span key={s.name} className="badge badge-blue">{s.name} ({s.level})</span>
            ))}
          </div>
        </div>

        {/* Year Groups */}
        <div className="card">
          <h2 className="section-title">Year Groups Taught</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {tutor.yearGroups.map((yg) => (
              <span key={yg} className="badge badge-green">Year {yg}</span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="card">
          <h2 className="section-title">Availability</h2>
          <div className="avail-grid">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  {DAYS.map((d) => <th key={d}>{d.slice(0, 3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((h) => (
                  <tr key={h}>
                    <td>{String(h).padStart(2, '0')}:00</td>
                    {DAYS.map((_, di) => (
                      <td key={di} style={{ textAlign: 'center' }}>
                        {availSet.has(`${di}-${h}`) ? (
                          <span style={{ color: '#16a34a', fontWeight: 700 }} aria-label="Available">✓</span>
                        ) : (
                          <span style={{ color: '#e2e8f0' }} aria-label="Unavailable">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews */}
        <div className="card">
          <h2 className="section-title">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted">No reviews have been submitted yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="flex-between">
                  <strong>{r.reviewerFirstName}</strong>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <Stars rating={r.rating} size="sm" />
                {r.reviewText && <p style={{ marginTop: 4, fontSize: '0.9rem' }}>{r.reviewText}</p>}
              </div>
            ))
          )}

          {/* Review form for eligible customers */}
          {user?.role === 'customer' && canReview && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                {existingReview ? 'Edit Your Review' : 'Leave a Review'}
              </h3>
              {reviewError && <div className="alert alert-error">{reviewError}</div>}
              {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label htmlFor="reviewRating">Rating *</label>
                  <select id="reviewRating" value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))} required>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reviewText">Review (optional)</label>
                  <textarea id="reviewText" value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this tutor…" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                  {reviewLoading ? 'Submitting…' : existingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
