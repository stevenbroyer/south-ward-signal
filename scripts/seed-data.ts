/**
 * South Ward Signal — Data Seeder
 *
 * Populates Supabase with current season data from API-Football and ASA.
 * Run nightly at 3am ET for full sync, or manually for initial setup.
 *
 * Tables populated: matches, standings, player_stats,
 *                   team_match_advanced, team_season_stats
 */

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const API_FOOTBALL_HOST = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

const MLS_LEAGUE_ID = 253;
const NYRB_TEAM_ID = 1602;
const API_FOOTBALL_SEASON = 2024;  // Free tier limit: 2022-2024
const CURRENT_SEASON = 2025;       // MLS 2025 season (completed, full ASA data)
const ASA_BASE = "https://app.americansocceranalysis.com/api/v1";

async function fetchJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function notify(msg: string, err = false) {
  console.log(`[${err ? "ERROR" : "INFO"}] ${msg}`);
  if (DISCORD_WEBHOOK) {
    try { await fetch(DISCORD_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `${err ? "🚨" : "🔄"} **Data Seed**: ${msg}` }) }); } catch {}
  }
}

async function upsertSupabase(table: string, records: any[], conflictColumn = "id") {
  if (!records.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[UPSERT] ${table}: ${res.status} — ${text}`);
  }
}

function rateLimit(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Sync matches ────────────────────────────────────────────────────────────

async function syncMatches() {
  console.log("[MATCHES] Fetching NYRB fixtures...");
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };
  const data = await fetchJSON(
    `https://${API_FOOTBALL_HOST}/fixtures?league=${MLS_LEAGUE_ID}&season=${API_FOOTBALL_SEASON}&team=${NYRB_TEAM_ID}`,
    headers
  );

  const fixtures = data.response || [];
  const records = fixtures.map((f: any) => ({
    id: String(f.fixture.id),
    date: f.fixture.date,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_team_id: String(f.teams.home.id),
    away_team_id: String(f.teams.away.id),
    home_score: f.goals.home,
    away_score: f.goals.away,
    status: f.fixture.status.short === "FT" ? "finished"
      : f.fixture.status.short === "NS" ? "scheduled"
      : f.fixture.status.short === "PST" ? "postponed"
      : f.fixture.status.short === "CANC" ? "cancelled"
      : f.fixture.status.short === "LIVE" || f.fixture.status.short === "1H" || f.fixture.status.short === "2H" ? "live"
      : "scheduled",
    venue: f.fixture.venue?.name || null,
    competition: "MLS",
    season: API_FOOTBALL_SEASON,
    updated_at: new Date().toISOString(),
  }));

  await upsertSupabase("matches", records);
  console.log(`[MATCHES] Synced ${records.length} fixtures.`);
  return records.length;
}

// ── Sync standings ──────────────────────────────────────────────────────────

async function syncStandings() {
  console.log("[STANDINGS] Fetching MLS standings...");
  const headers = { "x-apisports-key": API_FOOTBALL_KEY };
  const data = await fetchJSON(
    `https://${API_FOOTBALL_HOST}/standings?league=${MLS_LEAGUE_ID}&season=${API_FOOTBALL_SEASON}`,
    headers
  );

  const groups = data.response?.[0]?.league?.standings || [];
  const records: any[] = [];

  for (const group of groups) {
    for (const team of group) {
      records.push({
        id: `${API_FOOTBALL_SEASON}-${team.team.id}`,
        team: team.team.name,
        team_id: String(team.team.id),
        position: team.rank,
        points: team.points,
        wins: team.all.win,
        draws: team.all.draw,
        losses: team.all.lose,
        goals_for: team.all.goals.for,
        goals_against: team.all.goals.against,
        goal_difference: team.goalsDiff,
        form: (team.form || "").split("").filter((c: string) => "WDL".includes(c)),
        games_played: team.all.played,
        season: API_FOOTBALL_SEASON,
        conference: team.group || "Unknown",
        updated_at: new Date().toISOString(),
      });
    }
  }

  await upsertSupabase("standings", records);
  console.log(`[STANDINGS] Synced ${records.length} entries.`);
  return records.length;
}

