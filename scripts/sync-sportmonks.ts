/**
 * South Ward Signal — SportMonks Daily Sync
 *
 * Syncs current season data from SportMonks API into Supabase.
 * Run daily via cron or manually: npm run sync-sportmonks
 *
 * Tables updated: sm_teams, sm_seasons, sm_fixtures, sm_fixture_stats,
 *                 sm_events, sm_lineups, sm_standings, sm_players
 */

import { createClient } from '@supabase/supabase-js';
import {
  smFetch,
  smFetchAll,
  getSeasonTeams,
  getStandings,
  getTeamSquad,
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

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

function log(msg: string) {
  console.log(`[sync] ${new Date().toISOString()} ${msg}`);
}

// ── Sync seasons ──────────────────────────────────────────────────

async function syncSeasons(): Promise<number> {
  log('Syncing MLS seasons...');
  const seasons = await smFetchAll('/seasons', {
    filters: `seasonLeagues:${MLS_LEAGUE_ID}`,
  });

  for (const s of seasons) {
    await db.from('sm_seasons').upsert({
      id: s.id,
      league_id: s.league_id,
      year: Number(s.name),
      is_current: s.is_current ?? false,
    }, { onConflict: 'id' });
  }

  const current = seasons.find((s: any) => s.is_current);
  log(`  ${seasons.length} seasons synced. Current: ${current?.name} (${current?.id})`);
  return current?.id || 0;
}

// ── Sync teams ────────────────────────────────────────────────────

async function syncTeams(seasonId: number) {
  log('Syncing teams...');
  const teams = await getSeasonTeams(seasonId);

  for (const t of teams) {
    await db.from('sm_teams').upsert({
      id: t.id,
      name: t.name,
      short_code: t.short_code,
      founded: t.founded,
      logo_path: t.image_path,
      venue_id: t.venue_id,
      country_id: t.country_id,
      is_focus: t.id === RBNY_TEAM_ID,
    }, { onConflict: 'id' });
  }
  log(`  ${teams.length} teams synced`);
}

// ── Batch helper ─────────────────────────────────────────────────

async function batchUpsert(table: string, rows: any[], conflict: string, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await db.from(table).upsert(batch, { onConflict: conflict });
    if (error) log(`  Warning: batch upsert to ${table} failed: ${error.message}`);
  }
}

// ── Sync fixtures + stats + events + lineups ──────────────────────

