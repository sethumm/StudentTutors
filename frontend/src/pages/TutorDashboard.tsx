import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const SUBJECTS = [
  'Mathematics', 'English Language', 'English Literature', 'Biology', 'Chemistry',
  'Physics', 'History', 'Geography', 'French', 'Spanish', 'German',
  'Computer Science', 'Economics', 'Business Studies', 'Psychology', 'Sociology', 'Art',
];
const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

interface SubjectEntry { name: string; level: 'gcse' | 'a-level' | 'both'; }
interface AvailSlot { dayOfWeek: number; startHour: number; }

interface TutorProfileData {
  id: string;
  fullName: string;
  educationLevel: string;
  institutionName: string;
  bio: string;
  hourlyRate: number;
  subjects: SubjectEntry[];
  yearGroups: number[];
  availability: AvailSlot[];
}

export default function TutorDashboard() {
  const { user } = useAuthStore();
  const [profileId, setProfileId] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [yearGroups, setYearGroups] = useState<number[]>([]);
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [availSuccess, setAvailSuccess] = useState('');
  const [availError, setAvailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<TutorProfileData>(`/api/tutors/${user.id}`)
      .then((data) => {
        setProfileId(data.id);
        setBio(data.bio ?? '');
        setHourlyRate(String(data.hourlyRate ?? ''));
        setInstitutionName(data.institutionName ?? '');
        setSubjects(data.subjects ?? []);
        setYearGroups(data.yearGroups ?? []);
        const slots = new Set<string>(
          (data.availability ?? []).map((a) => `${a.dayOfWeek}-${a.startHour}`)
        );
        setAvailability(slots);
      })
      .catch(() => setProfileError('Failed to load profile.'))
      .finally(() => setProfileLoading(false));
  }, [user]);

  function toggleSubject(name: string) {
    setSubjects((prev) => {
      const exists = prev.find((s) => s.name === name);
      if (exists) return prev.filter((s) => s.name !== name);
      return [...prev, { name, level: 'gcse' }];
    });
  }

  function setSubjectLevel(name: string, level: 'gcse' | 'a-level' | 'both') {
    setSubjects((prev) => prev.map((s) => s.name === name ? { ...s, level } : s));
  }

  function toggleYearGroup(yg: number) {
    setYearGroups((prev) => prev.includes(yg) ? prev.filter((y) => y !== yg) : [...prev, yg]);
  }

  function toggleSlot(day: number, hour: number) {
    const key = `${day}-${hour}`;
    setAvailability((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSaving(true);
    try {
      await api.put(`/api/tutors/${profileId}/profile`, {
        bio, hourlyRate: parseFloat(hourlyRate), institutionName, subjects, yearGroups,
      });
      setProfileSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setProfileError(e?.response?.data?.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailSave(e: React.FormEvent) {
    e.preventDefault();
    setAvailError('');
    setAvailSuccess('');
    setSavingAvail(true);
    try {
      const slots: AvailSlot[] = [];
      availability.forEach((key) => {
        const [day, hour] = key.split('-').map(Number);
        slots.push({ dayOfWeek: day, startHour: hour });
      });
      await api.put(`/api/tutors/${profileId}/availability`, { slots });
      setAvailSuccess('Availability saved successfully.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAvailError(e?.response?.data?.message ?? 'Failed to save availability.');
    } finally {
      setSavingAvail(false);
    }
  }

  if (profileLoading) return <Layout><p className="text-muted">Loading…</p></Layout>;

  return (
    <Layout>
      <h1 className="page-title">Tutor Dashboard</h1>

      {/* Profile Edit */}
      <section className="card" aria-labelledby="profile-section">
        <h2 id="profile-section" className="section-title">Edit Profile</h2>
        {profileError && <div className="alert alert-error" role="alert">{profileError}</div>}
        {profileSuccess && <div className="alert alert-success" role="alert">{profileSuccess}</div>}

        <form onSubmit={handleProfileSave}>
          <div className="form-group">
            <label htmlFor="institutionName">School / University Name</label>
            <input id="institutionName" type="text" value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about yourself…" />
          </div>

          <div className="form-group">
            <label htmlFor="hourlyRate">Hourly Rate (£)</label>
            <input id="hourlyRate" type="number" min="1" step="0.01" value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)} />
          </div>

          {/* Subjects */}
          <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '1rem', marginBottom: '1rem' }}>
            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Subjects</legend>
            {SUBJECTS.map((subj) => {
              const entry = subjects.find((s) => s.name === subj);
              return (
                <div key={subj} style={{ marginBottom: '0.4rem' }}>
                  <div className="form-check">
                    <input type="checkbox" id={`subj-${subj}`} checked={!!entry}
                      onChange={() => toggleSubject(subj)} />
                    <label htmlFor={`subj-${subj}`}>{subj}</label>
                    {entry && (
                      <select aria-label={`Level for ${subj}`} value={entry.level}
                        onChange={(e) => setSubjectLevel(subj, e.target.value as 'gcse' | 'a-level' | 'both')}
                        style={{ marginLeft: '0.5rem', padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}>
                        <option value="gcse">GCSE</option>
                        <option value="a-level">A-Level</option>
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
            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Year Groups</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {YEAR_GROUPS.map((yg) => (
                <div key={yg} className="form-check">
                  <input type="checkbox" id={`yg-${yg}`} checked={yearGroups.includes(yg)}
                    onChange={() => toggleYearGroup(yg)} />
                  <label htmlFor={`yg-${yg}`}>Year {yg}</label>
                </div>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </section>

      {/* Availability Grid */}
      <section className="card" aria-labelledby="avail-section">
        <h2 id="avail-section" className="section-title">Availability</h2>
        <p className="text-muted mb-2">Check the boxes for times you are available to tutor.</p>
        {availError && <div className="alert alert-error" role="alert">{availError}</div>}
        {availSuccess && <div className="alert alert-success" role="alert">{availSuccess}</div>}

        <form onSubmit={handleAvailSave}>
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
                    {DAYS.map((d, di) => {
                      const key = `${di}-${h}`;
                      return (
                        <td key={di}>
                          <input
                            type="checkbox"
                            checked={availability.has(key)}
                            onChange={() => toggleSlot(di, h)}
                            aria-label={`${d} ${String(h).padStart(2, '0')}:00`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className="btn btn-primary mt-2" disabled={savingAvail}>
            {savingAvail ? 'Saving…' : 'Save Availability'}
          </button>
        </form>
      </section>
    </Layout>
  );
}
