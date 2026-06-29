import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';
import { runEspnSync } from '@/lib/espn-sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** POST — run the free ESPN sync on demand (admin "Sync now" button). */
export async function POST() {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runEspnSync(createAdminClient());
  if (!result.ok) {
    return NextResponse.json({ error: result.error, results: result.results }, { status: 500 });
  }
  return NextResponse.json({ ok: true, results: result.results, ts: new Date().toISOString() });
}
