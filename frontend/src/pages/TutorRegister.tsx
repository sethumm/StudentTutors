import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];

// Hardcoded subject list — avoids dependency on /api/subjects during registration
const STATIC_SUBJECTS = [
  '11 Plus (11+)',
  'Mathematics',
  'Further Mathematics',
  'English Language',
  'English Literature',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
  'French',
  'Spanish',
  'German',
  'Computer Science',
  'Economics',
  'Business Studies',
  'Psychology',
  'Sociology',
  'Art',
  'Religious Studies',
  'Music',
  'Drama',
  'Physical Education',
  'Design and Technology',
  'Media Studies',
  'Law',
  'Politics',
  'Accounting',
  'Latin',
];

interface SubjectOption {
  id: string;
  name: string;
}

interface SubjectEntry {
  subjectId: string;
  level: 'gcse' | 'a_level' | 'both';
}

export default function TutorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    educationLevel: 'a_level' as 'a_level' | 'university',
    institutionName: '',
    bio: '',
    hourlyRate: '',
    location: '',
  });
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>(
    STATIC_SUBJECTS.map((name) => ({ id: name, name }))
  );
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [yearGroups, setYearGroups] = useState<number[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Try to load real subject IDs from API, fall back to static list
  useState(() => {
    api.get<{ subjects: SubjectOption[] }>('/api/subjects')
      .then((data) => {
        if (data.subjects && data.subjects.length > 0) {
          setAvailableSubjects(data.subjects);
        }
      })
      .catch(() => { /* keep static list */ });
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleSubject(subjectId: string) {
    setSubjects((prev) => {
      const exists = prev.find((s) => s.subjectId === subjectId);
      if (exists) return prev.filter((s) => s.subjectId !== subjectId);
      return [...prev, { subjectId, level: 'gcse' as const }];
    });
  }

  function setSubjectLevel(subjectId: string, level: 'gcse' | 'a_level' | 'both') {
    setSubjects((prev) => prev.map((s) => s.subjectId === subjectId ? { ...s, level } : s));
  }

  function toggleYearGroup(yg: number) {
    setYearGroups((prev) =>
      prev.includes(yg) ? prev.filter((y) => y !== yg) : [...prev, yg]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!acceptedTerms) { setError('You must accept the Terms of Service and Privacy Policy.'); return; }
    if (subjects.length === 0) { setError('Please select at least one subject.'); return; }
    if (yearGroups.length === 0) { setError('Please select at least one year group.'); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/register/tutor', {
        ...form,
        hourlyRate: parseFloat(form.hourlyRate),
        subjects,
        yearGroups,
        acceptedTerms,
      });
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; details?: { message: string }[] } } };
      const details = e?.response?.data?.details;
      setError(details ? details.map((d) => d.message).join(', ') : (e?.response?.data?.error ?? 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h1 className="page-title">Register as a Tutor</h1>
      <div style={{ maxWidth: 640 }}>
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
            <label htmlFor="educationLevel">Education Level *</label>
            <select id="educationLevel" name="educationLevel" value={form.educationLevel}
              onChange={handleChange} required>
              <option value="a_level">A-Level</option>
              <option value="university">University</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="institutionName">School / University Name *</label>
            <input id="institutionName" name="institutionName" type="text" value={form.institutionName}
              onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" value={form.bio} onChange={handleChange}
              placeholder="Tell students about yourself, your experience, and teaching style..." />
          </div>

          <div className="form-group">
            <label htmlFor="hourlyRate">Hourly Rate (£) *</label>
            <input id="hourlyRate" name="hourlyRate" type="number" min="1" step="0.01"
              value={form.hourlyRate} onChange={handleChange} required />
          </div>

          {/* Subjects */}
          <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '1rem', marginBottom: '1rem' }}>
            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Subjects * (select at least one)</legend>
            {availableSubjects.length === 0 && (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Loading subjects...</p>
            )}
            {availableSubjects.map((subj) => {
              const entry = subjects.find((s) => s.subjectId === subj.id);
              return (
                <div key={subj.id} style={{ marginBottom: '0.5rem' }}>
                  <div className="form-check">
                    <input type="checkbox" id={`subj-${subj.id}`}
                      checked={!!entry} onChange={() => toggleSubject(subj.id)} />
                    <label htmlFor={`subj-${subj.id}`}>{subj.name}</label>
                    {entry && (
                      <select aria-label={`Level for ${subj.name}`} value={entry.level}
                        onChange={(e) => setSubjectLevel(subj.id, e.target.value as 'gcse' | 'a_level' | 'both')}
                        style={{ marginLeft: '0.5rem', padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}>
                        <option value="gcse">GCSE</option>
                        <option value="a_level">A-Level</option>
                        <option value="both">Both</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </fieldset>

          {/* Year Groups */}
          <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '1rem', marginBottom: '1rem' }}>
            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Year Groups * (select at least one)</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {YEAR_GROUPS.map((yg) => (
                <div key={yg} className="form-check">
                  <input type="checkbox" id={`yg-${yg}`}
                    checked={yearGroups.includes(yg)} onChange={() => toggleYearGroup(yg)} />
                  <label htmlFor={`yg-${yg}`}>Year {yg}</label>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="form-check" style={{ marginBottom: '1rem' }}>
            <input type="checkbox" id="acceptedTerms" checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)} required />
            <label htmlFor="acceptedTerms">
              I accept the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link> *
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering…' : 'Create Tutor Account'}
          </button>

          <p className="mt-2 text-muted">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
}
