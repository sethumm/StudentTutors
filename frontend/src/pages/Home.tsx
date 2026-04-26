import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];

interface TutorResult {
  id: string;
  fullName: string;
  educationLevel: string;
  institutionName: string;
  hourlyRate: number;
  bio: string;
  subjects: { name: string; level: string }[];
  yearGroups: number[];
  availability: { daysAvailable: number[] };
  averageRating: number | null;
  reviewCount: number;
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-muted" style={{ fontSize: '0.85rem' }}>No reviews yet</span>;
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

function TutorCard({ tutor }: { tutor: TutorResult }) {
  const dayNames = (tutor.availability?.daysAvailable ?? []).map((d) => DAYS[d]).join(', ');
  return (
    <Link to={`/tutors/${tutor.id}`} className="card card-link">
      <div className="flex-between">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{tutor.fullName}</h2>
        <span style={{ fontWeight: 700, color: '#2563eb' }}>£{tutor.hourlyRate}/hr</span>
      </div>
      <p className="text-muted" style={{ marginTop: 2 }}>
        {tutor.educationLevel === 'university' ? 'University Student' : 'A-Level Student'}
        {tutor.institutionName ? ` · ${tutor.institutionName}` : ''}
      </p>
      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
        <strong>Subjects:</strong>{' '}
        {tutor.subjects.map((s) => `${s.name} (${s.level})`).join(', ') || '—'}
      </p>
      <p style={{ fontSize: '0.9rem' }}>
        <strong>Year Groups:</strong>{' '}
        {tutor.yearGroups.map((y) => `Year ${y}`).join(', ') || '—'}
      </p>
      {dayNames && (
        <p style={{ fontSize: '0.9rem' }}>
          <strong>Available:</strong> {dayNames}
        </p>
      )}
      <div className="mt-1">
        <Stars rating={tutor.averageRating} />
      </div>
    </Link>
  );
}

export default function Home() {
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [day, setDay] = useState('');
  const [results, setResults] = useState<TutorResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (yearGroup) params.set('yearGroup', yearGroup);
      if (day) params.set('day', day);
      const data = await api.get<{ tutors: TutorResult[] }>(`/api/tutors/search?${params}`);
      setResults(data.tutors ?? []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="hero" style={{ margin: '-2rem -1rem 2rem', borderRadius: 0 }}>
        <h1>Find affordable tutors from A-Level and University students</h1>
        <p>Connect with qualified tutors for Year 7–13 across all major UK curriculum subjects.</p>

        <form onSubmit={handleSearch} role="search" aria-label="Search for tutors">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Subject (e.g. Maths, Biology…)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Subject"
            />
            <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} aria-label="Year group">
              <option value="">All Year Groups</option>
              {YEAR_GROUPS.map((yg) => (
                <option key={yg} value={yg}>Year {yg}</option>
              ))}
            </select>
            <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Day of week">
              <option value="">Any Day</option>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {searched && results !== null && (
        <section aria-label="Search results">
          {results.length === 0 ? (
            <div className="alert alert-info">
              No tutors found for your search. Try broadening your criteria — remove the year group or day filter, or try a different subject.
            </div>
          ) : (
            <>
              <h2 className="section-title">{results.length} tutor{results.length !== 1 ? 's' : ''} found</h2>
              <div className="grid-2">
                {results.map((t) => <TutorCard key={t.id} tutor={t} />)}
              </div>
            </>
          )}
        </section>
      )}

      {!searched && (
        <section>
          <h2 className="section-title">Browse all tutors</h2>
          <p className="text-muted">
            Use the search above to find tutors, or <Link to="/tutors">browse all available tutors</Link>.
          </p>
        </section>
      )}
    </Layout>
  );
}
