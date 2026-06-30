import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnthropic, AI_MODEL } from './anthropic';
import { markdownToHtml } from './markdown';

/**
 * Auto-draft NYRB match recaps from synced ESPN data.
 * Assembles the match facts, generates a recap in the South Ward Signal voice,
 * and inserts it as a DRAFT linked to the fixture (human reviews before publish).
 */

const ESPN_BASE = 'https://site.api.espn.com/apis';
const MLS_SPORT = 'soccer/usa.1';
const RBNY_TEAM_IDS = [190, 383];

export interface RecapResult {
  fixtureId: number;
  articleId?: string;
  title?: string;
  skipped?: string;
  error?: string;
}

async function fetchJson<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const RECAP_SYSTEM_PROMPT = `You are the lead match writer for South Ward Signal, an independent, supporter-born outlet covering the New York Red Bulls (RBNY). You write post-match recaps that are accurate, sharp, and grounded in data.

## VOICE
Supporter's passion, analyst's rigor. Short, punchy New York sentences. Confident after a win, honest after a loss, never neutral wire-service filler. Use "RBNY" or "the Red Bulls" — never "New York" alone (ambiguous with NYCFC). Refer to opponents by their common name.

## HARD RULES — breaking these is failure
- Use ONLY the facts provided below. NEVER invent goals, scorers, minutes, stats, quotes, or events.
- If goal scorers are not provided, describe the result and stats without naming who scored.
- Never fabricate quotes or paraphrase anyone as if quoting. No quotes at all unless provided.
- Every number must come from the data block. Do not estimate.

## WRITE LIKE A HUMAN — avoid AI tells
- No inflated/promotional phrasing ("a testament to", "statement win", "sent a message"), unless the result truly earns it and you mean it plainly.
- Vary sentence length. Don't overuse em dashes. Avoid the rule-of-three reflex.
- No throat-clearing ("It's worth noting", "In conclusion"). Get to the point.
- Cut filler adjectives. Concrete nouns and verbs.

## OUTPUT FORMAT — follow exactly
TITLE: <headline, specific, names the opponent and result angle>
EXCERPT: <1 sentence hook, ~140 chars>
SEO_TITLE: <max 60 chars>
SEO_DESCRIPTION: <max 155 chars>
TAGS: <comma-separated, lowercase; include rbny>
---
<the article body in Markdown>

Body structure: a strong opening paragraph (the story + score), 2-3 short sections with ## headings (what happened, tactical read, what's next / standings context), and a short "## By the Numbers" bullet list of the key stats provided. Target 450-750 words. Output ONLY the format above — no preamble, no code fences.`;

interface RecapData {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  rbnyIsHome: boolean;
  opponent: string;
  resultWord: string;
  stats: string[];
  goals: string[];
  standingLine: string | null;
}

