import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export const dynamic = 'force-dynamic';

// RBNY team IDs (current ESPN id + historical id), matched in lib/supabase.ts.
const RBNY_TEAM_IDS = [190, 383];

function rbnyOr(): string {
  return RBNY_TEAM_IDS.flatMap((id) => [`home_team_id.eq.${id}`, `away_team_id.eq.${id}`]).join(',');
}

/** GET — paginated RBNY fixtures from the live sm_fixtures table (ESPN sync). */
export async function GET(request: NextRequest) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);

  const db = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await db
    .from('sm_fixtures')
    .select(
      'id, starting_at, state, home_team_name, away_team_name, home_score, away_score',
      { count: 'exact' },
    )
    .or(rbnyOr())
    .order('starting_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matches = (data ?? []).map((f) => ({
    id: String(f.id),
    date: f.starting_at,
    home_team: f.home_team_name,
    away_team: f.away_team_name,
    home_score: f.home_score,
    away_score: f.away_score,
    status: f.state === 'FT' ? 'finished' : f.state === 'LIVE' ? 'live' : 'scheduled',
  }));

  return NextResponse.json({ matches, total: count ?? 0, page, pageSize });
}
