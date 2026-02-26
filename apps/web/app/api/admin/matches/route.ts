import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

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

  const { data: matches, count, error } = await db
    .from('matches')
    .select('id, date, home_team, away_team, home_score, away_score, home_xg, away_xg, status, venue, competition', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For each match, get linked article count
  const matchIds = (matches ?? []).map((m) => m.id);
  let articleCounts: Record<string, number> = {};

  if (matchIds.length > 0) {
    const { data: articles } = await db
      .from('articles')
      .select('match_id')
      .in('match_id', matchIds);

    if (articles) {
      for (const a of articles) {
        if (a.match_id) {
          articleCounts[a.match_id] = (articleCounts[a.match_id] ?? 0) + 1;
        }
      }
    }
  }

  const enriched = (matches ?? []).map((m) => ({
    ...m,
    article_count: articleCounts[m.id] ?? 0,
  }));

  return NextResponse.json({
    matches: enriched,
    total: count ?? 0,
    page,
    pageSize,
  });
}
