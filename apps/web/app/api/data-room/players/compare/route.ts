import { NextResponse } from 'next/server';
import { getPlayersForCompare } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2025;
  const playersParam = searchParams.get('players') || '';
  const playerNames = playersParam.split(',').map(decodeURIComponent).filter(Boolean);

  if (playerNames.length < 2) {
    return NextResponse.json({ error: 'At least 2 player names required' }, { status: 400 });
  }

  const players = await getPlayersForCompare(playerNames, season);
  return NextResponse.json(players);
}
