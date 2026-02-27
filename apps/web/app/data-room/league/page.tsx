import {
  getEnhancedStandings,
  getStandingsHistory,
  getLeagueXgScatter,
  getTopScorers,
} from '@/lib/data-room-queries';
import { LeagueClient } from './LeagueClient';

export const revalidate = 60;

export default async function LeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;

  const [standings, standingsHistory, xgScatter, topScorers] = await Promise.all([
    getEnhancedStandings(season, 'Eastern'),
    getStandingsHistory(season, 'Eastern'),
    getLeagueXgScatter(season),
    getTopScorers(season, 20),
  ]);

  return (
    <LeagueClient
      standings={standings}
      standingsHistory={standingsHistory}
      xgScatter={xgScatter}
      topScorers={topScorers}
    />
  );
}