// ── Sync player stats (from ASA) ────────────────────────────────────────────

async function syncPlayerStats() {
  console.log("[PLAYERS] Fetching player stats from ASA...");

  try {
    // Fetch all MLS player names to join with xgoals data
    // ASA returns max 1000 per request, paginate to get all
    console.log("[PLAYERS] Building player name lookup...");
    const nameMap = new Map<string, { name: string; position: string }>();
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const batch: any[] = await fetchJSON(`${ASA_BASE}/mls/players?offset=${offset}&limit=${pageSize}`);
      for (const p of batch) {
        nameMap.set(p.player_id, {
          name: p.player_name || "Unknown",
          position: p.primary_general_position || "Unknown",
        });
      }
      if (batch.length < pageSize) break;
      offset += pageSize;
      await rateLimit(500);
    }
    console.log(`[PLAYERS] Name lookup: ${nameMap.size} players indexed.`);
    await rateLimit(1000);

    const data = await fetchJSON(
      `${ASA_BASE}/mls/players/xgoals?season_name=${CURRENT_SEASON}&team_id=a2lqRX2Mr0`
    );

    const players = data || [];
    const records = players.map((p: any) => {
      const info = nameMap.get(p.player_id);
      return {
        id: p.player_id || `unknown-${CURRENT_SEASON}`,
        name: info?.name || "Unknown",
        team: "New York Red Bulls",
        position: p.general_position || info?.position || "Unknown",
        season: CURRENT_SEASON,
        games_played: p.count_games || 0,
        minutes: p.minutes_played || 0,
        goals: p.goals || 0,
        assists: p.primary_assists || 0,
        xg: p.xgoals || 0,
        xa: p.xassists || 0,
        goals_added: p.goals_added || null,
        key_passes: p.key_passes || null,
        pass_completion: p.pass_completion_percentage || null,
        updated_at: new Date().toISOString(),
      };
    });

    await upsertSupabase("player_stats", records);
    console.log(`[PLAYERS] Synced ${records.length} players.`);
    return records.length;
  } catch (err) {
    console.warn(`[PLAYERS] ASA API unavailable, trying API-Football fallback...`);
    await rateLimit(2000);

    const headers = { "x-apisports-key": API_FOOTBALL_KEY };
    const data = await fetchJSON(
      `https://${API_FOOTBALL_HOST}/players?team=${NYRB_TEAM_ID}&season=${CURRENT_SEASON}&league=${MLS_LEAGUE_ID}`,
      headers
    );

    const players = data.response || [];
    const records = players.map((p: any) => {
      const stats = p.statistics?.[0] || {};
      return {
        id: String(p.player.id),
        name: p.player.name,
        team: "New York Red Bulls",
        position: stats.games?.position || "Unknown",
        season: CURRENT_SEASON,
        games_played: stats.games?.appearences || 0,
        minutes: stats.games?.minutes || 0,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        xg: 0,
        xa: 0,
        key_passes: stats.passes?.key || null,
        pass_completion: stats.passes?.accuracy || null,
        tackles_won: stats.tackles?.total || null,
        interceptions: stats.tackles?.interceptions || null,
        updated_at: new Date().toISOString(),
      };
    });

    await upsertSupabase("player_stats", records);
    console.log(`[PLAYERS] Synced ${records.length} players (API-Football).`);
    return records.length;
  }
}

// ── Sync team match advanced (per-match NYRB stats for trend charts) ────────

const NYRB_ASA_ID = "a2lqRX2Mr0";

