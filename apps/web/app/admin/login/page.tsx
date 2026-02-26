'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/admin');
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-sws-white">
            South Ward Signal
          </h1>
          <p className="text-sws-400 text-sm mt-1">Admin Dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-card border border-sws-700/50 rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red/10 border border-red/30 rounded-lg px-3 py-2 text-red text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-3 py-2 text-sws-white text-sm
                focus:outline-none focus:border-red/50 transition-colors"
              placeholder="admin@southwardsignal.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-3 py-2 text-sws-white text-sm
                focus:outline-none focus:border-red/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red hover:bg-red/90 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 text-sm
              transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
