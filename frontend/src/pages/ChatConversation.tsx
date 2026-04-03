import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

const URL_REGEX = /https?:\/\/[^\s]+/g;

interface Message {
  id: string;
  content: string;
  senderId: string;
  messageType: 'text' | 'payment_request' | 'session_link';
  isRead: boolean;
  createdAt: string;
  paymentRequest?: {
    id: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
  };
}

function renderContent(content: string) {
  const parts = content.split(URL_REGEX);
  const urls = content.match(URL_REGEX) ?? [];
  const result: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    result.push(part);
    if (urls[i]) {
      result.push(
        <a key={i} href={urls[i]} target="_blank" rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}>
          {urls[i]}
        </a>
      );
    }
  });
  return result;
}

export default function ChatConversation() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [payError, setPayError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    if (!connectionId) return;
    api.get<{ messages: Message[] }>(`/api/messages/${connectionId}`)
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false));
  }, [connectionId]);

  // Socket.io
  useEffect(() => {
    if (!connectionId || !accessToken) return;

    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
      auth: { token: accessToken },
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', connectionId);
    });

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leave_room', connectionId);
      socket.disconnect();
    };
  }, [connectionId, accessToken]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !connectionId) return;
    setSending(true);
    try {
      const data = await api.post<{ message: Message }>(`/api/messages/${connectionId}`, { content: text });
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      setText('');
    } catch {
      // ignore — socket will deliver
    } finally {
      setSending(false);
    }
  }

  async function handlePaymentRequest(e: React.FormEvent) {
    e.preventDefault();
    setPayError('');
    if (!payAmount || parseFloat(payAmount) <= 0) { setPayError('Enter a valid amount.'); return; }
    setRequestingPayment(true);
    try {
      await api.post('/api/payment-requests', {
        connectionId,
        amount: parseFloat(payAmount),
      });
      setPayAmount('');
      // Refresh messages
      const data = await api.get<{ messages: Message[] }>(`/api/messages/${connectionId}`);
      setMessages(data.messages ?? []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPayError(e?.response?.data?.message ?? 'Failed to send payment request.');
    } finally {
      setRequestingPayment(false);
    }
  }

  async function handlePayNow(paymentRequestId: string) {
    try {
      const data = await api.post<{ sessionUrl: string }>('/api/payments/checkout', { paymentRequestId });
      window.location.href = data.sessionUrl;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e?.response?.data?.message ?? 'Failed to initiate payment.');
    }
  }

  if (loading) return <Layout><p className="text-muted">Loading…</p></Layout>;
  if (error) return <Layout><div className="alert alert-error">{error}</div></Layout>;

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/messages')}>
          ← Back
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Conversation</h1>
      </div>

      <div className="chat-container" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
              No messages yet. Say hello!
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            const isPaymentReq = msg.messageType === 'payment_request';

            if (isPaymentReq && msg.paymentRequest) {
              const pr = msg.paymentRequest;
              return (
                <div key={msg.id} className="chat-bubble payment" style={{ alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                  <p style={{ fontWeight: 600 }}>💳 Payment Request</p>
                  <p>Amount: <strong>£{(pr.amount / 100).toFixed(2)}</strong></p>
                  <p>Status: <span className={`badge ${pr.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{pr.status}</span></p>
                  {!isMine && pr.status === 'pending' && user?.role === 'customer' && (
                    <button className="btn btn-primary btn-sm mt-1" onClick={() => handlePayNow(pr.id)}>
                      Pay Now
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                {renderContent(msg.content)}
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Tutor payment request toolbar */}
        {user?.role === 'tutor' && (
          <form onSubmit={handlePaymentRequest}
            style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <label htmlFor="payAmount" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
              £
              <input id="payAmount" type="number" min="0.01" step="0.01" placeholder="Amount"
                value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                style={{ width: 100, padding: '0.35rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: 4 }} />
            </label>
            <button type="submit" className="btn btn-secondary btn-sm" disabled={requestingPayment}>
              {requestingPayment ? 'Sending…' : 'Request Payment'}
            </button>
            {payError && <span style={{ color: '#dc2626', fontSize: '0.85rem', alignSelf: 'center' }}>{payError}</span>}
          </form>
        )}

        {/* Message input */}
        <form onSubmit={handleSend} className="chat-input-row">
          <label htmlFor="chatInput" className="sr-only">Type a message</label>
          <input
            id="chatInput"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            autoComplete="off"
            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 4 }}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </Layout>
  );
}
