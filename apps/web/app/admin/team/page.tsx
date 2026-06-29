'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { formatDate } from '@/lib/utils';

interface TeamUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_self: boolean;
}

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Add-user form
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Per-row state
  const [pwEditId, setPwEditId] = useState('');
  const [pwValue, setPwValue] = useState('');
  const [busyId, setBusyId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load team');
        return;
      }
      setUsers(data.users || []);
    } catch {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  }

  async function createUser() {
    setError('');
    if (!newEmail.trim() || newPassword.length < 8) {
      setError('Enter an email and a password of at least 8 characters.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }
      flash(`Added ${data.user.email}`);
      setNewEmail('');
      setNewPassword('');
      setShowAdd(false);
      await load();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setCreating(false);
    }
  }

  async function savePassword(id: string) {
    setError('');
    if (pwValue.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update password');
        return;
      }
      flash('Password updated');
      setPwEditId('');
      setPwValue('');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusyId('');
    }
  }

  async function deleteUser(id: string) {
    setError('');
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete user');
        return;
      }
      flash('User removed');
      setConfirmDeleteId('');
      await load();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <AdminLoadingScreen />;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-display font-bold text-sws-white">Team</h1>
        <button
          onClick={() => { setShowAdd((s) => !s); setError(''); }}
          className="px-4 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add admin'}
        </button>
      </div>
      <p className="text-sws-400 text-sm mb-6">
        Admins can log in, manage articles, and manage this team. Everyone here has full access.
      </p>

      {notice && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm mb-4">
          {notice}
        </div>
      )}
      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 text-red text-sm mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red/70 hover:text-red ml-3">×</button>
        </div>
      )}

      {/* Add user form */}
      {showAdd && (
        <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="text-sm font-mono text-sws-400 uppercase tracking-widest">New admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              autoComplete="off"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
              className="bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
            />
            <input
              type="text"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Temporary password (min 8 chars)"
              className="bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600 font-mono"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={createUser}
              disabled={creating}
              className="px-5 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create admin'}
            </button>
            <span className="text-xs text-sws-500">They can change this password after logging in.</span>
          </div>
        </div>
      )}

      {/* User list */}
      <div className="bg-bg-card border border-sws-700/50 rounded-xl divide-y divide-sws-700/40">
        {users.map((u) => (
          <div key={u.id} className="p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sws-white font-medium truncate">{u.email}</span>
                  {u.is_self && (
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-red/15 text-red px-1.5 py-0.5 rounded">you</span>
                  )}
                </div>
                <div className="text-xs font-mono text-sws-500 mt-1">
                  Added {formatDate(u.created_at)} · Last login {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : 'never'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setPwEditId(pwEditId === u.id ? '' : u.id); setPwValue(''); setConfirmDeleteId(''); setError(''); }}
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-sws-600/50 rounded text-sws-400 hover:text-sws-white hover:border-sws-400 transition-colors"
                >
                  {u.is_self ? 'Change my password' : 'Set password'}
                </button>
                {!u.is_self && (
                  <button
                    onClick={() => { setConfirmDeleteId(confirmDeleteId === u.id ? '' : u.id); setPwEditId(''); setError(''); }}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-red/30 rounded text-red/70 hover:text-red hover:border-red/60 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Inline password editor */}
            {pwEditId === u.id && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  autoComplete="new-password"
                  value={pwValue}
                  onChange={(e) => setPwValue(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="flex-1 min-w-[220px] bg-bg-elevated border border-sws-700/50 rounded-lg px-3 py-2 text-sws-white text-sm font-mono focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
                />
                <button
                  onClick={() => savePassword(u.id)}
                  disabled={busyId === u.id}
                  className="px-4 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
                >
                  {busyId === u.id ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setPwEditId(''); setPwValue(''); }} className="px-3 py-2 text-sws-400 text-sm hover:text-sws-white">
                  Cancel
                </button>
              </div>
            )}

            {/* Delete confirm */}
            {confirmDeleteId === u.id && (
              <div className="mt-3 bg-red/5 border border-red/30 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sws-200 text-sm">Remove <strong className="text-sws-white">{u.email}</strong>? They lose access immediately.</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={busyId === u.id}
                    className="px-4 py-1.5 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
                  >
                    {busyId === u.id ? 'Removing…' : 'Yes, remove'}
                  </button>
                  <button onClick={() => setConfirmDeleteId('')} className="px-3 py-1.5 text-sws-400 text-sm hover:text-sws-white">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-sws-500 text-sm">No admins found.</div>
        )}
      </div>
    </div>
  );
}
