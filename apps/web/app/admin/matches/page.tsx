'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { formatDate } from '@/lib/utils';

interface MatchRow {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

const columns: Column<MatchRow>[] = [
  {
    key: 'date',
    header: 'Date',
    render: (row) => <span className="text-sws-white text-xs font-mono">{formatDate(row.date)}</span>,
  },
  {
    key: 'teams',
    header: 'Match',
    render: (row) => (
      <span className="text-sws-white text-sm">
        {row.home_team} <span className="text-sws-500">vs</span> {row.away_team}
      </span>
    ),
  },
  {
    key: 'score',
    header: 'Score',
    render: (row) =>
      row.home_score !== null ? (
        <span className="font-mono text-sws-white">
          {row.home_score}–{row.away_score}
        </span>
      ) : (
        <span className="text-sws-500">—</span>
      ),
  },
  { key: 'status', header: 'Status', render: (row) => <AdminBadge status={row.status} /> },
];

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    try {
      const res = await fetch(`/api/admin/matches?${params}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  async function syncNow() {
    setSyncing(true);
    setNotice('');
    setError('');
    try {
      const res = await fetch('/api/admin/matches/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sync failed.');
        return;
      }
      const fixtures = (data.results || []).find((r: string) => r.startsWith('fixtures:'));
      setNotice(`Synced from ESPN${fixtures ? ` — ${fixtures.replace('fixtures:', '').trim()} fixtures` : ''}.`);
      if (page !== 1) setPage(1);
      else await fetchMatches();
    } catch {
      setError('Network error during sync.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading && matches.length === 0) return <AdminLoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sws-400 text-sm">
          NYRB fixtures &amp; results, synced free from ESPN. Auto-refreshes every 3 hours.
        </p>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="px-4 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {syncing ? 'Syncing…' : '↻ Sync now'}
        </button>
      </div>

      {notice && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 text-green-400 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-2.5 text-red text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red/70 hover:text-red ml-3">×</button>
        </div>
      )}

      <AdminCard>
        <AdminTable
          columns={columns}
          data={matches}
          rowKey={(r) => r.id}
          emptyMessage="No matches found — hit Sync now."
        />
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      </AdminCard>
    </div>
  );
}
