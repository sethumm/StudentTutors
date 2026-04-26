import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

// ─── Landing page (logged out) ────────────────────────────────────────────────

function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef' }}>
      {/* Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0a66c2', letterSpacing: '-1px' }}>
          TutorConnect
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/login" style={{
            padding: '0.4rem 1.1rem', borderRadius: 24, border: '1px solid #0a66c2',
            color: '#0a66c2', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
          }}>Sign in</Link>
          <Link to="/register/customer" style={{
            padding: '0.4rem 1.1rem', borderRadius: 24, background: '#0a66c2',
            color: '#fff', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
          }}>Join now</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 1128, margin: '0 auto', padding: '3rem 1.5rem',
        display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 400px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#8f5849', lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Welcome to your<br />tutoring community
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '2rem', lineHeight: 1.6 }}>
            Connect with A-Level and University student tutors for Year 7–13. Affordable, qualified, and ready to help.
          </p>

          <div style={{ maxWidth: 380 }}>
            <Link to="/register/customer" style={{
              display: 'block', textAlign: 'center', padding: '0.75rem',
              borderRadius: 24, background: '#0a66c2', color: '#fff',
              fontWeight: 600, fontSize: '1rem', textDecoration: 'none', marginBottom: '0.75rem',
            }}>Join as a Student / Parent</Link>

            <Link to="/register/tutor" style={{
              display: 'block', textAlign: 'center', padding: '0.75rem',
              borderRadius: 24, border: '1px solid #666', color: '#333',
              fontWeight: 600, fontSize: '1rem', textDecoration: 'none', marginBottom: '1.5rem',
            }}>Join as a Tutor</Link>

            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
              Already on TutorConnect?{' '}
              <Link to="/login" style={{ color: '#0a66c2', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>

        {/* Illustration panel */}
        <div style={{
          flex: '1 1 300px', background: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)',
          borderRadius: 16, padding: '2.5rem', color: '#fff', minHeight: 320,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Why TutorConnect?
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2 }}>
            <li>✓ A-Level &amp; University student tutors</li>
            <li>✓ Lower fees than qualified teachers</li>
            <li>✓ LinkedIn-style connections</li>
            <li>✓ In-app messaging &amp; payments</li>
            <li>✓ Year 7 to A-Level coverage</li>
          </ul>
        </div>
      </div>

      {/* Subject strip */}
      <div style={{ background: '#fff', borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', padding: '1.5rem' }}>
        <div style={{ maxWidth: 1128, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem', fontWeight: 500 }}>
            Subjects available
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {['Maths', 'English', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography',
              'French', 'Spanish', 'Computer Science', 'Economics', 'Psychology'].map((s) => (
              <span key={s} style={{
                padding: '0.3rem 0.9rem', borderRadius: 999, background: '#e8f0fe',
                color: '#0a66c2', fontSize: '0.85rem', fontWeight: 500,
              }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1.5rem', color: '#888', fontSize: '0.8rem' }}>
        <Link to="/privacy" style={{ color: '#888', margin: '0 0.5rem' }}>Privacy Policy</Link>
        <Link to="/terms" style={{ color: '#888', margin: '0 0.5rem' }}>Terms of Service</Link>
        <span style={{ margin: '0 0.5rem' }}>© {new Date().getFullYear()} TutorConnect</span>
      </footer>
    </div>
  );
}

// ─── Feed (logged in) ─────────────────────────────────────────────────────────

interface Post {
  id: string;
  content: string;
  createdAt: string;
  tutor: {
    id: string;
    fullName: string;
    educationLevel: string;
    institutionName: string;
    subjects: string[];
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Feed() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get<{ posts: Post[]; totalPages: number }>(`/api/posts?page=${page}`)
      .then((data) => {
        setPosts(data.posts ?? []);
        setTotalPages(data.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const data = await api.post<Post>('/api/posts', { content: newPost });
      setPosts((prev) => [data, ...prev]);
      setNewPost('');
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post?')) return;
    await api.delete(`/api/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleLogout() {
    api.post('/api/auth/logout').catch(() => {});
    clearAuth();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef' }}>
      {/* Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0a66c2', letterSpacing: '-1px' }}>
          TutorConnect
        </span>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link to="/tutors" style={{ color: '#555', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Find Tutors</Link>
          {(user?.role === 'tutor' || user?.role === 'customer') && (
            <Link to="/messages" style={{ color: '#555', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Messages</Link>
          )}
          {user?.role === 'tutor' && (
            <Link to="/dashboard/tutor" style={{ color: '#555', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
          )}
          {user?.role === 'customer' && (
            <Link to="/dashboard/customer" style={{ color: '#555', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ color: '#555', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Admin</Link>
          )}
          <span style={{ color: '#333', fontSize: '0.85rem', fontWeight: 600 }}>{user?.email}</span>
          <button onClick={handleLogout} style={{
            padding: '0.3rem 0.9rem', borderRadius: 24, border: '1px solid #0a66c2',
            color: '#0a66c2', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1128, margin: '0 auto', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* Left sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #0a66c2, #004182)', height: 56 }} />
            <div style={{ padding: '0 1rem 1rem', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#0a66c2',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 700, margin: '-28px auto 0.5rem', border: '2px solid #fff',
              }}>
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{user?.email}</p>
              <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 2, textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
            <div style={{ borderTop: '1px solid #e0e0e0', padding: '0.75rem 1rem' }}>
              {user?.role === 'tutor' && (
                <Link to="/dashboard/tutor" style={{ display: 'block', color: '#0a66c2', fontSize: '0.85rem', textDecoration: 'none', padding: '0.3rem 0' }}>
                  Edit Profile
                </Link>
              )}
              <Link to="/tutors" style={{ display: 'block', color: '#0a66c2', fontSize: '0.85rem', textDecoration: 'none', padding: '0.3rem 0' }}>
                Find Tutors
              </Link>
              <Link to="/messages" style={{ display: 'block', color: '#0a66c2', fontSize: '0.85rem', textDecoration: 'none', padding: '0.3rem 0' }}>
                Messages
              </Link>
            </div>
          </div>
        </div>

        {/* Main feed */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Post composer (tutors only) */}
          {user?.role === 'tutor' && (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: '1rem', marginBottom: '1rem' }}>
              <form onSubmit={handlePost}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#0a66c2',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {user?.email?.[0]?.toUpperCase()}
                  </div>
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with students — subjects you teach, tips, availability..."
                    style={{
                      flex: 1, border: '1px solid #ccc', borderRadius: 24, padding: '0.6rem 1rem',
                      fontSize: '0.9rem', resize: 'none', minHeight: 60, fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" disabled={posting || !newPost.trim()} style={{
                    padding: '0.4rem 1.2rem', borderRadius: 24, background: '#0a66c2',
                    color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    opacity: (!newPost.trim() || posting) ? 0.5 : 1,
                  }}>
                    {posting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Posts */}
          {loading && <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Loading feed…</p>}

          {!loading && posts.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: '2rem', textAlign: 'center', color: '#666' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No posts yet.</p>
              {user?.role === 'tutor' && <p>Be the first to share something with students!</p>}
              {user?.role === 'customer' && <p>Tutors will post here once they join. <Link to="/tutors">Browse tutors</Link> to get started.</p>}
            </div>
          )}

          {posts.map((post) => (
            <div key={post.id} style={{
              background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0',
              padding: '1rem', marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Link to={`/tutors/${post.tutor.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', background: '#0a66c2',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.1rem',
                  }}>
                    {post.tutor.fullName[0]}
                  </div>
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Link to={`/tutors/${post.tutor.id}`} style={{ fontWeight: 600, color: '#000', textDecoration: 'none', fontSize: '0.95rem' }}>
                        {post.tutor.fullName}
                      </Link>
                      <p style={{ color: '#666', fontSize: '0.8rem', margin: '1px 0' }}>
                        {post.tutor.educationLevel === 'university' ? 'University Student' : 'A-Level Student'}
                        {post.tutor.institutionName ? ` · ${post.tutor.institutionName}` : ''}
                      </p>
                      {post.tutor.subjects.length > 0 && (
                        <p style={{ color: '#888', fontSize: '0.78rem', margin: 0 }}>
                          Teaches: {post.tutor.subjects.join(', ')}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#888', fontSize: '0.78rem' }}>{timeAgo(post.createdAt)}</span>
                      {user?.role === 'tutor' && (
                        <button onClick={() => handleDelete(post.id)} style={{
                          background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer',
                          fontSize: '0.8rem', padding: '0.1rem 0.3rem',
                        }}>✕</button>
                      )}
                    </div>
                  </div>
                  <p style={{ marginTop: '0.6rem', fontSize: '0.92rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#1a1a1a' }}>
                    {post.content}
                  </p>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
                    <Link to={`/tutors/${post.tutor.id}`} style={{
                      color: '#0a66c2', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                    }}>
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} style={{
                padding: '0.35rem 0.9rem', border: '1px solid #ccc', borderRadius: 4,
                background: '#fff', cursor: 'pointer', fontSize: '0.85rem',
              }}>← Prev</button>
              <span style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', color: '#555' }}>
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} style={{
                padding: '0.35rem 0.9rem', border: '1px solid #ccc', borderRadius: 4,
                background: '#fff', cursor: 'pointer', fontSize: '0.85rem',
              }}>Next →</button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: '#333' }}>
              Find a Tutor
            </h3>
            <Link to="/tutors" style={{
              display: 'block', textAlign: 'center', padding: '0.5rem',
              borderRadius: 24, background: '#0a66c2', color: '#fff',
              fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.5rem',
            }}>Browse All Tutors</Link>
            <Link to="/" style={{
              display: 'block', textAlign: 'center', padding: '0.5rem',
              borderRadius: 24, border: '1px solid #0a66c2', color: '#0a66c2',
              fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
            }}>Search by Subject</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuthStore();
  return user ? <Feed /> : <LandingPage />;
}
