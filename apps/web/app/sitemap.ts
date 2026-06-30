import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase-auth';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

const STATIC_PATHS: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, freq: 'daily' },
  { path: '/articles', priority: 0.8, freq: 'daily' },
  { path: '/data-room', priority: 0.7, freq: 'daily' },
  { path: '/data-room/players', priority: 0.6, freq: 'weekly' },
  { path: '/data-room/matches', priority: 0.6, freq: 'daily' },
  { path: '/data-room/league', priority: 0.6, freq: 'weekly' },
  { path: '/data-room/team', priority: 0.6, freq: 'weekly' },
  { path: '/community', priority: 0.6, freq: 'daily' },
  { path: '/social', priority: 0.5, freq: 'daily' },
  { path: '/newsletter', priority: 0.5, freq: 'monthly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('articles')
      .select('slug, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(2000);
    articleRoutes = (data ?? []).map((a) => ({
      url: `${SITE_URL}/articles/${a.slug}`,
      lastModified: new Date(a.published_at || a.created_at || now),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    // If the DB is briefly unavailable, still return the static routes.
  }

  return [...staticRoutes, ...articleRoutes];
}
