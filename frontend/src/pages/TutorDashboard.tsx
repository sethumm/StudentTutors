import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';

const YEAR_GROUPS = [7, 8, 9, 10, 11, 12, 13];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

interface SubjectOption { id: string; name: string; }
interface SubjectEntry { subjectId: string; level: 'gcse' | 'a_level' | 'both'; }
interface AvailSlot { dayOfWeek: number; startHour: number; }
interface ConnectionRequest {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  customer: { fullName: string };
}

interface TutorProfileData {
  id: string;
  bio: string;
  hourlyRate: string;
  institutionName: string;
  subjects: { subjectId: string; subjectName: string; level: string }[];
  yearGroups: number[];
  availability: AvailSlot[];
}

export default function TutorDashboard() {
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
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
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

export default function TutorDashboard() {
  const [profileId, setProfileId] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
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
    Promise.all([
      api.get<TutorProfileData>('/api/tutors/me'),
      api.get<{ subjects: SubjectOption[] }>('/api/subjects'),
      api.get<{ connections: ConnectionRequest[] }>('/api/connections'),
    ])
      .then(([profileData, subjectData, connData]) => {
        setProfileId(profileData.id);
        setBio(profileData.bio ?? '');
        setHourlyRate(String(profileData.hourlyRate ?? ''));
        setInstitutionName(profileData.institutionName ?? '');
        setSubjects(
          (profileData.subjects ?? []).map((s) => ({
            subjectId: s.subjectId,
            level: s.level as 'gcse' | 'a_level' | 'both',
          }))
        );
        setYearGroups(profileData.yearGroups ?? []);
        setAvailability(
          new Set((profileData.availability ?? []).map((a) => `${a.dayOfWeek}-${a.startHour}`))
        );
        setAvailableSubjects(subjectData.subjects ?? []);
        setConnections(connData.connections ?? []);
      })
      .catch(() => setProfileError('Failed to load profile.'))
      .finally(() => setProfileLoading(false));
  }, []);

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

  async function handleConnectionAction(connectionId: string, action: 'accept' | 'decline') {
    setActionLoading(connectionId);
    try {
      await api.patch(`/api/connections/${connectionId}`, { action });
      setConnections((prev) => prev.map((c) =>
        c.id === connectionId ? { ...c, status: action === 'accept' ? 'accepted' : 'declined' } : c
      ));
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
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
      const e = err as { response?: { data?: { error?: string } } };
      setProfileError(e?.response?.data?.error ?? 'Failed to save profile.');
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
      const e = err as { response?: { data?: { error?: string } } };
      setAvailError(e?.response?.data?.error ?? 'Failed to save availability.');
    } finally {
      setSavingAvail(false);
    }
  }

  if (profileLoading) return <Layout><p className="text-muted">Loading…</p></Layout>;

  return (
    <Layout>
      <h1 className="page-title">Tutor Dashboard</h1>

      {/* Connection Requests */}
      <section className="card" aria-labelledby="connections-section" style={{ marginBottom: '1.5rem' }}>
        <h2 id="connections-section" className="section-title">Connection Requests</h2>
        {connections.length === 0 && <p className="text-muted">No connection requests yet.</p>}
        {connections.map((conn) => (
          <div key={conn.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0',
          }}>
            <div>
              <strong>{conn.customer.fullName}</strong>
              <span className={`badge ml-2 ${
                conn.status === 'pending' ? 'badge-yellow' :
                conn.status === 'accepted' ? 'badge-green' : 'badge-red'
              }`} style={{ marginLeft: '0.5rem' }}>
                {conn.status}
              </span>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                {new Date(conn.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {conn.status === 'pending' && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading === conn.id}
                    onClick={() => handleConnectionAction(conn.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={actionLoading === conn.id}
                    onClick={() => handleConnectionAction(conn.id, 'decline')}
                  >
                    Decline
                  </button>
                </>
              )}
              {conn.status === 'accepted' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/messages/${conn.id}`)}
                >
                  Open Chat
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

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

          <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '1rem', marginBottom: '1rem' }}>
            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Subjects</legend>
            {availableSubjects.map((subj) => {
              const entry = subjects.find((s) => s.subjectId === subj.id);
              return (
                <div key={subj.id} style={{ marginBottom: '0.4rem' }}>
                  <div className="form-check">
                    <input type="checkbox" id={`subj-${subj.id}`} checked={!!entry}
                      onChange={() => toggleSubject(subj.id)} />
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
                    {DAYS.map((d, di) => (
                      <td key={di}>
                        <input type="checkbox" checked={availability.has(`${di}-${h}`)}
                          onChange={() => toggleSlot(di, h)}
                          aria-label={`${d} ${String(h).padStart(2, '0')}:00`} />
                      </td>
                    ))}
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
