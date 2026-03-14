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

  let metrics: Awaited<ReturnType<typeof getOverviewMetrics>>;
  let legacyMetrics: Awaited<ReturnType<typeof getTeamSeasonMetrics>>;
  let latestMatch: Awaited<ReturnType<typeof getLatestMatch>>;
  let standingsData: Awaited<ReturnType<typeof getStandings>>;
  let xgRace: Awaited<ReturnType<typeof getSeasonXgRace>>;
  let formStreak: Awaited<ReturnType<typeof getFormStreak>>;
  let trajectory: Awaited<ReturnType<typeof getPointsTrajectory>>;
  let topPerformers: Awaited<ReturnType<typeof getTopPerformers>>;

  try {
    [metrics, legacyMetrics, latestMatch, standingsData, xgRace, formStreak, trajectory, topPerformers] =
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
  } catch (err) {
    console.error('[Overview] Data fetch failed:', err);
    metrics = { points: 0, ppg: 0, xgDiff: 0, goalsAdded: 0, form: [], confRank: 0, gamesPlayed: 0, goalsFor: 0, goalsAgainst: 0, xgFor: 0, xgAgainst: 0 };
    legacyMetrics = { xgPerMatch: 0, points: 0, goalDifference: 0, ppda: 0, goalsScored: 0, assists: 0, shotsPer90: 0, bigChances: 0, goalsConceded: 0, cleanSheets: 0, tacklesWon: 0, interceptionsPer90: 0 };
    latestMatch = null;
    standingsData = [];
    xgRace = [];
    formStreak = [];
    trajectory = [];
    topPerformers = [];
  }

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
    logo_url: s.logo_url || undefined,
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