async function syncFixtures(seasonId: number) {
  log('Syncing fixtures with stats, events, lineups...');

  // Fetch fixtures in 90-day chunks (API max is 100 days)
  const now = new Date();
  const year = now.getFullYear();
  const chunks: { from: string; to: string }[] = [];

  for (let month = 1; month <= 12; month += 3) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = Math.min(month + 2, 12);
    const lastDay = new Date(year, endMonth, 0).getDate();
    const to = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
    chunks.push({ from, to });
  }

  const fixtures: any[] = [];
  for (const chunk of chunks) {
    try {
      const batch = await smFetchAll('/fixtures/between/' + chunk.from + '/' + chunk.to, {
        filters: `fixtureLeagues:${MLS_LEAGUE_ID}`,
        include: 'statistics.type;events.type;lineups.details.type;scores;participants;xGFixture.type',
      });
      fixtures.push(...batch);
    } catch (err) {
      log(`  Warning: chunk ${chunk.from}–${chunk.to} failed: ${err}`);
    }
  }

  log(`  Fetched ${fixtures.length} fixtures across ${chunks.length} chunks`);

  // Collect all rows for batch upsert
  const fixtureRows: any[] = [];
  const statRows: any[] = [];
  const statDedup = new Set<string>();
  const eventRows: any[] = [];
  const lineupRows: any[] = [];
  const playerStatRows: any[] = [];

  for (const f of fixtures) {
    const participants = f.participants || [];
    const homePart = participants.find((p: any) => p.meta?.location === 'home');
    const awayPart = participants.find((p: any) => p.meta?.location === 'away');

    const homeTeamId = homePart?.id || f.home_team_id;
    const awayTeamId = awayPart?.id || f.away_team_id;
    const homeTeamName = homePart?.name || '';
    const awayTeamName = awayPart?.name || '';
    const scores = parseScores(f.scores || []);

    fixtureRows.push({
      id: f.id,
      season_id: seasonId,
      league_id: f.league_id || MLS_LEAGUE_ID,
      round_id: f.round_id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_name: homeTeamName,
      away_team_name: awayTeamName,
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

    // Collect statistics (dedup by fixture+team+type)
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

    // Collect xGFixture stats (same table as statistics, dedup by key)
    const xgStats = f.xgfixture || f.xGFixture || [];
    for (const xg of xgStats) {
      const typeId = xg.type_id;
      const code = xg.type?.code || STAT_TYPES[typeId] || `xg-type-${typeId}`;
      const teamId = xg.participant_id;
      if (teamId && xg.data?.value != null) {
        // Only add if not already present from regular statistics
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

    // Collect events
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

    // Collect lineups + player-level stats
    for (const lu of f.lineups || []) {
      const isStarter = lu.type_id === 11;
      lineupRows.push({
        id: lu.id,
        fixture_id: f.id,
        team_id: lu.team_id,
        player_id: lu.player_id,
        player_name: lu.player_name,
        jersey_number: lu.jersey_number,
        position: lu.position || null,
        is_starter: isStarter,
        formation_position: lu.formation_position || null,
      });

      for (const det of lu.details || []) {
        const typeId = det.type_id;
        const code = det.type?.developer_name?.toLowerCase()?.replace(/_/g, '-') ||
                     det.type?.code ||
                     PLAYER_STAT_TYPES[typeId] ||
                     `player-type-${typeId}`;
        // Skip boolean values (e.g. captain=true) — only store numeric
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
  log(`  Writing ${fixtureRows.length} fixtures...`);
  await batchUpsert('sm_fixtures', fixtureRows, 'id');

  log(`  Writing ${statRows.length} stats (incl xG)...`);
  await batchUpsert('sm_fixture_stats', statRows, 'fixture_id,team_id,stat_type_id');

  log(`  Writing ${eventRows.length} events...`);
  await batchUpsert('sm_events', eventRows, 'id');

  log(`  Writing ${lineupRows.length} lineups...`);
  await batchUpsert('sm_lineups', lineupRows, 'id');

  log(`  Writing ${playerStatRows.length} player stats...`);
  await batchUpsert('sm_lineup_stats', playerStatRows, 'fixture_id,player_id,stat_type_id');

  log(`  Done: ${fixtureRows.length} fixtures, ${statRows.length} stats, ${eventRows.length} events, ${lineupRows.length} lineups, ${playerStatRows.length} player stats`);
}

// ── Sync standings ────────────────────────────────────────────────

async function syncStandings(seasonId: number) {
  log('Syncing standings...');

  try {
    const standingsData = await getStandings(seasonId);
    let count = 0;

    // SportMonks returns standings grouped by stage/group
    for (const group of standingsData) {
      const details = group.details || group.standings || group;
      const entries = Array.isArray(details) ? details : [details];

      for (const entry of entries) {
        // Handle nested standings arrays
        const rows = entry.standings || entry.details || (Array.isArray(entry) ? entry : [entry]);
        for (const row of Array.isArray(rows) ? rows : [rows]) {
          if (!row.team_id && !row.participant_id) continue;

          const teamId = row.team_id || row.participant_id;
          const teamName = row.participant?.name || row.team_name || '';

          await db.from('sm_standings').upsert({
            season_id: seasonId,
            team_id: teamId,
            team_name: teamName,
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
          }, { onConflict: 'season_id,team_id' });
          count++;
        }
      }
    }
    log(`  ${count} standing entries synced`);
  } catch (err) {
    log(`  Standings sync failed (may not be available yet): ${err}`);
  }
}

// ── Sync RBNY squad ───────────────────────────────────────────────

async function syncPlayers() {
  log('Syncing RBNY squad...');

  try {
    const teamData = await getTeamSquad(RBNY_TEAM_ID);
    const players = teamData?.players || teamData?.[0]?.players || [];

    for (const p of players) {
      await db.from('sm_players').upsert({
        id: p.player_id || p.id,
        name: p.player?.common_name || p.player?.display_name || p.player_name || 'Unknown',
        common_name: p.player?.common_name || null,
        position: p.position?.name || null,
        detailed_position: p.detailed_position?.name || p.position?.name || null,
        nationality: p.player?.nationality?.name || null,
        date_of_birth: p.player?.date_of_birth || null,
        height: p.player?.height || null,
        weight: p.player?.weight || null,
        jersey_number: p.jersey_number,
        team_id: RBNY_TEAM_ID,
        image_path: p.player?.image_path || null,
      }, { onConflict: 'id' });
    }
    log(`  ${players.length} players synced`);
  } catch (err) {
    log(`  Player sync failed: ${err}`);
  }
}

// ── Refresh materialized view ─────────────────────────────────────

async function refreshViews() {
  log('Refreshing materialized views...');
  try {
    await db.rpc('refresh_sm_stats_flat');
  } catch {
    log('  (skipped — RPC not available)');
  }
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  log('=== SportMonks Daily Sync ===');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const currentSeasonId = await syncSeasons();
  if (!currentSeasonId) {
    log('ERROR: No current season found');
    process.exit(1);
  }

  await syncTeams(currentSeasonId);
  await syncFixtures(currentSeasonId);
  await syncStandings(currentSeasonId);
  await syncPlayers();
  await refreshViews();

  log('=== Sync complete ===');
}

main().catch((err) => {
  console.error('[sync] Fatal error:', err);
  process.exit(1);
});
