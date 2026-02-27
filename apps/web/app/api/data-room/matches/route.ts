import { NextResponse } from 'next/server';
import { getMatchList } from '@/lib/data-room-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = Number(searchParams.get('season')) || 2025;
  const result = searchParams.get('result') || undefined;
  const homeParam = searchParams.get('home');
  const home = homeParam === 'true' ? true : homeParam === 'false' ? false : undefined;

  const matches = await getMatchList(season, { result, home });
  return NextResponse.json(matches);
}
