import { createAdminClient } from '@/lib/supabase-auth';
import ArticlesPageClient from './ArticlesPageClient';

export const revalidate = 60;

export default async function ArticlesPage() {
  const db = createAdminClient();

  const { data: articles } = await db
    .from('articles')
    .select('slug, title, excerpt, featured_image, type, tags, published_at, word_count')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  const normalized = (articles ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || '',
    feature_image: a.featured_image || '',
    primary_tag: a.type || 'Article',
    primary_tag_slug: a.type || '',
    tag_slugs: a.tags || [],
    published_at: a.published_at || '',
    reading_time: Math.max(1, Math.round((a.word_count || 0) / 250)),
  }));

  return <ArticlesPageClient articles={normalized} />;
}
