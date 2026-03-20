/**
 * South Ward Signal — ESPN MLS Data Sync
 *
 * Free, no-API-key sync from ESPN's public endpoints into Supabase sm_* tables.
 * Replaces SportMonks sync when no API token is available.
 *
 * Run: npm run sync-espn
 *
 * Tables updated: sm_teams, sm_seasons, sm_fixtures, sm_standings
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from apps/web/.env.local (where Supabase creds live)
config({ path: resolve(__dirname, '../apps/web/.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const ESPN_BASE = 'https://site.api.espn.com/apis';
const MLS_SPORT = 'soccer/usa.1';
const ESPN_RBNY_ID = 190;
const MLS_LEAGUE_ID = 779; // keep consistent with existing queries
const ESPN_SEASON_ID = 20260; // synthetic, avoids collision with SportMonks IDs

function log(msg: string) {
  console.log(`[espn-sync] ${new Date().toISOString()} ${msg}`);
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateRange(from: Date, to: Date): string {
  const f = `${from.getFullYear()}${pad(from.getMonth() + 1)}${pad(from.getDate())}`;
  const t = `${to.getFullYear()}${pad(to.getMonth() + 1)}${pad(to.getDate())}`;
  return `${f}-${t}`;
}

// ── Sync season ─────────────────────────────────────────────────

async function syncSeason(): Promise<void> {
  log('Syncing season...');

  // Mark all existing seasons as not current
  await db.from('sm_seasons').update({ is_current: false }).eq('is_current', true);

  // Upsert the ESPN 2026 season
  const { error } = await db.from('sm_seasons').upsert(
    {
      id: ESPN_SEASON_ID,
      league_id: MLS_LEAGUE_ID,
      year: 2026,
      is_current: true,
    },
    { onConflict: 'id' },
  );
  if (error) log(`  Warning: season upsert failed: ${error.message}`);
  else log('  Season 2026 set as current');
}

// ── Sync teams ──────────────────────────────────────────────────

async function syncTeams(): Promise<void> {
  log('Syncing MLS teams...');
  const data = await fetchJson<any>(`${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/teams`);

  const teams = data?.sports?.[0]?.leagues?.[0]?.teams || [];
  let count = 0;

  for (const entry of teams) {
    const t = entry.team || entry;
    const id = Number(t.id);
    if (!id) continue;

    const { error } = await db.from('sm_teams').upsert(
      {
        id,
        name: t.displayName || t.name,
        short_code: t.abbreviation || null,
        is_focus: id === ESPN_RBNY_ID,
      },
      { onConflict: 'id' },
    );
    if (error) log(`  Warning: team ${t.displayName} upsert failed: ${error.message}`);
    count++;
  }
  log(`  ${count} teams synced`);
}

// ── Sync RBNY fixtures (past results) ───────────────────────────

async function syncRBNYSchedule(): Promise<void> {
  log('Syncing RBNY schedule (past results)...');
  const data = await fetchJson<any>(
    `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/teams/${ESPN_RBNY_ID}/schedule?season=2026`,
  );

  const events = data?.events || [];
  let count = 0;

  for (const evt of events) {
    const row = parseFixture(evt);
    if (!row) continue;

    const { error } = await db.from('sm_fixtures').upsert(row, { onConflict: 'id' });
    if (error) log(`  Warning: fixture ${row.id} upsert failed: ${error.message}`);
    count++;
  }
  log(`  ${count} RBNY past fixtures synced`);
}

// ── Sync upcoming fixtures (all MLS, next 60 days) ──────────────

async function syncUpcomingFixtures(): Promise<void> {
  log('Syncing upcoming MLS fixtures...');

  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + 60);

  const dateRange = formatDateRange(now, future);
  const data = await fetchJson<any>(
    `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/scoreboard?dates=${dateRange}`,
  );

  const events = data?.events || [];
  let count = 0;

  for (const evt of events) {
    const row = parseFixture(evt);
    if (!row) continue;

    const { error } = await db.from('sm_fixtures').upsert(row, { onConflict: 'id' });
    if (error) log(`  Warning: fixture ${row.id} upsert failed: ${error.message}`);
    count++;
  }
  log(`  ${count} upcoming fixtures synced`);
}

// ── Extract score from ESPN's varying formats ──────────────────

function extractScore(score: any): number {
  if (score == null) return 0;
  if (typeof score === 'number') return score;
  if (typeof score === 'string') return Number(score) || 0;
  // Object format: { value: 1.0, displayValue: "1" }
  return Number(score.value ?? score.displayValue ?? 0);
}

// ── Parse ESPN event → sm_fixtures row ──────────────────────────

function parseFixture(evt: any) {
  const comp = evt.competitions?.[0];
  if (!comp) return null;

  const competitors = comp.competitors || [];
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');
  if (!home || !away) return null;

  const status = comp.status?.type;
  let state = 'NS';
  if (status?.state === 'post' || status?.completed) state = 'FT';
  else if (status?.state === 'in') state = 'LIVE';

  const homeScore = state === 'FT' || state === 'LIVE'
    ? extractScore(home.score)
    : null;
  const awayScore = state === 'FT' || state === 'LIVE'
    ? extractScore(away.score)
    : null;

  return {
    id: Number(evt.id),
    season_id: ESPN_SEASON_ID,
    league_id: MLS_LEAGUE_ID,
    home_team_id: Number(home.team?.id || home.id),
    away_team_id: Number(away.team?.id || away.id),
    home_team_name: home.team?.displayName || '',
    away_team_name: away.team?.displayName || '',
    starting_at: evt.date,
    state,
    home_score: homeScore,
    away_score: awayScore,
    length: 90,
  };
}

// ── Sync standings ──────────────────────────────────────────────

async function syncStandings(): Promise<void> {
  log('Syncing MLS standings...');
  const data = await fetchJson<any>(
    `${ESPN_BASE}/v2/sports/${MLS_SPORT}/standings?season=2026`,
  );

  const conferences = data?.children || [];
  let count = 0;

  for (const conf of conferences) {
    const confName = conf.name || conf.abbreviation || null; // "Eastern Conference" etc.
    const entries = conf.standings?.entries || [];

    for (const entry of entries) {
      const teamId = Number(entry.team?.id);
      if (!teamId) continue;

      const stats = parseStats(entry.stats || []);

      const { error } = await db.from('sm_standings').upsert(
        {
          season_id: ESPN_SEASON_ID,
          team_id: teamId,
          team_name: entry.team?.displayName || '',
          position: stats.rank,
          points: stats.points,
          won: stats.wins,
          drawn: stats.ties,
          lost: stats.losses,
          goals_for: stats.pointsFor,
          goals_against: stats.pointsAgainst,
          goal_difference: stats.pointDifferential,
          games_played: stats.gamesPlayed,
          form: null, // computed separately
          conference: confName,
        },
        { onConflict: 'season_id,team_id' },
      );
      if (error) log(`  Warning: standing for ${entry.team?.displayName} failed: ${error.message}`);
      count++;
    }
  }
  log(`  ${count} standings synced`);
}

function parseStats(stats: any[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of stats) {
    result[s.name || s.abbreviation] = Number(s.value) || 0;
  }
  return result;
}

// ── Sync match stats for RBNY finished fixtures ─────────────────

// ESPN stat name → sm_fixture_stats mapping
const STAT_MAP: Record<string, { code: string; typeId: number }> = {
  possessionPct: { code: 'ball-possession', typeId: 90001 },
  totalShots: { code: 'shots-total', typeId: 90002 },
  shotsOnTarget: { code: 'shots-on-target', typeId: 90003 },
};

async function syncMatchStats(): Promise<void> {
  log('Syncing RBNY match stats...');

  // Get RBNY finished fixtures that don't have stats yet
  const { data: fixtures } = await db
    .from('sm_fixtures')
    .select('id')
    .eq('state', 'FT')
    .eq('season_id', ESPN_SEASON_ID)
    .or(`home_team_id.eq.${ESPN_RBNY_ID},away_team_id.eq.${ESPN_RBNY_ID}`)
    .order('starting_at', { ascending: false })
    .limit(10);

  if (!fixtures?.length) {
    log('  No finished RBNY fixtures found');
    return;
  }

  let count = 0;
  for (const fix of fixtures) {
    // Check if stats already exist for this fixture
    const { count: existing } = await db
      .from('sm_fixture_stats')
      .select('*', { count: 'exact', head: true })
      .eq('fixture_id', fix.id)
      .in('stat_type_id', Object.values(STAT_MAP).map((s) => s.typeId));

    if (existing && existing > 0) continue; // already have stats

    try {
      const summary = await fetchJson<any>(
        `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/summary?event=${fix.id}`,
      );

      const teams = summary?.boxscore?.teams || [];
      for (const team of teams) {
        const teamId = Number(team.team?.id);
        if (!teamId) continue;

        const statArray = team.statistics || [];
        for (const stat of statArray) {
          const mapping = STAT_MAP[stat.name];
          if (!mapping) continue;

          const value = Number(stat.displayValue) || 0;
          await db.from('sm_fixture_stats').upsert(
            {
              fixture_id: fix.id,
              team_id: teamId,
              stat_type_id: mapping.typeId,
              stat_code: mapping.code,
              value,
            },
            { onConflict: 'fixture_id,team_id,stat_type_id' },
          );
          count++;
        }
      }
    } catch (err) {
      log(`  Warning: stats for fixture ${fix.id} failed: ${err}`);
    }
  }
  log(`  ${count} match stats synced`);
}

// ── Compute form from recent RBNY fixtures ──────────────────────

async function computeRBNYForm(): Promise<void> {
  log('Computing RBNY form...');

  const { data: fixtures } = await db
    .from('sm_fixtures')
    .select('home_team_id, home_score, away_score')
    .eq('state', 'FT')
    .or(`home_team_id.eq.${ESPN_RBNY_ID},away_team_id.eq.${ESPN_RBNY_ID}`)
    .order('starting_at', { ascending: false })
    .limit(5);

  if (!fixtures?.length) {
    log('  No fixtures found, skipping form');
    return;
  }

  const form = fixtures
    .map((f) => {
      const isHome = f.home_team_id === ESPN_RBNY_ID;
      const gf = isHome ? f.home_score : f.away_score;
      const ga = isHome ? f.away_score : f.home_score;
      return gf > ga ? 'W' : gf === ga ? 'D' : 'L';
    })
    .reverse() // oldest first
    .join('');

  const { error } = await db
    .from('sm_standings')
    .update({ form })
    .eq('season_id', ESPN_SEASON_ID)
    .eq('team_id', ESPN_RBNY_ID);

  if (error) log(`  Warning: form update failed: ${error.message}`);
  else log(`  RBNY form: ${form}`);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  log('=== ESPN MLS Sync ===');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  await syncSeason();
  await syncTeams();
  await syncRBNYSchedule();
  await syncUpcomingFixtures();
  await syncStandings();
  await syncMatchStats();
  await computeRBNYForm();

  log('=== Sync complete ===');
}

main().catch((err) => {
  console.error('[espn-sync] Fatal error:', err);
  process.exit(1);
});
