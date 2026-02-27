import { NextResponse } from 'next/server';
import { getLeagueXgScatter } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2025;

  const teams = await getLeagueXgScatter(season);
  return NextResponse.json(teams);
}
