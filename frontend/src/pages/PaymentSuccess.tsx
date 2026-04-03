import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function PaymentSuccess() {
  return (
    <Layout>
      <div style={{ maxWidth: 480, textAlign: 'center', margin: '3rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h1 className="page-title" style={{ textAlign: 'center' }}>Payment Successful!</h1>
        <p style={{ marginBottom: '1.5rem', color: '#374151' }}>
          Your payment has been processed successfully. Your tutor has been notified.
        </p>
        <Link to="/messages" className="btn btn-primary">Return to Messages</Link>
      </div>
    </Layout>
  );
}
