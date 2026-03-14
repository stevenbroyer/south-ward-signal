import { getPlayerList } from '@/lib/data-room-queries';
import { PlayersClient } from './PlayersClient';

export const revalidate = 60;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const params = await searchParams;
  const season = Number(params?.season) || 2026;

  // Fetch all players (no position filter) for initial server render.
  // Client-side TanStack Query handles position filtering instantly.
  const players = await getPlayerList(season);

  return <PlayersClient players={players} initialSeason={season} />;
}
