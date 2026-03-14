/**
 * South Ward Signal — SportMonks Historical Backfill
 *
 * Imports MLS seasons with xG, player stats, lineups, events.
 * Uses batched upserts for performance.
 *
 * Run: npm run backfill-sportmonks
 *
 * Options (env vars):
 *   BACKFILL_START_YEAR=2005  — start year (default: 2005)
 *   BACKFILL_END_YEAR=2026    — end year (default: 2026)
 *   BACKFILL_ALL_TEAMS=true   — sync all teams in league, not just RBNY
 */

import { createClient } from '@supabase/supabase-js';
import {
  smFetch,
  smFetchAll,
  parseScores,
  mapState,
  STAT_TYPES,
  EVENT_TYPES,
  PLAYER_STAT_TYPES,
  MLS_LEAGUE_ID,
  RBNY_TEAM_ID,
} from './sportmonks-client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const START_YEAR = Number(process.env.BACKFILL_START_YEAR) || 2005;
const END_YEAR = Number(process.env.BACKFILL_END_YEAR) || 2026;
const ALL_TEAMS = process.env.BACKFILL_ALL_TEAMS === 'true';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

function log(msg: string) {
  console.log(`[backfill] ${new Date().toISOString()} ${msg}`);
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Batch helper ─────────────────────────────────────────────────

async function batchUpsert(table: string, rows: any[], conflict: string, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await db.from(table).upsert(batch, { onConflict: conflict });
    if (error) log(`  Warning: batch upsert to ${table} failed: ${error.message}`);
  }
}

// ── Get all MLS seasons ───────────────────────────────────────────

async function getAllSeasons() {
  log('Fetching all MLS seasons...');
  const seasons = await smFetchAll('/seasons', {
    filters: `seasonLeagues:${MLS_LEAGUE_ID}`,
  });

  const filtered = seasons
    .filter((s: any) => {
      const year = Number(s.name);
      return year >= START_YEAR && year <= END_YEAR;
    })
    .sort((a: any, b: any) => Number(a.name) - Number(b.name));

  log(`  Found ${filtered.length} seasons (${START_YEAR}–${END_YEAR})`);
  return filtered;
}

// ── Sync teams for a season ───────────────────────────────────────

async function syncSeasonTeams(seasonId: number) {
  const teams = await smFetchAll(`/teams/seasons/${seasonId}`);
  const rows = teams.map((t: any) => ({
    id: t.id,
    name: t.name,
    short_code: t.short_code,
    founded: t.founded,
    logo_path: t.image_path,
    venue_id: t.venue_id,
    country_id: t.country_id,
    is_focus: t.id === RBNY_TEAM_ID,
  }));
  await batchUpsert('sm_teams', rows, 'id');
  return teams;
}

// ── Process fixtures for a season (batched) ──────────────────────

