import { NextResponse } from 'next/server';
import { getMultiSeasonTeamStats, getAllTimePlayerContributions, getHistoricalFormGrid } from '@/lib/data-room-queries';

export async function GET() {
  const [teamStats, playerContributions, formGrid] = await Promise.all([
    getMultiSeasonTeamStats(2016, 2026),
    getAllTimePlayerContributions(),
    getHistoricalFormGrid(),
  ]);

  return NextResponse.json({ teamStats, playerContributions, formGrid });
}
