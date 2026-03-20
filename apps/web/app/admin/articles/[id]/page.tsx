'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import { AdminBadge, TypeBadge } from '@/components/admin/AdminBadge';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { QAResultCard } from '@/components/admin/QAResultCard';
import { formatDate } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  excerpt: string;
  html_body: string;
  ghost_url: string | null;
  seo_title: string;
  seo_description: string;
  word_count: number;
  qa_passed: boolean | null;
  qa_result: Record<string, unknown> | null;
  social_content: Record<string, unknown> | null;
  tags: string[];
  created_at: string;
  published_at: string | null;
}

interface SocialPost {
  id: string;
  platform: string;
  content: Record<string, unknown>;
  status: string;
  scheduled_for: string;
  posted_at: string | null;
  error_message: string | null;
}

const socialColumns: Column<SocialPost>[] = [
  {
    key: 'platform',
    header: 'Platform',
    render: (row) => <span className="capitalize text-sws-white text-xs font-mono">{row.platform}</span>,
  },
  {
    key: 'content',
    header: 'Content',
    render: (row) => {
      const text = (row.content as { text?: string })?.text ?? JSON.stringify(row.content).slice(0, 80);
      return <span className="text-sws-300 text-xs line-clamp-1 max-w-sm">{text}</span>;
    },
  },
  { key: 'status', header: 'Status', render: (row) => <AdminBadge status={row.status} /> },
  {
    key: 'scheduled',
    header: 'Scheduled',
    className: 'text-right',
    render: (row) => <span className="text-sws-400 text-xs font-mono">{formatDate(row.scheduled_for)}</span>,
  },
];

export default function AdminArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setArticle(data.article);
        setSocialPosts(data.socialPosts ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const { article: updated } = await res.json();
        setArticle(updated);
      }
    } catch {}
    setActionLoading('');
  }

  async function handleDelete() {
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/articles');
        return;
      }
    } catch {}
    setActionLoading('');
    setShowDeleteConfirm(false);
  }

  if (loading) return <AdminLoadingScreen />;
  if (!article) {
    return (
      <div className="text-center py-16">
        <p className="text-sws-400">Article not found</p>
        <button onClick={() => router.push('/admin/articles')} className="text-red text-sm mt-2 hover:underline">
          Back to articles
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <button onClick={() => router.push('/admin/articles')} className="text-sws-400 text-sm hover:text-sws-white transition-colors">
        &larr; Back to articles
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <TypeBadge type={article.type} />
            <AdminBadge status={article.status} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/admin/articles/${id}/edit`)}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-sws-600/50 rounded text-sws-400 hover:text-sws-white hover:border-sws-400 transition-colors"
            >
              Edit
            </button>
            {article.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('published')}
                disabled={!!actionLoading}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-red text-white rounded hover:bg-red/90 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'published' ? 'Publishing...' : 'Publish'}
              </button>
            )}
            {article.status === 'published' && (
              <button
                onClick={() => handleStatusChange('draft')}
                disabled={!!actionLoading}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-sws-600/50 rounded text-sws-400 hover:text-sws-white hover:border-sws-400 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'draft' ? 'Unpublishing...' : 'Unpublish'}
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-red/30 rounded text-red/70 hover:text-red hover:border-red/60 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold text-sws-white">{article.title}</h2>
        <p className="text-sws-400 text-sm mt-1">{article.excerpt}</p>
        <div className="flex items-center gap-4 mt-3 text-xs font-mono text-sws-400">
          <span>{article.word_count.toLocaleString()} words</span>
          <span>Created {formatDate(article.created_at)}</span>
          {article.published_at && <span>Published {formatDate(article.published_at)}</span>}
          {article.ghost_url && (
            <a href={article.ghost_url} target="_blank" rel="noopener noreferrer" className="text-red hover:underline">
              View on Ghost
            </a>
          )}
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs bg-bg-elevated border border-sws-700/50 rounded px-2 py-0.5 text-sws-300">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red/5 border border-red/30 rounded-lg p-4">
          <p className="text-sws-white text-sm mb-3">Are you sure you want to delete this article? This cannot be undone.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
              className="px-4 py-2 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sws-400 text-sm hover:text-sws-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* QA Results */}
      <QAResultCard
        qaResult={article.qa_result as { score?: number; checks?: Array<{ name: string; passed: boolean; message?: string }>; bannedPhrases?: string[]; readability?: number } | null}
        qaPassed={article.qa_passed}
      />

      {/* Social Posts */}
      <AdminCard title="Social Posts">
        <AdminTable
          columns={socialColumns}
          data={socialPosts}
          rowKey={(r) => r.id}
          emptyMessage="No social posts linked to this article"
        />
      </AdminCard>

      {/* HTML Preview */}
      {article.html_body && (
        <AdminCard title="Article Preview">
          <div
            className="p-5 prose prose-invert prose-sm max-w-none article-content"
            dangerouslySetInnerHTML={{ __html: article.html_body }}
          />
        </AdminCard>
      )}
    </div>
  );
}
