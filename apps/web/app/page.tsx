import { Hero } from '@/components/hero/Hero';
import { MatchDayBanner } from '@/components/match-day/MatchDayBanner';
import { LatestSection } from './sections/LatestSection';
import { DataRoomPreview } from './sections/DataRoomPreview';
import { SocialPreview } from './sections/SocialPreview';
import { AboutPreview } from './sections/AboutPreview';
import { createAdminClient } from '@/lib/supabase-auth';
import { getLatestMatch, getNextScheduledMatch, getStandings } from '@/lib/supabase';
import { getMatchDayState } from '@/lib/match-day';

export const revalidate = 60;

async function getLatestPublishedArticles(limit = 5) {
  const db = createAdminClient();
  const { data } = await db
    .from('articles')
    .select('slug, title, excerpt, featured_image, type, word_count, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || '',
    primary_tag: a.type || 'Article',
    published_at: a.published_at || '',
    reading_time: Math.max(1, Math.round((a.word_count || 0) / 250)),
    feature_image: a.featured_image || undefined,
  }));
}

export default async function HomePage() {
  const [normalizedArticles, latestMatch, nextMatch, standings] = await Promise.all([
    getLatestPublishedArticles(5),
    getLatestMatch(),
    getNextScheduledMatch(),
    getStandings('Eastern'),
  ]);

  const matchDayContext = getMatchDayState(nextMatch, latestMatch);

  return (
    <>
      <Hero />
      {/* Always mounted: it polls /api/match-live and shows the banner when a
          match is near/live, even if the server-rendered DB state is stale. */}
      <MatchDayBanner context={matchDayContext} />
      <LatestSection articles={normalizedArticles} />
      <DataRoomPreview matchData={latestMatch} standingsData={standings} />
      <SocialPreview />
      <AboutPreview />
    </>
  );
}
