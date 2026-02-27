import { NextResponse } from 'next/server';
import { getOverviewMetrics, getSeasonXgRace, getFormStreak, getPointsTrajectory, getTopPerformers } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2025;

  const [metrics, xgRace, formStreak, trajectory, topPerformers] = await Promise.all([
    getOverviewMetrics(season),
    getSeasonXgRace(season),
    getFormStreak(season, 10),
    getPointsTrajectory(season),
    getTopPerformers(season, 3),
  ]);

  return NextResponse.json({ metrics, xgRace, formStreak, trajectory, topPerformers });
}
