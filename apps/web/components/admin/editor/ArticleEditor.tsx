'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen';
import { RichTextEditor } from './RichTextEditor';
import { AIFormatModal } from './AIFormatModal';
import { markdownToHtml } from '@/lib/markdown';
import { ARTICLE_TYPES } from '@/lib/article-types';

interface ArticleEditorProps {
  mode: 'new' | 'edit';
  articleId?: string;
}

export function ArticleEditor({ mode, articleId }: ArticleEditorProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(mode === 'edit');
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

  // AI state
  const [showFormat, setShowFormat] = useState(false);
  const [aiBusy, setAiBusy] = useState('');
  const [aiError, setAiError] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (mode !== 'edit' || !articleId) return;
    fetch(`/api/admin/articles/${articleId}`)
      .then((r) => r.json())
      .then((data) => {
        const a = data.article;
        if (!a) {
          setError('Failed to load article');
          return;
        }
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
  }, [mode, articleId]);

  const wordCount = body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0;

  // ---- AI assist helper ----
  const callAssist = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const res = await fetch('/api/admin/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, body, title, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      return data.result;
    },
    [body, title],
  );

  async function runAssist(action: 'title' | 'excerpt' | 'seo' | 'tags') {
    setAiError('');
    setAiBusy(action);
    try {
      const result = await callAssist(action);
      if (action === 'title') {
        setTitleSuggestions(Array.isArray(result) ? result : []);
      } else if (action === 'excerpt') {
        setExcerpt(typeof result === 'string' ? result : '');
      } else if (action === 'seo') {
        setSeoTitle(result?.seo_title || '');
        setSeoDescription(result?.seo_description || '');
      } else if (action === 'tags') {
        const suggested: string[] = Array.isArray(result) ? result : [];
        const existing = tags.split(',').map((t) => t.trim()).filter(Boolean);
        const merged = Array.from(new Set([...existing, ...suggested]));
        setTags(merged.join(', '));
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setAiBusy('');
    }
  }

  const handleRewrite = useCallback(
    async (selected: string): Promise<string | null> => {
      setAiError('');
      try {
        const result = await callAssist('rewrite', { selection: selected });
        return typeof result === 'string' && result ? result : null;
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'AI rewrite failed');
        return null;
      }
    },
    [callAssist],
  );

  // ---- Save ----
  async function save(status: 'draft' | 'published') {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      body: body.trim(),
      excerpt: excerpt.trim(),
      type,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      featured_image: featuredImage.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      status,
    };

    try {
      const url = mode === 'edit' ? `/api/admin/articles/${articleId}` : '/api/admin/articles';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save article.');
        setSaving(false);
        return;
      }
      const data = await res.json();
      const id = mode === 'edit' ? articleId : data.article?.id;
      router.push(`/admin/articles/${id}`);
    } catch {
      setError('Network error. Try again.');
      setSaving(false);
    }
  }

  if (loading) return <AdminLoadingScreen />;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-sws-white">
          {mode === 'edit' ? 'Edit Article' : 'New Article'}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-sws-500">{wordCount.toLocaleString()} words</span>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-sws-600/50 rounded text-sws-400 hover:text-sws-white hover:border-sws-400 transition-colors"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 text-red text-sm mb-6">
          {error}
        </div>
      )}
      {aiError && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-400 text-sm mb-6 flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError('')} className="text-yellow-400/70 hover:text-yellow-300 ml-3">×</button>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest">Title</label>
            <AIButton
              label="Title ideas"
              busy={aiBusy === 'title'}
              disabled={!body.trim()}
              onClick={() => runAssist('title')}
            />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-3 text-sws-white text-lg font-display font-bold focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
          />
          {titleSuggestions.length > 0 && (
            <div className="mt-2 space-y-1 bg-bg-card border border-sws-700/40 rounded-lg p-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-xs font-mono text-sws-500 uppercase tracking-widest">AI suggestions</span>
                <button onClick={() => setTitleSuggestions([])} className="text-sws-500 hover:text-sws-300 text-xs">dismiss</button>
              </div>
              {titleSuggestions.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setTitle(t); setTitleSuggestions([]); }}
                  className="block w-full text-left px-3 py-2 text-sm text-sws-200 hover:bg-bg-elevated hover:text-sws-white rounded transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">Type</label>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest">Tags</label>
              <AIButton label="Suggest" busy={aiBusy === 'tags'} disabled={!body.trim()} onClick={() => runAssist('tags')} />
            </div>
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest">Excerpt</label>
            <AIButton label="Generate" busy={aiBusy === 'excerpt'} disabled={!body.trim()} onClick={() => runAssist('excerpt')} />
          </div>
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
          <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">Featured Image URL</label>
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-elevated border border-sws-700/50 rounded-lg px-4 py-2.5 text-sws-white text-sm focus:outline-none focus:border-red/50 transition-colors placeholder:text-sws-600"
          />
          {featuredImage && (
            <div className="mt-2 rounded-lg overflow-hidden border border-sws-700/30 max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="border border-sws-700/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-sws-500 uppercase tracking-widest">SEO</h3>
            <AIButton label="Generate SEO" busy={aiBusy === 'seo'} disabled={!body.trim()} onClick={() => runAssist('seo')} />
          </div>
          <div>
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">SEO Title</label>
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
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest mb-2">SEO Description</label>
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono text-sws-400 uppercase tracking-widest">Body</label>
            <button
              type="button"
              onClick={() => setShowFormat(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded bg-red/10 border border-red/30 text-red hover:bg-red/20 transition-colors"
            >
              ✨ AI Draft Builder
            </button>
          </div>
          {preview ? (
            <div className="border border-sws-700/50 rounded-lg bg-bg-elevated px-6 py-5 min-h-[440px]">
              {body.trim() ? (
                <div className="article-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(body) }} />
              ) : (
                <p className="text-sws-600 text-sm">Nothing to preview yet.</p>
              )}
            </div>
          ) : (
            <RichTextEditor
              value={body}
              onChange={setBody}
              onRewriteRequest={handleRewrite}
              placeholder="Write your article here, or paste raw text into the AI Draft Builder above…"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-sws-700/30">
          {mode === 'new' ? (
            <>
              <button
                type="button"
                onClick={() => save('draft')}
                disabled={saving}
                className="px-5 py-2.5 bg-bg-elevated border border-sws-600/50 text-sws-white text-sm font-semibold rounded-lg hover:border-sws-400 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={() => save('published')}
                disabled={saving}
                className="px-5 py-2.5 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={saving}
              className="px-5 py-2.5 bg-red text-white text-sm font-semibold rounded-lg hover:bg-red/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push(mode === 'edit' ? `/admin/articles/${articleId}` : '/admin/articles')}
            className="px-5 py-2.5 text-sws-400 text-sm hover:text-sws-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <AIFormatModal
        open={showFormat}
        type={type}
        hasExistingBody={body.trim().length > 0}
        onClose={() => setShowFormat(false)}
        onInsert={(md) => setBody(md)}
      />
    </div>
  );
}

function AIButton({
  label,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      title={disabled ? 'Write some body text first' : `AI: ${label}`}
      className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded border border-sws-600/50 text-sws-400 hover:text-red hover:border-red/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {busy ? '…' : `✨ ${label}`}
    </button>
  );
}
