import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runEspnSync } from '@/lib/espn-sync';

/**
 * Cron — ESPN MLS data sync (free public API → Supabase).
 * Shares the sync logic with the admin "Sync now" button via lib/espn-sync.
 * Protected by an optional CRON_SECRET bearer token.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const db = createClient(supabaseUrl, supabaseKey);
  const result = await runEspnSync(db);

  return NextResponse.json(
    { ok: result.ok, results: result.results, error: result.error, ts: new Date().toISOString() },
    { status: result.ok ? 200 : 500 },
  );
}
