import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TutorSummary {
  id: string;
  fullName: string;
  educationLevel: string;
  institutionName: string;
  hourlyRate: number;
  subjects: { name: string; level: string }[];
  yearGroups: number[];
  availabilityDays: number[];
  averageRating: number | null;
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-muted" style={{ fontSize: '0.85rem' }}>No reviews</span>;
  const full = Math.round(rating);
  return (
    <span>
      <span className="stars" aria-label={`${rating} out of 5 stars`}>
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      </span>
      <span className="text-muted" style={{ marginLeft: 4, fontSize: '0.85rem' }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function TutorListing() {
  const [tutors, setTutors] = useState<TutorSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get<{ tutors: TutorSummary[]; totalPages: number; page: number }>(`/api/tutors?page=${page}`)
      .then((data) => {
        setTutors(data.tutors ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError('Failed to load tutors. Please try again.'))
      .finally(() => setLoading(false));
  }, [page]);

  function renderPagination() {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return (
      <nav className="pagination" aria-label="Pagination">
        <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>Previous</button>
        {pages.map((p) => (
          <button key={p} onClick={() => setPage(p)} className={p === page ? 'active' : ''} aria-current={p === page ? 'page' : undefined}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next</button>
      </nav>
    );
  }

  return (
    <Layout>
      <h1 className="page-title">Browse Tutors</h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p className="text-muted">Loading tutors…</p>}

      {!loading && tutors.length === 0 && !error && (
        <p className="text-muted">No tutors available at the moment.</p>
      )}

      <div className="grid-2">
        {tutors.map((tutor) => {
          const dayNames = tutor.availabilityDays.map((d) => DAYS[d]).join(', ');
          return (
            <Link key={tutor.id} to={`/tutors/${tutor.id}`} className="card card-link">
              <div className="flex-between">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{tutor.fullName}</h2>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>£{tutor.hourlyRate}/hr</span>
              </div>
              <p className="text-muted" style={{ marginTop: 2, fontSize: '0.85rem' }}>
                {tutor.educationLevel === 'university' ? 'University Student' : 'A-Level Student'}
                {tutor.institutionName ? ` · ${tutor.institutionName}` : ''}
              </p>
              <p style={{ margin: '0.4rem 0', fontSize: '0.88rem' }}>
                <strong>Subjects:</strong> {tutor.subjects.map((s) => s.name).join(', ') || '—'}
              </p>
              <p style={{ fontSize: '0.88rem' }}>
                <strong>Year Groups:</strong> {tutor.yearGroups.map((y) => `Year ${y}`).join(', ') || '—'}
              </p>
              {dayNames && <p style={{ fontSize: '0.88rem' }}><strong>Available:</strong> {dayNames}</p>}
              <div className="mt-1"><Stars rating={tutor.averageRating} /></div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && renderPagination()}
    </Layout>
  );
}
