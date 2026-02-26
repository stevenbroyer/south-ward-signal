'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminBadge, TypeBadge } from '@/components/admin/AdminBadge';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { formatDate } from '@/lib/utils';

interface OverviewData {
  articles: { total: number; published: number; draft: number; failed: number };
  social: { total: number; queued: number; posted: number; failed: number };
  matches: { finished: number };
  qaRate: number;
  recentArticles: Array<{
    id: string; title: string; slug: string; type: string;
    status: string; qa_passed: boolean | null; word_count: number;
    created_at: string; published_at: string | null;
  }>;
  upcomingMatches: Array<{
    id: string; date: string; home_team: string; away_team: string;
    status: string; venue: string;
  }>;
}

const articleColumns: Column<OverviewData['recentArticles'][number]>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (row) => (
      <span className="text-sws-white font-medium line-clamp-1">{row.title}</span>
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
    key: 'date',
    header: 'Created',
    className: 'text-right',
    render: (row) => <span className="text-sws-400 text-xs font-mono">{formatDate(row.created_at)}</span>,
  },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <AdminLoadingScreen />;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Articles" value={data.articles.total} detail={`${data.articles.published} published, ${data.articles.draft} drafts`} />
        <AdminStatCard label="Social Posts" value={data.social.total} detail={`${data.social.posted} posted, ${data.social.queued} queued`} />
        <AdminStatCard label="Matches" value={data.matches.finished} detail="finished matches" />
        <AdminStatCard label="QA Pass Rate" value={`${data.qaRate}%`} detail="articles with QA data" />
      </div>

      {/* Recent articles */}
      <AdminCard title="Recent Articles">
        <AdminTable
          columns={articleColumns}
          data={data.recentArticles}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/admin/articles/${r.id}`)}
          emptyMessage="No articles yet"
        />
      </AdminCard>

      {/* Bottom row: social summary + upcoming matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard title="Social Queue Summary">
          <div className="p-5 space-y-3">
            <StatRow label="Posted" value={data.social.posted} color="text-success" />
            <StatRow label="Queued" value={data.social.queued} color="text-blue-400" />
            <StatRow label="Failed" value={data.social.failed} color="text-red" />
          </div>
        </AdminCard>

        <AdminCard title="Upcoming Matches">
          <div className="p-5 space-y-3">
            {data.upcomingMatches.length === 0 ? (
              <p className="text-sws-400 text-sm">No upcoming matches</p>
            ) : (
              data.upcomingMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-sws-white">
                    {m.home_team} vs {m.away_team}
                  </span>
                  <span className="text-sws-400 text-xs font-mono">{formatDate(m.date)}</span>
                </div>
              ))
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-sws-300">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
