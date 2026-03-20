import { NextResponse } from 'next/server';
import { getTeamMatchTrends, getHomeAwaySplit } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2026;

  const [trends, homeAway] = await Promise.all([
    getTeamMatchTrends(season),
    getHomeAwaySplit(season),
  ]);

  return NextResponse.json({ trends, homeAway });
}
