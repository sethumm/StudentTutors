import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];

interface TutorSummary {
  id: string;
  fullName: string;
  educationLevel: string;
  institutionName: string;
  location: string | null;
  hourlyRate: string;
  subjects: { name: string; level: string }[];
  yearGroups: number[];
  availability: { daysAvailable: number[] };
  averageRating: number | null;
  reviewCount: number;
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span style={{ color: '#888', fontSize: '0.82rem' }}>No reviews</span>;
  const full = Math.round(rating);
  return (
    <span>
      <span style={{ color: '#f59e0b' }} aria-label={`${rating} out of 5 stars`}>
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      </span>
      <span style={{ color: '#666', marginLeft: 4, fontSize: '0.82rem' }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function TutorCard({ tutor }: { tutor: TutorSummary }) {
  const dayNames = (tutor.availability?.daysAvailable ?? []).map((d) => DAYS[d]).join(', ');
  return (
    <Link to={`/tutors/${tutor.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
        padding: '1.1rem', transition: 'box-shadow 0.15s',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#0891b2',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
            }}>
              {tutor.fullName[0]}
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{tutor.fullName}</h2>
              <p style={{ color: '#555', fontSize: '0.82rem', margin: '2px 0' }}>
                {tutor.educationLevel === 'university' ? 'University Student' : 'A-Level Student'}
                {tutor.institutionName ? ` · ${tutor.institutionName}` : ''}
              </p>
              {tutor.location && (
                <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>📍 {tutor.location}</p>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontWeight: 700, color: '#0891b2', fontSize: '1.1rem', margin: 0 }}>£{tutor.hourlyRate}/hr</p>
            <Stars rating={tutor.averageRating} />
          </div>
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {tutor.subjects.slice(0, 5).map((s) => (
            <span key={s.name} style={{
              padding: '0.15rem 0.6rem', borderRadius: 999, background: '#e8f0fe',
              color: '#0891b2', fontSize: '0.78rem', fontWeight: 500,
            }}>{s.name}</span>
          ))}
          {tutor.subjects.length > 5 && (
            <span style={{ color: '#888', fontSize: '0.78rem', alignSelf: 'center' }}>+{tutor.subjects.length - 5} more</span>
          )}
        </div>

        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {tutor.yearGroups.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#555' }}>
              <strong>Years:</strong> {tutor.yearGroups.map((y) => `Y${y}`).join(', ')}
            </span>
          )}
          {dayNames && (
            <span style={{ fontSize: '0.8rem', color: '#555' }}>
              <strong>Available:</strong> {dayNames}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TutorListing() {
  const [tutors, setTutors] = useState<TutorSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Filters
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [day, setDay] = useState('');
  const [minRating, setMinRating] = useState('');
  const [location, setLocation] = useState('');

  function buildParams(p = page) {
    const params = new URLSearchParams();
    if (subject.trim()) params.set('subject', subject.trim());
    if (yearGroup) params.set('yearGroup', yearGroup);
    if (day) params.set('day', day);
    if (minRating) params.set('minRating', minRating);
    if (location.trim()) params.set('location', location.trim());
    params.set('page', String(p));
    return params.toString();
  }

  function fetchTutors(p = 1) {
    setLoading(true);
    setError('');
    const hasFilters = subject || yearGroup || day || minRating || location;
    const endpoint = hasFilters
      ? `/api/tutors/search?${buildParams(p)}`
      : `/api/tutors?page=${p}`;

    api.get<{ tutors: TutorSummary[]; totalPages?: number; total?: number }>(endpoint)
      .then((data) => {
        setTutors(data.tutors ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? data.tutors?.length ?? 0);
      })
      .catch(() => setError('Failed to load tutors. Please try again.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTutors(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
    setPage(1);
    fetchTutors(1);
  }

  function handlePageChange(p: number) {
    setPage(p);
    fetchTutors(p);
    window.scrollTo(0, 0);
  }

  return (
    <Layout>
      <h1 className="page-title">Find a Tutor</h1>

      {/* Search filters */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Maths, Biology…"
                style={{ width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Year Group</label>
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }}>
                <option value="">All Years</option>
                {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>Year {yg}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Day Available</label>
              <select value={day} onChange={(e) => setDay(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }}>
                <option value="">Any Day</option>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Min Rating</label>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }}>
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ ★★★★★</option>
                <option value="4">4.0+ ★★★★</option>
                <option value="3">3.0+ ★★★</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. London, Manchester…"
                style={{ width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{
              padding: '0.5rem 1.5rem', borderRadius: 24, background: '#0891b2',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
            }}>Search</button>
            <button type="button" onClick={() => {
              setSubject(''); setYearGroup(''); setDay(''); setMinRating(''); setLocation('');
              setSearched(false); setPage(1); fetchTutors(1);
            }} style={{
              padding: '0.5rem 1.2rem', borderRadius: 24, background: '#f3f2ef',
              color: '#555', border: '1px solid #ccc', cursor: 'pointer', fontSize: '0.9rem',
            }}>Clear</button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Loading tutors…</p>}

      {!loading && tutors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p style={{ fontSize: '1.1rem' }}>No tutors found.</p>
          <p style={{ fontSize: '0.9rem' }}>Try removing some filters to broaden your search.</p>
        </div>
      )}

      {!loading && tutors.length > 0 && (
        <p style={{ color: '#555', fontSize: '0.88rem', marginBottom: '1rem' }}>
          {searched ? `${total} tutor${total !== 1 ? 's' : ''} found` : `${total} tutor${total !== 1 ? 's' : ''} available`}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {tutors.map((tutor) => <TutorCard key={tutor.id} tutor={tutor} />)}
      </div>

      {totalPages > 1 && (
        <nav style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }} aria-label="Pagination">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} style={{
            padding: '0.35rem 0.9rem', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer',
          }}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => handlePageChange(p)} aria-current={p === page ? 'page' : undefined} style={{
              padding: '0.35rem 0.75rem', border: '1px solid #ccc', borderRadius: 4,
              background: p === page ? '#0891b2' : '#fff', color: p === page ? '#fff' : '#333', cursor: 'pointer',
            }}>{p}</button>
          ))}
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} style={{
            padding: '0.35rem 0.9rem', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer',
          }}>Next →</button>
        </nav>
      )}
    </Layout>
  );
}
