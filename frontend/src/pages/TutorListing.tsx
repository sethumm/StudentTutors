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
  hourlyRate: string;
  subjects: { name: string; level: string }[];
  yearGroups: number[];
  availability: { daysAvailable: number[] };
  averageRating: number | null;
  reviewCount: number;
}

export default function TutorListing() {
  const [tutors, setTutors] = useState<TutorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [day, setDay] = useState('');
  const [minRating, setMinRating] = useState('');

  function load(p: number, s: string, yg: string, d: string, mr: string) {
    setLoading(true);
    setError('');

    let url: string;
    const hasFilters = s || yg || d || mr;

    if (hasFilters) {
      const params = new URLSearchParams();
      if (s) params.set('subject', s);
      if (yg) params.set('yearGroup', yg);
      if (d) params.set('day', d);
      if (mr) params.set('minRating', mr);
      url = `/api/tutors/search?${params.toString()}`;
    } else {
      url = `/api/tutors?page=${p}`;
    }

    api.get<{ tutors: TutorSummary[]; totalPages?: number; total?: number }>(url)
      .then((data) => {
        setTutors(data.tutors ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? data.tutors?.length ?? 0);
      })
      .catch(() => setError('Failed to load tutors. Please try again.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1, '', '', '', ''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1, subject, yearGroup, day, minRating);
  }

  function handleClear() {
    setSubject('');
    setYearGroup('');
    setDay('');
    setMinRating('');
    setPage(1);
    load(1, '', '', '', '');
  }

  function handlePageChange(p: number) {
    setPage(p);
    load(p, subject, yearGroup, day, minRating);
    window.scrollTo(0, 0);
  }

  return (
    <Layout>
      <h1 className="page-title">Find a Tutor</h1>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Subject</label>
              <input
                type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Maths, Biology…"
                style={{ padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem', width: 160 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Year Group</label>
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)}
                style={{ padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }}>
                <option value="">All Years</option>
                {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>Year {yg}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Day Available</label>
              <select value={day} onChange={(e) => setDay(e.target.value)}
                style={{ padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }}>
                <option value="">Any Day</option>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>Min Rating</label>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)}
                style={{ padding: '0.45rem 0.7rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.9rem' }}>
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ ★★★★★</option>
                <option value="4">4.0+ ★★★★</option>
                <option value="3">3.0+ ★★★</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: 24, background: '#0891b2', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Search
            </button>
            <button type="button" onClick={handleClear} style={{ padding: '0.5rem 1rem', borderRadius: 24, background: '#f0f9ff', border: '1px solid #ccc', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading tutors…</p>}

      {!loading && !error && tutors.length === 0 && (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No tutors found. Try removing some filters.</p>
      )}

      {!loading && tutors.length > 0 && (
        <p style={{ color: '#555', fontSize: '0.88rem', marginBottom: '1rem' }}>
          {total} tutor{total !== 1 ? 's' : ''} available
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {tutors.map((t) => (
          <Link key={t.id} to={`/tutors/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: '1rem', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{t.fullName}</h2>
                  <p style={{ color: '#555', fontSize: '0.82rem', margin: '2px 0' }}>
                    {t.educationLevel === 'university' ? 'University Student' : 'A-Level Student'}
                    {t.institutionName ? ` · ${t.institutionName}` : ''}
                  </p>
                </div>
                <strong style={{ color: '#0891b2', whiteSpace: 'nowrap' }}>£{t.hourlyRate}/hr</strong>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {t.subjects.slice(0, 4).map((s) => (
                  <span key={s.name} style={{ padding: '0.1rem 0.5rem', borderRadius: 999, background: '#e0f2fe', color: '#0891b2', fontSize: '0.78rem' }}>
                    {s.name}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.4rem' }}>
                Years: {t.yearGroups.map((y) => `Y${y}`).join(', ') || '—'}
              </p>
              {t.averageRating !== null && (
                <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.2rem' }}>
                  {'★'.repeat(Math.round(t.averageRating))} {t.averageRating.toFixed(1)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
            style={{ padding: '0.35rem 0.9rem', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>
            ← Prev
          </button>
          <span style={{ padding: '0.35rem 0.75rem', color: '#555' }}>{page} / {totalPages}</span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
            style={{ padding: '0.35rem 0.9rem', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      )}
    </Layout>
  );
}
