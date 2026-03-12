import { Hero } from '@/components/hero/Hero';
import { LatestSection } from './sections/LatestSection';
import { DataRoomPreview } from './sections/DataRoomPreview';
import { SocialPreview } from './sections/SocialPreview';
import { AboutPreview } from './sections/AboutPreview';
import { getLatestArticles } from '@/lib/ghost';
import { getLatestMatch, getStandings } from '@/lib/supabase';

export const revalidate = 60;

export default async function HomePage() {
  const [articles, latestMatch, standings] = await Promise.all([
    getLatestArticles(5),
    getLatestMatch(),
    getStandings('Eastern'),
  ]);

  const normalizedArticles = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.custom_excerpt || a.excerpt || '',
    primary_tag: a.primary_tag?.name || a.tags?.[0]?.name || 'Article',
    published_at: a.published_at,
    reading_time: a.reading_time || 5,
    feature_image: a.feature_image || undefined,
  }));

  return (
    <>
      <Hero />
      <LatestSection articles={normalizedArticles} />
      <DataRoomPreview matchData={latestMatch} standingsData={standings} />
      <SocialPreview />
      <AboutPreview />
    </>
  );
}