async function syncTeamMatchAdvanced() {
  console.log("[ADVANCED] Fetching per-game xG from ASA...");

  try {
    // Fetch team name lookup
    const teams: any[] = await fetchJSON(`${ASA_BASE}/mls/teams`);
    const teamNameMap = new Map<string, string>();
    for (const t of teams) teamNameMap.set(t.team_id, t.team_name);

    const games: any[] = await fetchJSON(
      `${ASA_BASE}/mls/games/xgoals?season_name=${CURRENT_SEASON}&team_id=${NYRB_ASA_ID}`
    );

    const records = games.map((g: any) => {
      const isHome = g.home_team_id === NYRB_ASA_ID;
      const opponentId = isHome ? g.away_team_id : g.home_team_id;
      const opponent = teamNameMap.get(opponentId) || opponentId;
      const gf = isHome ? g.home_goals : g.away_goals;
      const ga = isHome ? g.away_goals : g.home_goals;
      const xgf = isHome ? g.home_team_xgoals : g.away_team_xgoals;
      const xga = isHome ? g.away_team_xgoals : g.home_team_xgoals;
      const result = gf > ga ? "W" : gf < ga ? "L" : "D";

      return {
        match_id: g.game_id,
        team: "New York Red Bulls",
        season: CURRENT_SEASON,
        match_date: (g.date_time_utc || "").substring(0, 10) || new Date().toISOString().split("T")[0],
        opponent,
        is_home: isHome,
        result,
        goals_for: gf || 0,
        goals_against: ga || 0,
        xg_for: xgf || 0,
        xg_against: xga || 0,
        clean_sheet: (ga || 0) === 0,
        updated_at: new Date().toISOString(),
      };
    });

    await upsertSupabase("team_match_advanced", records);
    console.log(`[ADVANCED] Synced ${records.length} match records.`);
    return records.length;
  } catch (err: any) {
    console.warn(`[ADVANCED] ASA game-level data unavailable: ${err.message}`);
    return 0;
  }
}

// ── Sync team season stats (current season) ─────────────────────────────────

async function syncTeamSeasonStats() {
  console.log("[TEAM-STATS] Fetching current season team xG from ASA...");

  try {
    const data: any[] = await fetchJSON(
      `${ASA_BASE}/mls/teams/xgoals?season_name=${CURRENT_SEASON}`
    );

    const records = data.map((t: any) => ({
      id: `${t.team_id}-${CURRENT_SEASON}`,
      team: t.team_name || t.team_id,
      team_id: t.team_id,
      season: CURRENT_SEASON,
      games_played: t.count_games || 0,
      goals_for: t.goals_for || 0,
      goals_against: t.goals_against || 0,
      xg_for: t.xgoals_for || 0,
      xg_against: t.xgoals_against || 0,
      points: t.points || 0,
      updated_at: new Date().toISOString(),
    }));

    await upsertSupabase("team_season_stats", records);
    console.log(`[TEAM-STATS] Synced ${records.length} teams.`);
    return records.length;
  } catch (err: any) {
    console.warn(`[TEAM-STATS] ASA team stats unavailable: ${err.message}`);
    return 0;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Data Seed ═══\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const results = { matches: 0, standings: 0, players: 0, advanced: 0, teamStats: 0 };

  try {
    results.matches = await syncMatches();
    await rateLimit(2000);
  } catch (err) { console.error("[MATCHES] Error:", err); }

  try {
    results.standings = await syncStandings();
    await rateLimit(2000);
  } catch (err) { console.error("[STANDINGS] Error:", err); }

  try {
    results.players = await syncPlayerStats();
    await rateLimit(2000);
  } catch (err) { console.error("[PLAYERS] Error:", err); }

  try {
    results.advanced = await syncTeamMatchAdvanced();
    await rateLimit(2000);
  } catch (err) { console.error("[ADVANCED] Error:", err); }

  try {
    results.teamStats = await syncTeamSeasonStats();
  } catch (err) { console.error("[TEAM-STATS] Error:", err); }

  const summary = `Matches: ${results.matches}, Standings: ${results.standings}, Players: ${results.players}, Advanced: ${results.advanced}, TeamStats: ${results.teamStats}`;
  console.log(`\n${summary}`);
  await notify(summary);

  console.log("\n═══ Data seed complete ═══");
}

main().catch(async (err) => { console.error(err); await notify(`Failed: ${err.message}`, true); process.exit(1); });
