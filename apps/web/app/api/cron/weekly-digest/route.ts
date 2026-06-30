import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildWeeklyDigest } from '@/lib/digest';
import { isEmailConfigured, sendBroadcastToAudience } from '@/lib/email';

/**
 * Cron — send the weekly newsletter digest to the Resend audience.
 * Called by a GitHub Action on a weekly schedule. Protected by CRON_SECRET.
 * No-ops gracefully if email isn't configured or there's nothing to send.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEmailConfigured() || !process.env.RESEND_AUDIENCE_ID) {
    return NextResponse.json({ ok: true, skipped: 'email not configured (set RESEND_API_KEY + RESEND_AUDIENCE_ID)' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const db = createClient(supabaseUrl, supabaseKey);
  const digest = await buildWeeklyDigest(db);

  if (digest.articleCount === 0) {
    return NextResponse.json({ ok: true, skipped: 'no articles published this week' });
  }

  try {
    const broadcastId = await sendBroadcastToAudience({ subject: digest.subject, html: digest.html });
    return NextResponse.json({ ok: true, sent: true, broadcastId, articleCount: digest.articleCount });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
