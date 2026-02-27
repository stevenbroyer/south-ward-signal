import { NextResponse } from 'next/server';
import { getMatchDetail, getMatchShots, getMatchXgFlow, getMatchPlayerStats } from '@/lib/data-room-queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [match, shots, xgFlow, playerStats] = await Promise.all([
    getMatchDetail(id),
    getMatchShots(id),
    getMatchXgFlow(id),
    getMatchPlayerStats(id),
  ]);

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  return NextResponse.json({ match, shots, xgFlow, playerStats });
}
