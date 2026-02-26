import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export async function GET() {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();

  const [articlesRes, socialRes] = await Promise.all([
    db.from('articles')
      .select('id, type, status, qa_passed, word_count, created_at')
      .order('created_at', { ascending: true }),
    db.from('social_queue')
      .select('id, platform, status, created_at')
      .order('created_at', { ascending: true }),
  ]);

  const articles = articlesRes.data ?? [];
  const social = socialRes.data ?? [];

  // Articles by type
  const byType: Record<string, number> = {};
  for (const a of articles) {
    byType[a.type] = (byType[a.type] ?? 0) + 1;
  }

  // Articles over time (by week)
  const byWeek: Record<string, number> = {};
  for (const a of articles) {
    const d = new Date(a.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    byWeek[key] = (byWeek[key] ?? 0) + 1;
  }

  // Social success rates by platform
  const socialByPlatform: Record<string, { posted: number; failed: number; queued: number }> = {};
  for (const s of social) {
    if (!socialByPlatform[s.platform]) {
      socialByPlatform[s.platform] = { posted: 0, failed: 0, queued: 0 };
    }
    if (s.status === 'posted') socialByPlatform[s.platform].posted++;
    else if (s.status === 'failed') socialByPlatform[s.platform].failed++;
    else socialByPlatform[s.platform].queued++;
  }

  // QA pass/fail over time
  const qaByWeek: Record<string, { passed: number; failed: number }> = {};
  for (const a of articles) {
    if (a.qa_passed === null) continue;
    const d = new Date(a.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!qaByWeek[key]) qaByWeek[key] = { passed: 0, failed: 0 };
    if (a.qa_passed) qaByWeek[key].passed++;
    else qaByWeek[key].failed++;
  }

  // Word count distribution
  const wordCounts = articles
    .filter((a) => a.word_count > 0)
    .map((a) => ({ type: a.type, wordCount: a.word_count }));

  return NextResponse.json({
    articlesByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    articlesByWeek: Object.entries(byWeek).map(([week, count]) => ({ week, count })),
    socialByPlatform: Object.entries(socialByPlatform).map(([platform, stats]) => ({ platform, ...stats })),
    qaByWeek: Object.entries(qaByWeek).map(([week, stats]) => ({ week, ...stats })),
    wordCounts,
  });
}
