import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = createAdminClient();

  const allowed: Record<string, unknown> = {};

  // Retry a failed post — reset to queued
  if (body.action === 'retry') {
    allowed.status = 'queued';
    allowed.error_message = null;
    allowed.retry_count = 0;
  }

  // Cancel a queued post
  if (body.action === 'cancel') {
    allowed.status = 'cancelled';
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid action' }, { status: 400 });
  }

  const { data, error } = await db
    .from('social_queue')
    .update(allowed)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