async function processSeasonFixtures(seasonId: number, year: number) {
  const baseFilters = [`fixtureLeagues:${MLS_LEAGUE_ID}`];
  if (!ALL_TEAMS) {
    baseFilters.push(`fixtureParticipants:${RBNY_TEAM_ID}`);
  }

  const chunks: { from: string; to: string }[] = [];
  for (let month = 1; month <= 12; month += 3) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = Math.min(month + 2, 12);
    const lastDay = new Date(year, endMonth, 0).getDate();
    const to = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
    chunks.push({ from, to });
  }

  log(`  Fetching fixtures in ${chunks.length} chunks...`);

  let fixtures: any[] = [];
  for (const chunk of chunks) {
    try {
      const batch = await smFetchAll(`/fixtures/between/${chunk.from}/${chunk.to}`, {
        filters: baseFilters.join(';'),
        include: 'statistics.type;events.type;lineups.details.type;scores;participants;xGFixture.type',
      });
      fixtures.push(...batch);
    } catch (err) {
      log(`  Warning: chunk ${chunk.from}–${chunk.to} for ${year}: ${err}`);
    }
  }

  log(`  Processing ${fixtures.length} fixtures...`);

  // Collect all rows for batch upsert
  const fixtureRows: any[] = [];
  const statRows: any[] = [];
  const statDedup = new Set<string>();
  const eventRows: any[] = [];
  const lineupRows: any[] = [];
  const playerStatRows: any[] = [];
  const teamRows: any[] = [];

  for (const f of fixtures) {
    const participants = f.participants || [];
    const homePart = participants.find((p: any) => p.meta?.location === 'home');
    const awayPart = participants.find((p: any) => p.meta?.location === 'away');

    const homeTeamId = homePart?.id || null;
    const awayTeamId = awayPart?.id || null;

    // Collect team rows
    for (const part of [homePart, awayPart].filter(Boolean)) {
      teamRows.push({
        id: part.id,
        name: part.name,
        short_code: part.short_code || null,
        founded: part.founded || null,
        logo_path: part.image_path || null,
        is_focus: part.id === RBNY_TEAM_ID,
      });
    }

    const scores = parseScores(f.scores || []);

    fixtureRows.push({
      id: f.id,
      season_id: seasonId,
      league_id: f.league_id || MLS_LEAGUE_ID,
      round_id: f.round_id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_name: homePart?.name || '',
      away_team_name: awayPart?.name || '',
      starting_at: f.starting_at,
      state: mapState(f.state_id),
      result_info: f.result_info,
      venue_id: f.venue_id,
      home_score: scores.home,
      away_score: scores.away,
      ht_home: scores.htHome,
      ht_away: scores.htAway,
      length: f.length || 90,
    });

    // Statistics (dedup by fixture+team+type)
    for (const stat of f.statistics || []) {
      const typeId = stat.type_id;
      const code = stat.type?.code || STAT_TYPES[typeId] || `type-${typeId}`;
      const teamId = stat.participant_id;
      if (teamId && stat.data?.value != null) {
        const key = `${f.id}-${teamId}-${typeId}`;
        if (!statDedup.has(key)) {
          statDedup.add(key);
          statRows.push({
            fixture_id: f.id,
            team_id: teamId,
            stat_type_id: typeId,
            stat_code: code,
            value: stat.data.value,
          });
        }
      }
    }

    // xGFixture stats (dedup with regular stats)
    const xgStats = f.xgfixture || f.xGFixture || [];
    for (const xg of xgStats) {
      const typeId = xg.type_id;
      const code = xg.type?.code || STAT_TYPES[typeId] || `xg-type-${typeId}`;
      const teamId = xg.participant_id;
      if (teamId && xg.data?.value != null) {
        const key = `${f.id}-${teamId}-${typeId}`;
        if (!statDedup.has(key)) {
          statDedup.add(key);
          statRows.push({
            fixture_id: f.id,
            team_id: teamId,
            stat_type_id: typeId,
            stat_code: code,
            value: xg.data.value,
          });
        }
      }
    }

    // Events
    for (const evt of f.events || []) {
      const eventType = evt.type?.code || EVENT_TYPES[evt.type_id] || 'unknown';
      eventRows.push({
        id: evt.id,
        fixture_id: f.id,
        team_id: evt.participant_id,
        player_id: evt.player_id,
        player_name: evt.player_name,
        related_player: evt.related_player_name,
        type_id: evt.type_id,
        event_type: eventType,
        minute: evt.minute,
        extra_minute: evt.extra_minute,
        detail: evt.addition,
      });
    }

    // Lineups + player-level stats
    for (const lu of f.lineups || []) {
      lineupRows.push({
        id: lu.id,
        fixture_id: f.id,
        team_id: lu.team_id,
        player_id: lu.player_id,
        player_name: lu.player_name,
        jersey_number: lu.jersey_number,
        position: lu.position || null,
        is_starter: lu.type_id === 11,
        formation_position: lu.formation_position || null,
      });

      for (const det of lu.details || []) {
        const typeId = det.type_id;
        const code = det.type?.developer_name?.toLowerCase()?.replace(/_/g, '-') ||
                     det.type?.code ||
                     PLAYER_STAT_TYPES[typeId] ||
                     `player-type-${typeId}`;
        const val = det.data?.value;
        if (val != null && typeof val === 'number') {
          playerStatRows.push({
            fixture_id: f.id,
            player_id: lu.player_id,
            team_id: lu.team_id,
            stat_type_id: typeId,
            stat_code: code,
            value: val,
          });
        }
      }
    }
  }

  // Batch upsert everything
  if (teamRows.length) {
    // Dedup teams by ID
    const seen = new Set<number>();
    const uniqueTeams = teamRows.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    await batchUpsert('sm_teams', uniqueTeams, 'id');
  }

  log(`  Writing ${fixtureRows.length} fixtures...`);
  await batchUpsert('sm_fixtures', fixtureRows, 'id');

  if (statRows.length) {
    log(`  Writing ${statRows.length} stats (incl xG)...`);
    await batchUpsert('sm_fixture_stats', statRows, 'fixture_id,team_id,stat_type_id');
  }

  if (eventRows.length) {
    log(`  Writing ${eventRows.length} events...`);
    await batchUpsert('sm_events', eventRows, 'id');
  }

  if (lineupRows.length) {
    log(`  Writing ${lineupRows.length} lineups...`);
    await batchUpsert('sm_lineups', lineupRows, 'id');
  }

  if (playerStatRows.length) {
    log(`  Writing ${playerStatRows.length} player stats...`);
    await batchUpsert('sm_lineup_stats', playerStatRows, 'fixture_id,player_id,stat_type_id');
  }

  log(`  Done: ${fixtureRows.length} fixtures, ${statRows.length} stats, ${eventRows.length} events, ${lineupRows.length} lineups, ${playerStatRows.length} player stats`);
  return fixtureRows.length;
}

