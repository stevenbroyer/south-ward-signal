'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';

interface AnalyticsData {
  articlesByType: Array<{ type: string; count: number }>;
  articlesByWeek: Array<{ week: string; count: number }>;
  socialByPlatform: Array<{ platform: string; posted: number; failed: number; queued: number }>;
  qaByWeek: Array<{ week: string; passed: number; failed: number }>;
  wordCounts: Array<{ type: string; wordCount: number }>;
}

const TYPE_COLORS: Record<string, string> = {
  'match-recap': '#ED1A3D',
  'pre-match-preview': '#3B82F6',
  'player-spotlight': '#D4A843',
  'power-rankings': '#8B5CF6',
  'transfer-intel': '#22C55E',
  'stat-of-week': '#F59E0B',
  'weekly-roundup': '#EC4899',
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  tiktok: '#00F2EA',
  bluesky: '#0085FF',
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#111114', border: '1px solid #1E1E24', borderRadius: '8px' },
  labelStyle: { color: '#A0A0AC' },
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoadingScreen />;
  if (!data) return <AdminEmptyState message="Failed to load analytics" icon="analytics" />;

  const hasArticles = data.articlesByType.length > 0;
  const hasSocial = data.socialByPlatform.length > 0;

  // Compute avg word counts by type
  const wordCountByType: Record<string, { total: number; count: number }> = {};
  for (const wc of data.wordCounts) {
    if (!wordCountByType[wc.type]) wordCountByType[wc.type] = { total: 0, count: 0 };
    wordCountByType[wc.type].total += wc.wordCount;
    wordCountByType[wc.type].count++;
  }
  const avgWordCounts = Object.entries(wordCountByType).map(([type, { total, count }]) => ({
    type: type.replace(/-/g, ' '),
    avg: Math.round(total / count),
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Articles by type + Articles over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard title="Articles by Type">
          {hasArticles ? (
            <div className="p-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.articlesByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ type, count }) => `${(type as string).replace(/-/g, ' ')} (${count})`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {data.articlesByType.map((entry) => (
                      <Cell key={entry.type} fill={TYPE_COLORS[entry.type] ?? '#6E6E7A'} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState message="No article data" icon="articles" />
          )}
        </AdminCard>

        <AdminCard title="Articles Over Time">
          {data.articlesByWeek.length > 0 ? (
            <div className="p-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.articlesByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                  <XAxis dataKey="week" tick={{ fill: '#6E6E7A', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6E6E7A', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#ED1A3D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState message="No timeline data" icon="analytics" />
          )}
        </AdminCard>
      </div>

      {/* Row 2: Social success rates + QA trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard title="Social Post Success Rate">
          {hasSocial ? (
            <div className="p-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.socialByPlatform} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                  <XAxis type="number" tick={{ fill: '#6E6E7A', fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="platform" tick={{ fill: '#6E6E7A', fontSize: 11 }} width={80} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="posted" name="Posted" fill="#22C55E" stackId="a" />
                  <Bar dataKey="failed" name="Failed" fill="#ED1A3D" stackId="a" />
                  <Bar dataKey="queued" name="Queued" fill="#3B82F6" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState message="No social data" icon="social" />
          )}
        </AdminCard>

        <AdminCard title="QA Pass/Fail Trend">
          {data.qaByWeek.length > 0 ? (
            <div className="p-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.qaByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                  <XAxis dataKey="week" tick={{ fill: '#6E6E7A', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6E6E7A', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="passed" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="failed" stroke="#ED1A3D" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState message="No QA data" icon="analytics" />
          )}
        </AdminCard>
      </div>

      {/* Row 3: Word count averages */}
      <AdminCard title="Average Word Count by Type">
        {avgWordCounts.length > 0 ? (
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgWordCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
                <XAxis dataKey="type" tick={{ fill: '#6E6E7A', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#6E6E7A', fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="avg" name="Avg Words" fill="#D4A843" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <AdminEmptyState message="No word count data" icon="articles" />
        )}
      </AdminCard>
    </div>
  );
}
