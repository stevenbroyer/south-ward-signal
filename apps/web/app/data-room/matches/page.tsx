import { getMatchList } from '@/lib/data-room-queries';
import { MatchListClient } from './MatchListClient';

export const revalidate = 60;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; result?: string; home?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2025;
  const filters = {
    result: params?.result || undefined,
    home: params?.home === 'true' ? true : params?.home === 'false' ? false : undefined,
  };

  const matches = await getMatchList(season, filters);

  return <MatchListClient matches={matches} currentFilters={filters} />;
}
