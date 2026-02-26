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
  home_xg: number | null;
  away_xg: number | null;
  status: string;
  venue: string;
  competition: string;
  article_count: number;
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
        {row.home_team} vs {row.away_team}
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
  {
    key: 'xg',
    header: 'xG',
    render: (row) =>
      row.home_xg !== null ? (
        <span className="font-mono text-xs text-sws-300">
          {Number(row.home_xg).toFixed(1)}–{Number(row.away_xg).toFixed(1)}
        </span>
      ) : (
        <span className="text-sws-500">—</span>
      ),
  },
  { key: 'status', header: 'Status', render: (row) => <AdminBadge status={row.status} /> },
  {
    key: 'articles',
    header: 'Articles',
    className: 'text-right',
    render: (row) => (
      <span className={`font-mono text-xs ${row.article_count > 0 ? 'text-success' : 'text-sws-500'}`}>
        {row.article_count}
      </span>
    ),
  },
];

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

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

  if (loading && matches.length === 0) return <AdminLoadingScreen />;

  return (
    <AdminCard>
      <AdminTable
        columns={columns}
        data={matches}
        rowKey={(r) => r.id}
        emptyMessage="No matches found"
      />
      <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} />
    </AdminCard>
  );
}
