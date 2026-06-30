import { createAdminClient } from '@/lib/supabase-auth';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

export const revalidate = 1800;

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RSS 2.0 feed of published articles — for readers and content aggregators. */
export async function GET() {
  let items = '';
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('articles')
      .select('slug, title, excerpt, published_at, created_at, type')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    items = (data ?? [])
      .map((a) => {
        const url = `${SITE_URL}/articles/${a.slug}`;
        const date = new Date(a.published_at || a.created_at || Date.now()).toUTCString();
        return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      ${a.type ? `<category>${esc(a.type)}</category>` : ''}
      <description>${esc(a.excerpt || '')}</description>
    </item>`;
      })
      .join('\n');
  } catch {
    items = '';
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
