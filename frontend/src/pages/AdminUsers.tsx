import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  isActive: boolean;
  fullName: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  function fetchUsers() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    api.get<{ users: AdminUser[] }>(`/api/admin/users?${params}`)
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusToggle(userId: string, currentlyActive: boolean) {
    setActionError('');
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { isActive: !currentlyActive });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !currentlyActive } : u));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionError(e?.response?.data?.message ?? 'Failed to update user status.');
    }
  }

  return (
    <Layout>
      <h1 className="page-title">User Management</h1>

      {/* Filters */}
      <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label htmlFor="search" style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: '0.9rem' }}>Search</label>
          <input id="search" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email…"
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 4 }} />
        </div>
        <div>
          <label htmlFor="roleFilter" style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: '0.9rem' }}>Role</label>
          <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 4 }}>
            <option value="">All Roles</option>
            <option value="tutor">Tutor</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button type="submit" className="btn btn-primary">Search</button>
        </div>
      </form>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {actionError && <div className="alert alert-error" role="alert">{actionError}</div>}
      {loading && <p className="text-muted">Loading…</p>}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email Verified</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName || '—'}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-blue">{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{u.emailVerified ? '✓' : '✗'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => handleStatusToggle(u.id, u.isActive)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
