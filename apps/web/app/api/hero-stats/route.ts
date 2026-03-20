import { NextResponse } from 'next/server';
import { getStandings, getNextScheduledMatch } from '@/lib/supabase';

const RBNY_TEAM_IDS = ['190', '383'];

export async function GET() {
  const [standings, nextMatch] = await Promise.all([
    getStandings('Eastern'),
    getNextScheduledMatch(),
  ]);

  const rbny = standings.find((s) => RBNY_TEAM_IDS.includes(s.team_id));

  return NextResponse.json({
    record: rbny
      ? { wins: rbny.wins, draws: rbny.draws, losses: rbny.losses, points: rbny.points, position: rbny.position, gf: rbny.goals_for, ga: rbny.goals_against, form: rbny.form }
      : null,
    nextMatch,
  });
}
