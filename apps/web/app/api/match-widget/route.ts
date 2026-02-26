import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'No match data available.' }, { status: 404 });
    }

    const match = {
      id: data.id,
      status: data.status === 'finished' ? 'FT' : data.status,
      homeTeam: data.home_team,
      awayTeam: data.away_team,
      homeScore: data.home_score,
      awayScore: data.away_score,
      date: data.date,
      venue: data.venue || '',
      competition: data.competition || 'MLS 2026',
      stats: data.stats || {},
      goals: data.goals || [],
    };

    return NextResponse.json(match, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[Match Widget] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match data.' }, { status: 500 });
  }
}