// ── Sync standings for a season ───────────────────────────────────

async function syncSeasonStandings(seasonId: number) {
  try {
    const { data } = await smFetch(`/standings/seasons/${seasonId}`, {
      include: 'participant',
    });

    const rows: any[] = [];
    for (const group of data || []) {
      const entries = group.details || group.standings || (Array.isArray(group) ? group : [group]);
      for (const row of Array.isArray(entries) ? entries : [entries]) {
        if (!row.team_id && !row.participant_id) continue;
        const teamId = row.team_id || row.participant_id;
        rows.push({
          season_id: seasonId,
          team_id: teamId,
          team_name: row.participant?.name || '',
          position: row.position || row.ranking || 0,
          points: row.points ?? 0,
          won: row.won ?? row.result?.won ?? 0,
          drawn: row.drawn ?? row.result?.draw ?? 0,
          lost: row.lost ?? row.result?.lost ?? 0,
          goals_for: row.goals_for ?? row.result?.goals_scored ?? 0,
          goals_against: row.goals_against ?? row.result?.goals_against ?? 0,
          goal_difference: (row.goals_for ?? 0) - (row.goals_against ?? 0),
          games_played: row.games_played ?? row.result?.games_played ?? 0,
          form: row.recent_form || row.form || null,
          conference: row.group?.name || null,
        });
      }
    }
    await batchUpsert('sm_standings', rows, 'season_id,team_id');
    return rows.length;
  } catch {
    return 0;
  }
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  log('=== SportMonks Historical Backfill ===');
  log(`Range: ${START_YEAR}–${END_YEAR} | Mode: ${ALL_TEAMS ? 'All MLS teams' : 'RBNY only'}`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const seasons = await getAllSeasons();
  let totalFixtures = 0;
  let totalStandings = 0;

  for (const season of seasons) {
    const year = Number(season.name);
    log(`\n── Season ${year} (ID: ${season.id}) ──`);

    // Upsert season
    await db.from('sm_seasons').upsert({
      id: season.id,
      league_id: season.league_id,
      year,
      is_current: season.is_current ?? false,
    }, { onConflict: 'id' });

    // Sync teams for this season
    await syncSeasonTeams(season.id);

    // Process fixtures (batched)
    const fixtureCount = await processSeasonFixtures(season.id, year);
    totalFixtures += fixtureCount;

    // Sync standings
    const standingsCount = await syncSeasonStandings(season.id);
    totalStandings += standingsCount;

    log(`  Season ${year}: ${fixtureCount} fixtures, ${standingsCount} standings`);

    // Pause between seasons to respect rate limits
    await delay(2000);
  }

  log(`\n=== Backfill Complete ===`);
  log(`Total: ${totalFixtures} fixtures, ${totalStandings} standings across ${seasons.length} seasons`);
}

main().catch((err) => {
  console.error('[backfill] Fatal error:', err);
  process.exit(1);
});
