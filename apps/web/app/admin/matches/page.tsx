'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  recap_id: string | null;
}

export default function AdminMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [draftingId, setDraftingId] = useState('');
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

  async function draftRecap(fixtureId: string) {
    setDraftingId(fixtureId);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin/articles/draft-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtureId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Recap drafting failed.');
        return;
      }
      if (data.articleId) {
        router.push(`/admin/articles/${data.articleId}/edit`);
        return;
      }
      setNotice(data.skipped || 'Done.');
      await fetchMatches();
    } catch {
      setError('Network error while drafting.');
    } finally {
      setDraftingId('');
    }
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
          <span className="font-mono text-sws-white">{row.home_score}–{row.away_score}</span>
        ) : (
          <span className="text-sws-500">—</span>
        ),
    },
    { key: 'status', header: 'Status', render: (row) => <AdminBadge status={row.status} /> },
    {
      key: 'recap',
      header: 'Recap',
      className: 'text-right',
      render: (row) => {
        if (row.status !== 'finished') return <span className="text-sws-600 text-xs">—</span>;
        if (row.recap_id) {
          return (
            <button
              onClick={() => router.push(`/admin/articles/${row.recap_id}/edit`)}
              className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider border border-sws-600/50 rounded text-sws-300 hover:text-sws-white hover:border-sws-400 transition-colors"
            >
              View recap
            </button>
          );
        }
        return (
          <button
            onClick={() => draftRecap(row.id)}
            disabled={draftingId === row.id}
            className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded border border-red/30 text-red hover:bg-red/10 hover:border-red/60 disabled:opacity-50 transition-colors"
          >
            {draftingId === row.id ? 'Drafting…' : '✨ Draft recap'}
          </button>
        );
      },
    },
  ];

  if (loading && matches.length === 0) return <AdminLoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sws-400 text-sm">
          NYRB fixtures &amp; results, synced free from ESPN. Draft an AI recap for any finished match.
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
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2.5 text-green-400 text-sm">{notice}</div>
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
