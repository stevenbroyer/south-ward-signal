import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';
import { marked } from 'marked';

export async function GET(request: NextRequest) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const status = searchParams.get('status') ?? '';
  const type = searchParams.get('type') ?? '';

  const db = createAdminClient();
  let query = db
    .from('articles')
    .select('id, title, slug, type, status, qa_passed, word_count, created_at, published_at', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(request: NextRequest) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, body: markdown, excerpt, type, tags, featured_image, seo_title, seo_description, status } = body;

  if (!title || !markdown) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  const slug = slugify(title);
  const html_body = await marked(markdown);
  const word_count = countWords(markdown);
  const now = new Date().toISOString();

  const articleStatus = status || 'draft';

  const row = {
    title,
    slug,
    body: markdown,
    html_body,
    excerpt: excerpt || '',
    type: type || 'match-recap',
    tags: tags || [],
    featured_image: featured_image || null,
    seo_title: seo_title || null,
    seo_description: seo_description || null,
    word_count,
    status: articleStatus,
    published_at: articleStatus === 'published' ? now : null,
    created_at: now,
  };

  const db = createAdminClient();
  const { data, error } = await db
    .from('articles')
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ article: data }, { status: 201 });
}