async function assembleRecapData(db: SupabaseClient, fixtureId: number): Promise<RecapData | null> {
  const { data: f } = await db
    .from('sm_fixtures')
    .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score, starting_at, state, season_id')
    .eq('id', fixtureId)
    .single();
  if (!f || f.state !== 'FT') return null;

  const rbnyIsHome = RBNY_TEAM_IDS.includes(f.home_team_id);
  const rbnyScore = rbnyIsHome ? f.home_score : f.away_score;
  const oppScore = rbnyIsHome ? f.away_score : f.home_score;
  const opponent = rbnyIsHome ? f.away_team_name : f.home_team_name;
  const resultWord = rbnyScore > oppScore ? 'win' : rbnyScore < oppScore ? 'loss' : 'draw';

  // Team stats (possession / shots / shots on target) from the synced stats.
  const { data: statRows } = await db
    .from('sm_fixture_stats')
    .select('team_id, stat_code, value')
    .eq('fixture_id', fixtureId);
  const byCode: Record<string, { home: number; away: number }> = {};
  for (const s of statRows || []) {
    const side = s.team_id === f.home_team_id ? 'home' : 'away';
    byCode[s.stat_code] ??= { home: 0, away: 0 };
    byCode[s.stat_code][side] = Number(s.value) || 0;
  }
  const stats: string[] = [];
  const statLabel: Record<string, string> = {
    'ball-possession': 'Possession (%)',
    'shots-total': 'Shots',
    'shots-on-target': 'Shots on target',
  };
  for (const [code, label] of Object.entries(statLabel)) {
    if (byCode[code]) stats.push(`${label}: ${f.home_team_name} ${byCode[code].home} — ${byCode[code].away} ${f.away_team_name}`);
  }

  // Goal scorers — best-effort from the ESPN match summary.
  const goals: string[] = [];
  const summary = await fetchJson<any>(`${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/summary?event=${fixtureId}`);
  const plays = summary?.scoringPlays || summary?.keyEvents || [];
  for (const p of plays) {
    const typeText = (p.type?.text || p.type?.name || '').toLowerCase();
    const isGoal = Boolean(summary?.scoringPlays) || typeText.includes('goal');
    if (!isGoal) continue;
    const team = p.team?.displayName || '';
    const minute = p.clock?.displayValue || (p.time?.displayValue ?? '');
    const scorer = p.athletesInvolved?.[0]?.displayName || p.scorer?.displayName || '';
    if (scorer) goals.push(`${minute ? minute + ' ' : ''}${scorer}${team ? ` (${team})` : ''}`);
    else if (p.text) goals.push(p.text);
  }

  // Standings context.
  let standingLine: string | null = null;
  const { data: st } = await db
    .from('sm_standings')
    .select('position, points, won, drawn, lost, form, conference, team_id, season_id')
    .eq('season_id', f.season_id)
    .in('team_id', RBNY_TEAM_IDS)
    .limit(1);
  if (st?.[0]) {
    const s = st[0];
    standingLine = `RBNY sit ${ordinal(s.position)}${s.conference ? ` in the ${s.conference}` : ''} on ${s.points} points (${s.won}W-${s.drawn}D-${s.lost}L)${s.form ? `, recent form ${s.form}` : ''}.`;
  }

  return {
    fixtureId,
    homeTeam: f.home_team_name,
    awayTeam: f.away_team_name,
    homeScore: f.home_score,
    awayScore: f.away_score,
    date: f.starting_at,
    rbnyIsHome,
    opponent,
    resultWord,
    stats,
    goals,
    standingLine,
  };
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildRecapPrompt(d: RecapData): string {
  const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
  return `Write a South Ward Signal match recap.

## MATCH FACTS (use only these)
- Date: ${dateStr}
- Final score: ${d.homeTeam} ${d.homeScore} — ${d.awayScore} ${d.awayTeam}
- RBNY played ${d.rbnyIsHome ? 'at home' : 'away'} vs ${d.opponent}. Result for RBNY: ${d.resultWord}.

### Goals
${d.goals.length ? d.goals.map((g) => `- ${g}`).join('\n') : 'Goal scorers were not available in the data — do NOT name scorers; write around the result and stats.'}

### Team stats
${d.stats.length ? d.stats.map((s) => `- ${s}`).join('\n') : 'No detailed team stats available — focus on the result and standings context.'}

### Standings context
${d.standingLine || 'No standings context available.'}

Write the recap now, following the exact output format from the system prompt.`;
}

interface ParsedRecap {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  body: string;
}

function parseRecap(raw: string): ParsedRecap | null {
  let text = raw.trim();
  const fence = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();

  const idx = text.search(/^---\s*$/m);
  if (idx === -1) return null;
  const header = text.slice(0, idx);
  const body = text.slice(idx).replace(/^---\s*$/m, '').trim();

  const get = (key: string) => {
    const m = header.match(new RegExp(`^${key}:\\s*(.+)$`, 'im'));
    return m ? m[1].trim() : '';
  };
  const title = get('TITLE');
  if (!title || !body) return null;
  const excerpt = get('EXCERPT');
  const tags = (get('TAGS') || 'rbny, match-recap')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!tags.includes('rbny')) tags.unshift('rbny');
  if (!tags.includes('match-recap')) tags.push('match-recap');

  return {
    title,
    excerpt,
    seoTitle: (get('SEO_TITLE') || title).slice(0, 60),
    seoDescription: (get('SEO_DESCRIPTION') || excerpt).slice(0, 155),
    tags,
    body,
  };
}

