import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-auth';
import { TagBadge } from '@/components/articles/TagBadge';
import { ArticleRow } from '@/components/articles/ArticleRow';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { ReadingProgress } from '@/components/articles/ReadingProgress';
import { TableOfContents } from '@/components/articles/TableOfContents';
import { SocialShare } from '@/components/articles/SocialShare';
import { MatchRecapCover } from '@/components/articles/MatchRecapCover';
import { PlayerRatingsCover } from '@/components/articles/PlayerRatingsCover';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const db = createAdminClient();
  const { data: article, error } = await db
    .from('articles')
    .select('title, excerpt, featured_image, type')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !article) return { title: 'Article Not Found — South Ward Signal' };

  const ogImage = article.featured_image
    || `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'https://southwardsignal.com' : 'http://localhost:3000'}/api/og?title=${encodeURIComponent(article.title)}&type=${encodeURIComponent(article.type || '')}`;

  return {
    title: `${article.title} — South Ward Signal`,
    description: article.excerpt || '',
    openGraph: {
      title: article.title,
      description: article.excerpt || '',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || '',
      images: [ogImage],
    },
  };
}

function addHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(/<(h[23])(.*?)>(.*?)<\/h[23]>/gi, (_match, tag, attrs, content) => {
    const text = content.replace(/<[^>]*>/g, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `heading-${counter++}`;
    return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
  });
}

export default async function ArticlePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const db = createAdminClient();

  const { data: article, error } = await db
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    notFound();
  }

  // Fetch related articles
  const { data: latestArticles } = await db
    .from('articles')
    .select('slug, title, type, published_at')
    .eq('status', 'published')
    .neq('slug', params.slug)
    .order('published_at', { ascending: false })
    .limit(4);

  const related = (latestArticles ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    primary_tag: a.type || 'Article',
    published_at: a.published_at || '',
  }));

  const primaryTag = article.type || '';
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const readingTime = Math.max(1, Math.round((article.word_count || 0) / 250));
  const articleHtml = article.html_body ? addHeadingIds(article.html_body) : '';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <ReadingProgress />

      <div className="max-w-container mx-auto px-6">
        {/* Breadcrumb */}
        <RevealOnScroll>
          <nav className="flex items-center gap-2 text-xs font-mono text-sws-500 mb-8">
            <Link href="/" className="hover:text-sws-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-sws-white transition-colors">Articles</Link>
            <span>/</span>
            <span className="text-sws-400 truncate max-w-[200px]">{article.title}</span>
          </nav>
        </RevealOnScroll>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-12">
          {/* Main Content */}
          <article>
            <RevealOnScroll>
              {primaryTag && (
                <div className="mb-4">
                  <TagBadge tag={primaryTag} />
                </div>
              )}

              <h1 className="font-display font-black text-3xl md:text-5xl text-sws-white leading-[1.08] mb-6">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-sws-500 mb-8">
                <div className="flex items-center gap-4">
                  {date && <time>{date}</time>}
                  <span className="w-1 h-1 rounded-full bg-sws-600" />
                  <span>{readingTime} min read</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-sws-600" />
                <SocialShare title={article.title} slug={params.slug} />
              </div>
            </RevealOnScroll>

            {/* Featured Image or Match Recap Cover */}
            {article.featured_image ? (
              <RevealOnScroll className="mb-10">
                <div className="relative overflow-hidden rounded-xl aspect-[16/9]">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </RevealOnScroll>
            ) : article.type === 'match-recap' ? (
              <RevealOnScroll className="mb-10">
                <MatchRecapCover
                  title={article.title}
                  className="rounded-xl aspect-[16/9] border border-sws-700/50"
                />
              </RevealOnScroll>
            ) : article.type === 'player-ratings' ? (
              <RevealOnScroll className="mb-10">
                <PlayerRatingsCover
                  title={article.title}
                  className="rounded-xl aspect-[16/9] border border-sws-700/50"
                />
              </RevealOnScroll>
            ) : null}

            {/* Article Body */}
            <RevealOnScroll>
              <div
                className="article-content max-w-narrow"
                dangerouslySetInnerHTML={{ __html: articleHtml }}
              />
            </RevealOnScroll>

            {/* Disclaimer */}
            <RevealOnScroll>
              <div className="mt-16 pt-8 border-t border-sws-700/40">
                <div className="bg-bg-elevated rounded-lg p-5 border border-sws-700/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-sws-700 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="#6E6E7A" strokeWidth="1.5" />
                        <path d="M7 4V7.5M7 10V9.5" stroke="#6E6E7A" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-sws-400 uppercase tracking-widest mb-1">Disclaimer</p>
                      <p className="text-sm text-sws-300 leading-relaxed">
                        South Ward Signal is an independent publication not affiliated with the New York Red Bulls or Major League Soccer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Related Coverage (smaller screens) */}
            <div className="xl:hidden mt-12">
              <RevealOnScroll>
                <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5">
                  <h3 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Related Coverage</h3>
                  <div className="space-y-0">
                    {related.map((ra) => (
                      <ArticleRow key={ra.slug} {...ra} />
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </article>

          {/* Sidebar (XL screens) */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-8">
              <TableOfContents html={article.html_body || ''} />
              <RevealOnScroll direction="right" delay={0.2}>
                <div className="bg-bg-card border border-sws-700/50 rounded-xl p-5">
                  <h3 className="text-xs font-mono text-sws-500 uppercase tracking-widest mb-4">Related Coverage</h3>
                  <div className="space-y-0">
                    {related.map((ra) => (
                      <ArticleRow key={ra.slug} {...ra} />
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
