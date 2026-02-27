import { NextResponse } from 'next/server';
import { getStandingsHistory } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2026;
  const conference = searchParams.get('conference') || 'Eastern';

  const history = await getStandingsHistory(season, conference);
  return NextResponse.json(history);
}
