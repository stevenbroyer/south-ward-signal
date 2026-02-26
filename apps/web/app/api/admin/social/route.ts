import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-api';
import { createAdminClient } from '@/lib/supabase-auth';

export async function GET(request: NextRequest) {
  const user = await verifyAdminSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const status = searchParams.get('status') ?? '';
  const platform = searchParams.get('platform') ?? '';

  const db = createAdminClient();
  let query = db
    .from('social_queue')
    .select('*', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (platform) query = query.eq('platform', platform);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('scheduled_for', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    posts: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
