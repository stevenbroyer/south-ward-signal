import { notFound } from 'next/navigation';
import { getMatchDetail, getMatchPlayerStats } from '@/lib/data-room-queries';
import { MatchDetailClient } from './MatchDetailClient';

export const revalidate = 60;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  let match: Awaited<ReturnType<typeof getMatchDetail>>;
  let playerStats: Awaited<ReturnType<typeof getMatchPlayerStats>>;

  try {
    [match, playerStats] = await Promise.all([
      getMatchDetail(matchId),
      getMatchPlayerStats(matchId),
    ]);
  } catch (err) {
    console.error('[MatchDetail] Data fetch failed:', err);
    notFound();
  }

  if (!match) notFound();

  // Parse stats from the match object
  const stats = (match.stats || {}) as Record<string, Record<string, number>>;
  const momentum = match.momentum || [];

  // Map events from SportMonks format to EventTimeline format
  const typeMap: Record<string, string> = {
    'goal': 'Goal',
    'yellowcard': 'YellowCard',
    'redcard': 'RedCard',
    'substitution': 'Substitution',
    'pen-shootout-goal': 'Goal',
    'missed-penalty': 'Penalty',
  };

  const events = (match.events || []).map((e: any) => ({
    type: typeMap[e.type] || e.type,
    time: e.minute ?? 0,
    overloadTime: undefined,
    player: e.player ? { name: e.player } : undefined,
    assistPlayer: e.relatedPlayer ? { name: e.relatedPlayer } : undefined,
    isHome: e.team === match.home_team,
    swap: e.type === 'substitution' && e.relatedPlayer ? [{ name: e.relatedPlayer }] : undefined,
  }));

  // Build stat comparison pairs — only include stats that have data
  const allStatPairs = [
    { label: 'xG', home: Number(match.home_xg) || 0, away: Number(match.away_xg) || 0, format: 'dec' as const },
    { label: 'Possession', home: stats?.possession?.home ?? 0, away: stats?.possession?.away ?? 0, format: 'pct' as const },
    { label: 'Shots', home: stats?.shots?.home ?? 0, away: stats?.shots?.away ?? 0 },
    { label: 'Shots on Target', home: stats?.shots_on_target?.home ?? 0, away: stats?.shots_on_target?.away ?? 0 },
    { label: 'xGOT', home: stats?.xgot?.home ?? 0, away: stats?.xgot?.away ?? 0, format: 'dec' as const },
    { label: 'Big Chances', home: stats?.big_chances?.home ?? 0, away: stats?.big_chances?.away ?? 0 },
    { label: 'Passes', home: stats?.passes?.home ?? 0, away: stats?.passes?.away ?? 0 },
    { label: 'Pass Accuracy', home: stats?.passing_accuracy?.home ?? 0, away: stats?.passing_accuracy?.away ?? 0, format: 'pct' as const },
    { label: 'Key Passes', home: stats?.key_passes?.home ?? 0, away: stats?.key_passes?.away ?? 0 },
    { label: 'Corners', home: stats?.corners?.home ?? 0, away: stats?.corners?.away ?? 0 },
    { label: 'Tackles', home: stats?.tackles?.home ?? 0, away: stats?.tackles?.away ?? 0 },
    { label: 'Interceptions', home: stats?.interceptions?.home ?? 0, away: stats?.interceptions?.away ?? 0 },
    { label: 'Duels Won', home: stats?.duels_won?.home ?? 0, away: stats?.duels_won?.away ?? 0 },
    { label: 'Fouls', home: stats?.fouls?.home ?? 0, away: stats?.fouls?.away ?? 0 },
    { label: 'Offsides', home: stats?.offsides?.home ?? 0, away: stats?.offsides?.away ?? 0 },
  ];
  // Filter out stats where both sides are 0
  const statPairs = allStatPairs.filter((s) => s.home > 0 || s.away > 0);

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
      xgTimeline={null}
      shots={[]}
      events={events}
      momentum={momentum}
      playerStats={playerStats}
      averagePositions={{ home: [], away: [] }}
      h2h={null}
    />
  );
}
