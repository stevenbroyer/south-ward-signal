import { getLatestArticles } from '@/lib/ghost';
import ArticlesPageClient from './ArticlesPageClient';

export const revalidate = 60;

export default async function ArticlesPage() {
  const articles = await getLatestArticles(20);

  // Normalize Ghost post shape to what the client component expects
  const normalized = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.custom_excerpt || a.excerpt || '',
    feature_image: a.feature_image || '',
    primary_tag: a.primary_tag?.name || a.tags?.[0]?.name || 'Article',
    published_at: a.published_at,
    reading_time: a.reading_time || 5,
  }));

  return <ArticlesPageClient articles={normalized} />;
}