const DISCLOSURE = '\n\n*Drafted with AI from match data and reviewed by the South Ward Signal desk.*';

/** Draft a recap for one finished fixture. Skips if a recap already exists. */
export async function draftRecapForFixture(
  db: SupabaseClient,
  fixtureId: number,
  opts: { force?: boolean } = {},
): Promise<RecapResult> {
  try {
    if (!opts.force) {
      const { data: existing } = await db
        .from('articles')
        .select('id, social_content')
        .eq('type', 'match-recap');
      const hit = (existing || []).find(
        (r: { social_content?: { sm_fixture_id?: number | string } | null }) =>
          String(r.social_content?.sm_fixture_id) === String(fixtureId),
      );
      if (hit) return { fixtureId, skipped: 'recap already exists', articleId: hit.id };
    }

    const data = await assembleRecapData(db, fixtureId);
    if (!data) return { fixtureId, skipped: 'fixture not found or not finished' };

    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: RECAP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildRecapPrompt(data) }],
    });
    const raw = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();

    const parsed = parseRecap(raw);
    if (!parsed) return { fixtureId, error: 'Could not parse recap output' };

    const bodyMd = parsed.body + DISCLOSURE;
    const slug = `${slugify(parsed.title)}-${(data.date || '').slice(0, 10).replace(/-/g, '')}`.replace(/-+$/, '');
    const now = new Date().toISOString();

    const { data: inserted, error } = await db
      .from('articles')
      .insert({
        title: parsed.title,
        slug,
        body: bodyMd,
        html_body: markdownToHtml(bodyMd),
        excerpt: parsed.excerpt,
        type: 'match-recap',
        tags: parsed.tags,
        featured_image: null,
        seo_title: parsed.seoTitle,
        seo_description: parsed.seoDescription,
        word_count: countWords(bodyMd),
        status: 'draft',
        // articles.match_id has an FK to the legacy `matches` table, so we link
        // the recap to its sm_fixtures id here instead (invisible, edit-safe).
        social_content: { sm_fixture_id: fixtureId },
        created_at: now,
      })
      .select('id')
      .single();

    if (error) return { fixtureId, error: error.message };
    return { fixtureId, articleId: inserted.id, title: parsed.title };
  } catch (err) {
    return { fixtureId, error: (err as Error).message };
  }
}

/** Draft recaps for recently-finished RBNY fixtures that don't have one yet. */
export async function draftPendingRecaps(
  db: SupabaseClient,
  opts: { maxAgeHours?: number; limit?: number } = {},
): Promise<RecapResult[]> {
  const maxAgeHours = opts.maxAgeHours ?? 72;
  const limit = opts.limit ?? 3;
  const since = new Date(Date.now() - maxAgeHours * 3_600_000).toISOString();

  const orFilter = RBNY_TEAM_IDS.flatMap((id) => [`home_team_id.eq.${id}`, `away_team_id.eq.${id}`]).join(',');
  const { data: fixtures } = await db
    .from('sm_fixtures')
    .select('id')
    .eq('state', 'FT')
    .gte('starting_at', since)
    .or(orFilter)
    .order('starting_at', { ascending: false })
    .limit(20);

  if (!fixtures?.length) return [];

  const results: RecapResult[] = [];
  let drafted = 0;
  for (const f of fixtures) {
    if (drafted >= limit) break;
    const r = await draftRecapForFixture(db, Number(f.id));
    results.push(r);
    if (r.articleId && !r.skipped) drafted++;
  }
  return results;
}
