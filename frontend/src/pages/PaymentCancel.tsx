import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function PaymentCancel() {
  return (
    <Layout>
      <div style={{ maxWidth: 480, textAlign: 'center', margin: '3rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h1 className="page-title" style={{ textAlign: 'center' }}>Payment Cancelled</h1>
        <p style={{ marginBottom: '1.5rem', color: '#374151' }}>
          Your payment was cancelled. No charge has been made. You can try again from the chat.
        </p>
        <Link to="/messages" className="btn btn-primary">Return to Messages</Link>
      </div>
    </Layout>
  );
}
