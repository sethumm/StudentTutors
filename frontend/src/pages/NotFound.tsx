import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div style={{ maxWidth: 480, textAlign: 'center', margin: '3rem auto' }}>
        <div style={{ fontSize: '4rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.5rem' }}>404</div>
        <h1 className="page-title" style={{ textAlign: 'center' }}>Page Not Found</h1>
        <p style={{ marginBottom: '1.5rem', color: '#374151' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">Go to Home</Link>
      </div>
    </Layout>
  );
}
