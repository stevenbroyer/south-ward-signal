import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPlayerDetail,
  getPlayerMatchLog,
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

  let player: Awaited<ReturnType<typeof getPlayerDetail>>;
  let matchLog: Awaited<ReturnType<typeof getPlayerMatchLog>>;
  let history: Awaited<ReturnType<typeof getPlayerSeasonHistory>>;

  try {
    [player, matchLog, history] = await Promise.all([
      getPlayerDetail(playerName, season),
      getPlayerMatchLog(playerName, season),
      getPlayerSeasonHistory(playerName),
    ]);
  } catch (err) {
    console.error('[PlayerDetail] Data fetch failed:', err);
    notFound();
  }

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

  // Build radar data (scaled to reasonable season maximums)
  const maxGoals = 15;
  const maxAssists = 10;
  const maxKeyPasses = 40;
  const maxTackles = 60;
  const maxInterceptions = 40;

  const radarMetrics = [
    { stat: 'Goals', player: Math.min(100, ((player.goals ?? 0) / maxGoals) * 100), average: 50 },
    { stat: 'Assists', player: Math.min(100, ((player.assists ?? 0) / maxAssists) * 100), average: 50 },
    { stat: 'Key Passes', player: Math.min(100, ((player.key_passes ?? 0) / maxKeyPasses) * 100), average: 55 },
    { stat: 'Pass Comp.', player: Number(player.pass_completion) || 0, average: 72 },
    { stat: 'Tackles', player: Math.min(100, ((player.tackles_won ?? 0) / maxTackles) * 100), average: 48 },
    { stat: 'Interceptions', player: Math.min(100, ((player.interceptions ?? 0) / maxInterceptions) * 100), average: 45 },
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
        history={history}
        matchLog={matchLog}
      />
    </div>
  );
}
