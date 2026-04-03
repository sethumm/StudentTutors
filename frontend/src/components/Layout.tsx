import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="layout">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <Link to="/" className="nav-logo">UK Tutor Marketplace</Link>
        <div className="nav-links">
          <Link to="/tutors">Find Tutors</Link>
          <Link to="/tutors">Browse All</Link>
          {user ? (
            <>
              {user.role === 'tutor' && <Link to="/dashboard/tutor">Dashboard</Link>}
              {user.role === 'customer' && <Link to="/dashboard/customer">Dashboard</Link>}
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              <Link to="/messages">Messages</Link>
              <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{user.email}</span>
              <button className="nav-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register/customer">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main className="layout-main" id="main-content">
        {children}
      </main>

      <footer className="footer" role="contentinfo">
        <p>
          &copy; {new Date().getFullYear()} UK Tutor Marketplace &nbsp;|&nbsp;
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}
