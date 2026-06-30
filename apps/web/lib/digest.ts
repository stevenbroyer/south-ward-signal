import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, SITE_NAME } from './site';

export interface Digest {
  subject: string;
  html: string;
  articleCount: number;
}

const RBNY_TEAM_IDS = [190, 383];
const RED = '#ED1A3D';

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Build the weekly newsletter from the last 7 days of articles + the next match. */
export async function buildWeeklyDigest(db: SupabaseClient): Promise<Digest> {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: articles } = await db
    .from('articles')
    .select('slug, title, excerpt, type, published_at')
    .eq('status', 'published')
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(12);

  const or = RBNY_TEAM_IDS.flatMap((id) => [`home_team_id.eq.${id}`, `away_team_id.eq.${id}`]).join(',');
  const { data: nextRows } = await db
    .from('sm_fixtures')
    .select('home_team_name, away_team_name, starting_at')
    .eq('state', 'NS')
    .or(or)
    .gte('starting_at', new Date().toISOString())
    .order('starting_at', { ascending: true })
    .limit(1);
  const next = nextRows?.[0];

  const list = articles ?? [];
  const items = list
    .map(
      (a) => `
      <tr><td style="padding:0 0 22px 0;">
        <a href="${SITE_URL}/articles/${a.slug}" style="color:${RED};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-decoration:none;">${esc(a.type || 'Article')}</a>
        <a href="${SITE_URL}/articles/${a.slug}" style="display:block;color:#111;font-size:19px;font-weight:700;line-height:1.3;text-decoration:none;margin:4px 0 6px;">${esc(a.title)}</a>
        <div style="color:#555;font-size:14px;line-height:1.5;">${esc(a.excerpt || '')}</div>
      </td></tr>`,
    )
    .join('');

  const nextMatchBlock = next
    ? `<tr><td style="padding:18px 0 0;border-top:1px solid #eee;color:#555;font-size:14px;">
        <strong style="color:#111;">Next up:</strong> ${esc(next.home_team_name)} vs ${esc(next.away_team_name)} — ${new Date(next.starting_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </td></tr>`
    : '';

  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#0A0A0C;padding:24px;">
            <div style="color:#fff;font-size:20px;font-weight:800;">South Ward <span style="color:${RED};">Signal</span></div>
            <div style="color:#9a9aa5;font-size:12px;margin-top:4px;">This week in New York Red Bulls</div>
          </td></tr>
          <tr><td style="padding:28px 24px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}${nextMatchBlock}</table>
          </td></tr>
          <tr><td style="padding:20px 24px 28px;">
            <a href="${SITE_URL}/articles" style="display:inline-block;background:${RED};color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:8px;">Read more on the site →</a>
          </td></tr>
          <tr><td style="padding:18px 24px;background:#fafafa;color:#999;font-size:12px;line-height:1.5;border-top:1px solid #eee;">
            South Ward Signal · Independent, not affiliated with the New York Red Bulls or MLS.<br/>
            <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#999;">Unsubscribe</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;

  return {
    subject: `${SITE_NAME}: This week in RBNY${list[0] ? ` — ${list[0].title}` : ''}`.slice(0, 120),
    html,
    articleCount: list.length,
  };
}
