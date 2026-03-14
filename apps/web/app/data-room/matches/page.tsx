import { getMatchList } from '@/lib/data-room-queries';
import { MatchListClient } from './MatchListClient';

export const revalidate = 60;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;

  // Fetch unfiltered matches for initial server render.
  // Client-side TanStack Query handles result/venue filtering instantly.
  const matches = await getMatchList(season);

  return <MatchListClient matches={matches} initialSeason={season} />;
}
