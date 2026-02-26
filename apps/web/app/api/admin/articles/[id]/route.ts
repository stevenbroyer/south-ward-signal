import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  // Fetch linked social posts
  const { data: socialPosts } = await db
    .from('social_queue')
    .select('id, platform, content, status, scheduled_for, posted_at, error_message')
    .ilike('article_id', `%${data.slug}%`)
    .order('scheduled_for', { ascending: true });

  return NextResponse.json({
    article: data,
    socialPosts: socialPosts ?? [],
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = createAdminClient();

  // Only allow updating specific fields
  const allowed: Record<string, unknown> = {};
  if (body.status) allowed.status = body.status;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await db
    .from('articles')
    .update(allowed)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data });
}
