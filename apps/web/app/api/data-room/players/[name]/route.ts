import { NextResponse } from 'next/server';
import { getPlayerDetail, getPlayerMatchLog, getPlayerGoalsAddedBreakdown, getPlayerSeasonHistory } from '@/lib/data-room-queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2026;
  const playerName = decodeURIComponent(name);

  const [player, matchLog, gaBreakdown, history] = await Promise.all([
    getPlayerDetail(playerName, season),
    getPlayerMatchLog(playerName, season),
    getPlayerGoalsAddedBreakdown(playerName, season),
    getPlayerSeasonHistory(playerName),
  ]);

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  return NextResponse.json({ player, matchLog, gaBreakdown, history });
}
