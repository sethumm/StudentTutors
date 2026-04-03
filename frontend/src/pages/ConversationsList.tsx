import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

interface Connection {
  id: string;
  status: string;
  tutor?: { id: string; fullName: string };
  customer?: { id: string; fullName: string };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string;
}

interface ConversationItem {
  connectionId: string;
  otherName: string;
  lastMessage: string;
  unreadCount: number;
}

export default function ConversationsList() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get<{ connections: Connection[] }>('/api/connections')
      .then(async (data) => {
        const accepted = (data.connections ?? []).filter((c) => c.status === 'accepted');
        const items = await Promise.all(
          accepted.map(async (c) => {
            const otherName = user.role === 'customer'
              ? (c.tutor?.fullName ?? 'Tutor')
              : (c.customer?.fullName ?? 'Customer');

            let lastMessage = 'No messages yet';
            let unreadCount = 0;
            try {
              const msgData = await api.get<{ messages: Message[] }>(`/api/messages/${c.id}`);
              const msgs = msgData.messages ?? [];
              if (msgs.length > 0) {
                lastMessage = msgs[msgs.length - 1].content.slice(0, 60) + (msgs[msgs.length - 1].content.length > 60 ? '…' : '');
              }
              unreadCount = msgs.filter((m) => !m.isRead && m.senderId !== user.id).length;
            } catch {
              // ignore
            }
            return { connectionId: c.id, otherName, lastMessage, unreadCount };
          })
        );
        setConversations(items);
      })
      .catch(() => setError('Failed to load conversations.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Layout><p className="text-muted">Loading…</p></Layout>;

  return (
    <Layout>
      <h1 className="page-title">Messages</h1>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {conversations.length === 0 ? (
        <p className="text-muted">No conversations yet. Connect with a tutor to start chatting.</p>
      ) : (
        <div>
          {conversations.map((conv) => (
            <Link key={conv.connectionId} to={`/messages/${conv.connectionId}`} className="card card-link">
              <div className="flex-between">
                <strong>{conv.otherName}</strong>
                {conv.unreadCount > 0 && (
                  <span className="badge badge-blue" aria-label={`${conv.unreadCount} unread messages`}>
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-muted" style={{ marginTop: 4, fontSize: '0.9rem' }}>{conv.lastMessage}</p>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
