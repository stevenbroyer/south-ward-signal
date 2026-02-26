import { getLatestMatch, getStandings, getTeamSeasonMetrics } from '@/lib/supabase';
import DataRoomClient from './DataRoomClient';

export const revalidate = 60;

export default async function DataRoomPage() {
  const [metrics, latestMatch, standingsData] = await Promise.all([
    getTeamSeasonMetrics('New York Red Bulls'),
    getLatestMatch(),
    getStandings('Eastern'),
  ]);

  // Normalize match for client component
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

  // Normalize standings for StandingsTable shape
  const standings = (standingsData || []).map((s) => ({
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

  return <DataRoomClient metrics={metrics} match={match} standings={standings} />;
}
