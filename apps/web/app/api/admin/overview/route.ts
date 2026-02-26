import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export async function GET() {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();

  const [articlesRes, socialRes, matchesRes, recentArticlesRes, upcomingRes] = await Promise.all([
    // Total article counts by status
    db.from('articles').select('status', { count: 'exact', head: true }),
    // Social queue counts
    db.from('social_queue').select('status', { count: 'exact', head: true }),
    // Finished match count
    db.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'finished'),
    // Recent articles (last 5)
    db.from('articles')
      .select('id, title, slug, type, status, qa_passed, word_count, created_at, published_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // Upcoming matches
    db.from('matches')
      .select('id, date, home_team, away_team, status, venue')
      .eq('status', 'scheduled')
      .order('date', { ascending: true })
      .limit(3),
  ]);

  // Get counts by status
  const [publishedRes, draftRes, failedRes] = await Promise.all([
    db.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
  ]);

  const [queuedRes, postedRes, socialFailedRes] = await Promise.all([
    db.from('social_queue').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    db.from('social_queue').select('id', { count: 'exact', head: true }).eq('status', 'posted'),
    db.from('social_queue').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
  ]);

  // QA pass rate
  const qaRes = await db.from('articles').select('qa_passed').not('qa_passed', 'is', null);
  const qaData = qaRes.data ?? [];
  const qaPassed = qaData.filter((a) => a.qa_passed).length;
  const qaRate = qaData.length > 0 ? Math.round((qaPassed / qaData.length) * 100) : 0;

  return NextResponse.json({
    _user: { id: user.id, email: user.email },
    articles: {
      total: articlesRes.count ?? 0,
      published: publishedRes.count ?? 0,
      draft: draftRes.count ?? 0,
      failed: failedRes.count ?? 0,
    },
    social: {
      total: socialRes.count ?? 0,
      queued: queuedRes.count ?? 0,
      posted: postedRes.count ?? 0,
      failed: socialFailedRes.count ?? 0,
    },
    matches: {
      finished: matchesRes.count ?? 0,
    },
    qaRate,
    recentArticles: recentArticlesRes.data ?? [],
    upcomingMatches: upcomingRes.data ?? [],
  });
}
