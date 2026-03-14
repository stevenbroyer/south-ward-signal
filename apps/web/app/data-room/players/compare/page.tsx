import { getPlayerList, getPlayersForCompare } from '@/lib/data-room-queries';
import { CompareClient } from './CompareClient';

export const revalidate = 60;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; players?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;
  const selectedNames = params?.players?.split(',').map((n) => decodeURIComponent(n.trim())).filter(Boolean) || [];

  const [allPlayers, comparePlayers] = await Promise.all([
    getPlayerList(season),
    selectedNames.length >= 2 ? getPlayersForCompare(selectedNames, season) : Promise.resolve([]),
  ]);

  const playerOptions = allPlayers.map((p) => ({ name: p.name, position: p.position }));

  const compareData = comparePlayers.map((p: any) => ({
    name: p.name,
    stats: {
      goals: p.goals,
      assists: p.assists,
      xg: Number(p.xg),
      xa: Number(p.xa),
      goals_added: Number(p.goals_added) || 0,
      key_passes: p.key_passes || 0,
      pass_completion: Number(p.pass_completion) || 0,
    },
    raw: p,
  }));

  return (
    <CompareClient
      playerOptions={playerOptions}
      selectedNames={selectedNames}
      compareData={compareData}
    />
  );
}
