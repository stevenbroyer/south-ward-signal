'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminBadge } from '@/components/admin/AdminBadge';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSelect } from '@/components/admin/AdminSelect';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { formatDate } from '@/lib/utils';

interface SocialRow {
  id: string;
  article_id: string;
  platform: string;
  content: { text?: string; [key: string]: unknown };
  status: string;
  scheduled_for: string;
  posted_at: string | null;
  error_message: string | null;
  retry_count: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'posted', label: 'Posted' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PLATFORM_OPTIONS = [
  { value: '', label: 'All platforms' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'bluesky', label: 'Bluesky' },
];

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<SocialRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) params.set('status', status);
    if (platform) params.set('platform', platform);

    try {
      const res = await fetch(`/api/admin/social?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, status, platform]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [status, platform]);

  async function handleAction(id: string, action: 'retry' | 'cancel') {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/social/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchPosts();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<SocialRow>[] = [
    {
      key: 'platform',
      header: 'Platform',
      render: (row) => (
        <span className="capitalize text-sws-white text-xs font-mono">{row.platform}</span>
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (row) => (
        <span className="text-sws-300 text-xs line-clamp-2 max-w-md">
          {row.content?.text ?? '—'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <AdminBadge status={row.status} /> },
    {
      key: 'scheduled',
      header: 'Scheduled',
      render: (row) => <span className="text-sws-400 text-xs font-mono">{formatDate(row.scheduled_for)}</span>,
    },
    {
      key: 'posted',
      header: 'Posted',
      render: (row) => row.posted_at
        ? <span className="text-sws-400 text-xs font-mono">{formatDate(row.posted_at)}</span>
        : <span className="text-sws-500">—</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => {
        const isLoading = actionLoading === row.id;
        if (row.status === 'failed') {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(row.id, 'retry'); }}
              disabled={isLoading}
              className="text-xs text-red hover:underline disabled:opacity-50"
            >
              {isLoading ? '…' : 'Retry'}
            </button>
          );
        }
        if (row.status === 'queued') {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(row.id, 'cancel'); }}
              disabled={isLoading}
              className="text-xs text-sws-400 hover:text-red hover:underline disabled:opacity-50"
            >
              {isLoading ? '…' : 'Cancel'}
            </button>
          );
        }
        return null;
      },
    },
  ];

  if (loading && posts.length === 0) return <AdminLoadingScreen />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AdminSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <AdminSelect value={platform} onChange={setPlatform} options={PLATFORM_OPTIONS} />
      </div>

      <AdminCard>
        <AdminTable
          columns={columns}
          data={posts}
          rowKey={(r) => r.id}
          emptyMessage="No social posts match these filters"
        />
        <AdminPagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      </AdminCard>
    </div>
  );
}
