import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { draftPendingRecaps } from '@/lib/recap-drafter';

/**
 * Cron — auto-draft recaps for recently-finished NYRB matches.
 * Called by the GitHub Action right after the ESPN sync, so a draft recap
 * lands in the admin queue within hours of full-time. Protected by CRON_SECRET.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const db = createClient(supabaseUrl, supabaseKey);
  const results = await draftPendingRecaps(db, { maxAgeHours: 72, limit: 3 });

  return NextResponse.json({ ok: true, drafted: results.filter((r) => r.articleId && !r.skipped).length, results, ts: new Date().toISOString() });
}
