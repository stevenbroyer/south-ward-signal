import { notFound } from 'next/navigation';
import { getMatchDetail, getMatchShots, getMatchXgFlow, getMatchPlayerStats } from '@/lib/data-room-queries';
import { MatchDetailClient } from './MatchDetailClient';

export const revalidate = 60;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const [match, shots, xgFlow, playerStats] = await Promise.all([
    getMatchDetail(matchId),
    getMatchShots(matchId),
    getMatchXgFlow(matchId),
    getMatchPlayerStats(matchId),
  ]);

  if (!match) notFound();

  // Parse JSON fields safely
  const stats = (match.stats || {}) as Record<string, Record<string, number>>;
  const events = (() => {
    try {
      return typeof match.events === 'string' ? JSON.parse(match.events) : (match.events || []);
    } catch { return []; }
  })();
  const momentum = (() => {
    try {
      return typeof match.momentum === 'string' ? JSON.parse(match.momentum) : (match.momentum || []);
    } catch { return []; }
  })();

  // Build stat comparison pairs
  const statPairs = [
    { label: 'Possession', home: stats?.possession?.home ?? 50, away: stats?.possession?.away ?? 50, format: 'pct' as const },
    { label: 'Shots', home: stats?.shots?.home ?? 0, away: stats?.shots?.away ?? 0 },
    { label: 'Shots on Target', home: stats?.shots_on_target?.home ?? 0, away: stats?.shots_on_target?.away ?? 0 },
    { label: 'Corners', home: stats?.corners?.home ?? 0, away: stats?.corners?.away ?? 0 },
    { label: 'Fouls', home: stats?.fouls?.home ?? 0, away: stats?.fouls?.away ?? 0 },
    { label: 'Pass Accuracy', home: stats?.passing_accuracy?.home ?? 0, away: stats?.passing_accuracy?.away ?? 0, format: 'pct' as const },
    { label: 'xG', home: Number(match.home_xg) || 0, away: Number(match.away_xg) || 0, format: 'dec' as const },
  ];

  // Build xG timeline data
  const xgTimelineData = xgFlow.length
    ? xgFlow.map((f: any) => ({
        minute: f.minute,
        homeXg: Number(f.home_xg),
        awayXg: Number(f.away_xg),
      }))
    : null;

  // Build shot map data
  const shotMapData = shots.map((s: any) => ({
    x: Number(s.x),
    y: Number(s.y),
    xg: Number(s.xg),
    outcome: s.outcome,
    player: s.player,
    team: s.team,
    minute: s.minute,
  }));

  return (
    <MatchDetailClient
      match={{
        id: match.id,
        date: match.date,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        homeScore: match.home_score ?? 0,
        awayScore: match.away_score ?? 0,
        homeXg: Number(match.home_xg) || 0,
        awayXg: Number(match.away_xg) || 0,
        venue: match.venue ?? 'Red Bull Arena',
        status: match.status,
      }}
      statPairs={statPairs}
      xgTimeline={xgTimelineData}
      shots={shotMapData}
      events={events}
      momentum={momentum}
      playerStats={playerStats}
    />
  );
}
