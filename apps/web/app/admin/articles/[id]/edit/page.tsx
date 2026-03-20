'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';

const ARTICLE_TYPES = [
  { value: 'match-recap', label: 'Match Recap' },
  { value: 'pre-match-preview', label: 'Pre-Match Preview' },
  { value: 'player-spotlight', label: 'Player Spotlight' },
  { value: 'tactical-analysis', label: 'Tactical Analysis' },
  { value: 'transfer-intel', label: 'Transfer Intel' },
  { value: 'stat-of-week', label: 'Stat of the Week' },
  { value: 'weekly-roundup', label: 'Weekly Roundup' },
  { value: 'opinion', label: 'Opinion' },
];

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  type: string;
  tags: string[];
  featured_image: string | null;
  seo_title: string;
  seo_description: string;
  status: string;
}

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [type, setType] = useState('match-recap');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const a: ArticleData = data.article;
        setTitle(a.title || '');
        setBody(a.body || '');
        setExcerpt(a.excerpt || '');
        setType(a.type || 'match-recap');
        setTags((a.tags || []).join(', '));
        setFeaturedImage(a.featured_image || '');
        setSeoTitle(a.seo_title || '');
        setSeoDescription(a.seo_description || '');
      })
      .catch(() => setError('Failed to load article'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          excerpt: excerpt.trim(),
          type,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          featured_image: featuredImage.trim() || null,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save article.');
        setSaving(false);
        return;
      }

      router.push(`/admin/articles/${id}`);
    } catch {
      setError('Network error. Try again.');
      setSaving(false);
    }
  }

  if (loading) return <AdminLoadingScreen />;

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-sws-white">Edit Article</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-sws-600/50 rounded text-sws-400 hover:text-sws-white hover:border-sws-400 transition-colors"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <span className="text-xs font-mono text-sws-500">{wordCount.toLocaleString()} words</span>
        </div>
      </div>

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 text-red text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-3 text-sws-white text-lg font-display font-bold focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors"
              >
                {ARTICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="rbny, mls, match-recap"
                className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for article cards and SEO"
              rows={2}
              className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-3 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600 resize-none"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
              Featured Image URL
            </label>
            <input
              type="text"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
            />
            {featuredImage && (
              <div className="mt-2 rounded-lg overflow-hidden border border-sws-700/30 max-h-48">
                <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* SEO Fields */}
          <div className="border border-sws-700/30 rounded-lg p-4 space-y-4">
            <h3 className="text-xs font-mono text-sws-500 uppercase tracking-widest">SEO</h3>
            <div>
              <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Custom title for search engines (defaults to article title)"
                maxLength={60}
                className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
              />
              <span className="text-xs font-mono text-sws-600 mt-1 block">{seoTitle.length}/60</span>
            </div>
            <div>
              <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
                SEO Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Custom description for search engines (defaults to excerpt)"
                rows={2}
                maxLength={160}
                className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-3 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600 resize-none"
              />
              <span className="text-xs font-mono text-sws-600 mt-1 block">{seoDescription.length}/160</span>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">
              Body (Markdown)
            </label>
            {preview ? (
              <div
                className="article-content bg-bg-elevated border border-sws-700/50 rounded-lg px-6 py-4 min-h-[400px] prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your article in Markdown..."
                rows={20}
                className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-3 text-sws-white text-sm font-mono leading-relaxed focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600 resize-y"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-sws-700/30">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin/articles/${id}`)}
              className="px-5 py-2.5 text-sws-400 text-sm hover:text-sws-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
