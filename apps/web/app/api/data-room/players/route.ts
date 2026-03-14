import { NextResponse } from 'next/server';
import { getPlayerList } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2026;
  const position = searchParams.get('position') || undefined;
  const sort = searchParams.get('sort') || undefined;

  const players = await getPlayerList(season);
  return NextResponse.json(players);
}
