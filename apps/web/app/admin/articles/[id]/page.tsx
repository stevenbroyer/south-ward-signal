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
        <div className="flex items-center gap-3 mb-2">
          <TypeBadge type={article.type} />
          <AdminBadge status={article.status} />
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
