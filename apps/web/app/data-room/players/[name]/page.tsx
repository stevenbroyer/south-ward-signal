import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPlayerDetail,
  getPlayerMatchLog,
  getPlayerGoalsAddedBreakdown,
  getPlayerSeasonHistory,
} from '@/lib/data-room-queries';
import { PlayerDetailClient } from './PlayerDetailClient';

export const revalidate = 60;

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { name: encodedName } = await params;
  const sp = await searchParams;
  const playerName = decodeURIComponent(encodedName);
  const season = Number(sp?.season) || 2026;

  const [player, matchLog, gaBreakdown, history] = await Promise.all([
    getPlayerDetail(playerName, season),
    getPlayerMatchLog(playerName, season),
    getPlayerGoalsAddedBreakdown(playerName, season),
    getPlayerSeasonHistory(playerName),
  ]);

  if (!player) notFound();

  // Build cumulative season progression from match log
  let cumGoals = 0;
  let cumXg = 0;
  let cumAssists = 0;
  const progression = matchLog.map((m: any, i: number) => {
    cumGoals += m.goals || 0;
    cumXg += Number(m.xg) || 0;
    cumAssists += m.assists || 0;
    return {
      matchweek: i + 1,
      goals: cumGoals,
      xg: +cumXg.toFixed(2),
      assists: cumAssists,
    };
  });

  // Build radar data (percentile vs positional average — simplified)
  const radarMetrics = [
    { stat: 'Goals', player: Math.min(100, (player.goals / Math.max(season === 2026 ? 8 : 15, 1)) * 100), average: 50 },
    { stat: 'Assists', player: Math.min(100, (player.assists / Math.max(season === 2026 ? 5 : 10, 1)) * 100), average: 50 },
    { stat: 'xG', player: Math.min(100, (Number(player.xg) / Math.max(season === 2026 ? 6 : 12, 1)) * 100), average: 48 },
    { stat: 'xA', player: Math.min(100, (Number(player.xa) / Math.max(season === 2026 ? 4 : 8, 1)) * 100), average: 44 },
    { stat: 'Key Passes', player: Math.min(100, ((player.key_passes || 0) / Math.max(season === 2026 ? 15 : 30, 1)) * 100), average: 55 },
    { stat: 'Pass Comp.', player: Number(player.pass_completion) || 0, average: 72 },
    { stat: 'G+', player: Math.min(100, Math.max(0, ((Number(player.goals_added) || 0) + 2) / 4 * 100)), average: 50 },
  ];

  return (
    <div>
      <Link
        href="/data-room/players"
        className="inline-flex items-center gap-1 text-xs font-mono text-sws-500 hover:text-sws-300 transition-colors mb-6"
      >
        ← All Players
      </Link>

      <PlayerDetailClient
        player={player}
        radarMetrics={radarMetrics}
        progression={progression}
        gaBreakdown={gaBreakdown}
        history={history}
        matchLog={matchLog}
      />
    </div>
  );
}
