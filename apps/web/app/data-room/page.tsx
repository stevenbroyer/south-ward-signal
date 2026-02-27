import { Suspense } from 'react';
import { getTeamSeasonMetrics, getLatestMatch, getStandings } from '@/lib/supabase';
import {
  getOverviewMetrics,
  getSeasonXgRace,
  getFormStreak,
  getPointsTrajectory,
  getTopPerformers,
} from '@/lib/data-room-queries';
import { OverviewClient } from './OverviewClient';

export const revalidate = 60;

export default async function DataRoomOverview({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;

  const [metrics, legacyMetrics, latestMatch, standingsData, xgRace, formStreak, trajectory, topPerformers] =
    await Promise.all([
      getOverviewMetrics(season),
      getTeamSeasonMetrics('New York Red Bulls'),
      getLatestMatch(),
      getStandings('Eastern'),
      getSeasonXgRace(season),
      getFormStreak(season, 10),
      getPointsTrajectory(season),
      getTopPerformers(season, 3),
    ]);

  const match = latestMatch
    ? {
        homeTeam: latestMatch.home_team,
        awayTeam: latestMatch.away_team,
        homeScore: latestMatch.home_score ?? 0,
        awayScore: latestMatch.away_score ?? 0,
        date: latestMatch.date,
        venue: latestMatch.venue ?? 'Red Bull Arena',
        possession: [
          (latestMatch.stats as Record<string, Record<string, number>>)?.possession?.home ?? 50,
          (latestMatch.stats as Record<string, Record<string, number>>)?.possession?.away ?? 50,
        ] as [number, number],
        shots: [
          (latestMatch.stats as Record<string, Record<string, number>>)?.shots?.home ?? 0,
          (latestMatch.stats as Record<string, Record<string, number>>)?.shots?.away ?? 0,
        ] as [number, number],
        xg: [
          Number(latestMatch.home_xg) || 0,
          Number(latestMatch.away_xg) || 0,
        ] as [number, number],
      }
    : null;

  const standings = (standingsData || []).slice(0, 6).map((s) => ({
    pos: s.position,
    team: s.team,
    played: s.games_played,
    won: s.wins,
    drawn: s.draws,
    lost: s.losses,
    gd: s.goal_difference,
    pts: s.points,
    form: (s.form || []) as ('W' | 'D' | 'L')[],
  }));

  return (
    <OverviewClient
      metrics={metrics}
      legacyMetrics={legacyMetrics}
      match={match}
      standings={standings}
      xgRace={xgRace}
      formStreak={formStreak}
      trajectory={trajectory}
      topPerformers={topPerformers}
    />
  );
}
