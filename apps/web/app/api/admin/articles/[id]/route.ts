import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';
import { marked } from 'marked';

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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = createAdminClient();

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
  if (body.type !== undefined) updates.type = body.type;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.featured_image !== undefined) updates.featured_image = body.featured_image;
  if (body.seo_title !== undefined) updates.seo_title = body.seo_title;
  if (body.seo_description !== undefined) updates.seo_description = body.seo_description;

  if (body.body !== undefined) {
    updates.body = body.body;
    updates.html_body = await marked(body.body);
    updates.word_count = countWords(body.body);
  }

  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === 'published') {
      // Set published_at if publishing for the first time
      const { data: existing } = await db
        .from('articles')
        .select('published_at')
        .eq('id', id)
        .single();
      if (!existing?.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await db
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();

  const { error } = await db
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
