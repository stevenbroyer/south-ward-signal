'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminBadge, TypeBadge } from '@/components/admin/AdminBadge';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { formatDate } from '@/lib/utils';

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  qa_passed: boolean | null;
  word_count: number;
  created_at: string;
  published_at: string | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'failed', label: 'Failed' },
  { value: 'archived', label: 'Archived' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'match-recap', label: 'Match Recap' },
  { value: 'pre-match-preview', label: 'Preview' },
  { value: 'player-spotlight', label: 'Player Spotlight' },
  { value: 'power-rankings', label: 'Power Rankings' },
  { value: 'transfer-intel', label: 'Transfer Intel' },
  { value: 'stat-of-week', label: 'Stat of the Week' },
  { value: 'weekly-roundup', label: 'Weekly Roundup' },
];

const columns: Column<ArticleRow>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (row) => (
      <span className="text-sws-white font-medium line-clamp-1 max-w-xs">{row.title}</span>
    ),
  },
  { key: 'type', header: 'Type', render: (row) => <TypeBadge type={row.type} /> },
  { key: 'status', header: 'Status', render: (row) => <AdminBadge status={row.status} /> },
  {
    key: 'qa',
    header: 'QA',
    render: (row) =>
      row.qa_passed === null ? (
        <span className="text-sws-500">—</span>
      ) : row.qa_passed ? (
        <span className="text-success text-xs font-mono">PASS</span>
      ) : (
        <span className="text-red text-xs font-mono">FAIL</span>
      ),
  },
  {
    key: 'words',
    header: 'Words',
    className: 'text-right',
    render: (row) => <span className="font-mono text-xs text-sws-300">{row.word_count.toLocaleString()}</span>,
  },
  {
    key: 'date',
    header: 'Created',
    className: 'text-right',
    render: (row) => <span className="text-sws-400 text-xs font-mono">{formatDate(row.created_at)}</span>,
  },
];

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) params.set('status', status);
    if (type) params.set('type', type);

    try {
      const res = await fetch(`/api/admin/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, status, type]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, type]);

  if (loading && articles.length === 0) return <AdminLoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AdminSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <AdminSelect value={type} onChange={setType} options={TYPE_OPTIONS} />
        </div>
        <button
          onClick={() => router.push('/admin/articles/new')}
          className="px-4 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors"
        >
          + New Article
        </button>
      </div>

      <AdminCard>
        <AdminTable
          columns={columns}
          data={articles}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/admin/articles/${r.id}`)}
          emptyMessage="No articles match these filters"
        />
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      </AdminCard>
    </div>
  );
}
