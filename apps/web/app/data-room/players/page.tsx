import { getPlayerList } from '@/lib/data-room-queries';
import { PlayerStatsTable } from '@/components/data/PlayerStatsTable';
import Link from 'next/link';

export const revalidate = 60;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; position?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;
  const players = await getPlayerList(season, {
    position: params?.position,
    sort: params?.sort,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-mono text-sws-500 uppercase tracking-widest">
          Squad ({players.length} players)
        </h2>
        <Link
          href="/data-room/players/compare"
          className="text-xs font-mono text-red hover:text-red/80 transition-colors"
        >
          Compare Players →
        </Link>
      </div>

      <PlayerStatsTable players={players} />
    </div>
  );
}
