/**
 * South Ward Signal — FBref JSON Seeder
 *
 * Reads parsed FBref match JSON from data/fbref/ (saved by the Python scraper)
 * and upserts to Supabase: matches (xG only), player_match_stats, match_shots.
 *
 * Data priority:
 *   - ASA owns: xG, xA, goals_added → never overwrite if already set
 *   - FotMob owns: ratings, duels, momentum, events → never overwrite
 *   - FBref fills: player per-match stats (minutes, goals, assists, shots, passes,
 *     tackles, interceptions, touches, dribbles, clearances, blocks, aerials),
 *     lineups (is_starter, position), match-level xG (only if ASA hasn't set it)
 *
 * Usage: npx tsx scripts/seed-fbref-json.ts
 *        npx tsx scripts/seed-fbref-json.ts --season=2024
 *        npx tsx scripts/seed-fbref-json.ts --dry-run
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, basename } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DATA_DIR = join(__dirname, "..", "data", "fbref");

// ── Helpers ──────────────────────────────────────────────────────────────────

const ON_CONFLICT: Record<string, string> = {
  player_match_stats: "match_id,player_name",
  match_shots: "match_id,team,player,minute,x,y",
};

async function upsertSupabase(table: string, records: any[]) {
  if (!records.length) return;
  const BATCH_SIZE = 200;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const conflict = ON_CONFLICT[table]
      ? `?on_conflict=${ON_CONFLICT[table]}`
      : "";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${conflict}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[UPSERT] ${table}: ${res.status} — ${text}`);
    }
  }
}

async function querySupabase(table: string, query: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

async function patchSupabase(table: string, filter: string, data: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[PATCH] ${table}: ${res.status} — ${text}`);
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Team name normalization ──────────────────────────────────────────────────

const TEAM_NAME_MAP: Record<string, string> = {
  "New York Red Bulls": "New York Red Bulls",
  "NY Red Bulls": "New York Red Bulls",
  "Atlanta United": "Atlanta United FC",
  "Atlanta United FC": "Atlanta United FC",
  "Austin": "Austin FC",
  "Austin FC": "Austin FC",
  "Charlotte": "Charlotte FC",
  "Charlotte FC": "Charlotte FC",
  "Chicago Fire": "Chicago Fire FC",
  "Chicago Fire FC": "Chicago Fire FC",
  "FC Cincinnati": "FC Cincinnati",
  "FC Cincinnati FC": "FC Cincinnati",
  "Cincinnati": "FC Cincinnati",
  "Colorado Rapids": "Colorado Rapids",
  "Columbus Crew": "Columbus Crew",
  "Columbus Crew SC": "Columbus Crew",
  "D.C. United": "D.C. United",
  "DC United": "D.C. United",
  "FC Dallas": "FC Dallas",
  "Houston Dynamo": "Houston Dynamo FC",
  "Houston Dynamo FC": "Houston Dynamo FC",
  "Inter Miami": "Inter Miami CF",
  "Inter Miami CF": "Inter Miami CF",
  "LA Galaxy": "LA Galaxy",
  "Los Angeles FC": "Los Angeles FC",
  "LAFC": "Los Angeles FC",
  "Minnesota United": "Minnesota United FC",
  "Minnesota United FC": "Minnesota United FC",
  "CF Montréal": "CF Montréal",
  "CF Montreal": "CF Montréal",
  "Montreal Impact": "CF Montréal",
  "Nashville SC": "Nashville SC",
  "Nashville": "Nashville SC",
  "New England Revolution": "New England Revolution",
  "New England Rev.": "New England Revolution",
  "New York City FC": "New York City FC",
  "NYCFC": "New York City FC",
  "Orlando City": "Orlando City SC",
  "Orlando City SC": "Orlando City SC",
  "Philadelphia Union": "Philadelphia Union",
  "Portland Timbers": "Portland Timbers",
  "Real Salt Lake": "Real Salt Lake",
  "San Jose Earthquakes": "San Jose Earthquakes",
  "SJ Earthquakes": "San Jose Earthquakes",
  "Seattle Sounders": "Seattle Sounders FC",
  "Seattle Sounders FC": "Seattle Sounders FC",
  "Sporting Kansas City": "Sporting Kansas City",
  "Sporting KC": "Sporting Kansas City",
  "St. Louis City": "St. Louis City SC",
  "St. Louis City SC": "St. Louis City SC",
  "St. Louis CITY SC": "St. Louis City SC",
  "Toronto FC": "Toronto FC",
  "Vancouver Whitecaps": "Vancouver Whitecaps FC",
  "Vancouver Whitecaps FC": "Vancouver Whitecaps FC",
  "Chivas USA": "Chivas USA",
};

function normalizeTeam(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

// ── Match ID resolution ──────────────────────────────────────────────────────

async function resolveMatchId(
  dateStr: string,
  homeTeam: string,
  awayTeam: string
): Promise<{ matchId: string; isNew: boolean }> {
  const date = dateStr.substring(0, 10);
  if (!date) return { matchId: "", isNew: false };

  const homeNorm = normalizeTeam(homeTeam);
  const awayNorm = normalizeTeam(awayTeam);

  // Check by date + normalized team names
  const byDate = await querySupabase(
    "matches",
    `date=gte.${date}T00:00:00&date=lte.${date}T23:59:59`
  );

  for (const m of byDate) {
    const dbHome = normalizeTeam(m.home_team || "");
    const dbAway = normalizeTeam(m.away_team || "");
    if (dbHome === homeNorm && dbAway === awayNorm) {
      return { matchId: m.id, isNew: false };
    }
  }

  // Not found — create a new match ID using fbref match ID
  return { matchId: `fbref-${date}-${homeNorm.replace(/\s+/g, "-").toLowerCase()}`, isNew: true };
}

// ── Build player_match_stats records ─────────────────────────────────────────

function buildPlayerRecords(
  players: any[],
  matchId: string
): any[] {
  return players.map((p) => {
    const record: any = {
      match_id: matchId,
      player_name: p.name || "Unknown",
      team: normalizeTeam(p.team || "Unknown"),
      position: p.position || null,
      minutes_played: p.minutes || 0,
      goals: p.goals || 0,
      assists: p.assists || 0,
      shots: p.shots || 0,
      shots_on_target: p.shots_on_target || 0,
      key_passes: p.key_passes || 0,
      passes: p.passes || 0,
      pass_accuracy: p.pass_accuracy || null,
      tackles: p.tackles || 0,
      interceptions: p.interceptions || 0,
      blocks: p.blocks || 0,
      clearances: p.clearances || 0,
      touches: p.touches || 0,
      dribbles_attempted: p.dribbles_attempted || 0,
      dribbles_succeeded: p.dribbles_succeeded || 0,
      fouls: p.fouls || 0,
      yellows: p.yellows || 0,
      reds: p.reds || 0,
      aerial_duels_won: p.aerials_won || 0,
      aerial_duels_total: p.aerials_total || 0,
      shirt_number: p.shirt_number || null,
      is_starter: p.is_starter ?? null,
      is_home: p.is_home ?? null,
      saves: p.saves || 0,
      crosses: p.crosses || 0,
      data_source: "fbref",
    };

    return record;
  });
}

// ── Build match_shots records ────────────────────────────────────────────────

function buildShotRecords(shots: any[], matchId: string): any[] {
  return shots.map((s) => ({
    match_id: matchId,
    team: normalizeTeam(s.team || "Unknown"),
    player: s.player || "Unknown",
    minute: s.minute || 0,
    // FBref doesn't provide x/y coordinates; use 0 as placeholder
    x: 0,
    y: 0,
    xg: s.xg ?? 0,
    outcome: s.outcome || "off_target",
    body_part: s.body_part || null,
    shot_type: null,
    home_team_side: null,
    data_source: "fbref",
  }));
}

// ── Process a single match JSON ──────────────────────────────────────────────

async function processMatch(
  filepath: string,
  dryRun: boolean
): Promise<{
  ok: boolean;
  matchId: string;
  players: number;
  shots: number;
  skipped?: boolean;
  isNew?: boolean;
}> {
  const raw = readFileSync(filepath, "utf-8");
  const data = JSON.parse(raw);

  const dateStr = data.date || "";
  const homeTeam = data.home_team || "";
  const awayTeam = data.away_team || "";

  // Resolve to existing match or generate new ID
  const { matchId, isNew } = await resolveMatchId(dateStr, homeTeam, awayTeam);
  if (!matchId) {
    return { ok: false, matchId: "", players: 0, shots: 0 };
  }

  // ── Check if this match already has FotMob player stats (skip if so) ─────
  if (!isNew) {
    const existingStats = await querySupabase(
      "player_match_stats",
      `match_id=eq.${matchId}&data_source=eq.fotmob&limit=1`
    );
    if (existingStats.length > 0) {
      return { ok: true, matchId, players: 0, shots: 0, skipped: true };
    }
  }

  // ── Create new match record if it doesn't exist ──────────────────────────
  if (isNew && !dryRun) {
    const season = dateStr ? parseInt(dateStr.substring(0, 4), 10) : null;
    const matchRecord: any = {
      id: matchId,
      date: `${dateStr}T00:00:00+00:00`,
      home_team: normalizeTeam(homeTeam),
      away_team: normalizeTeam(awayTeam),
      home_score: data.home_score ?? null,
      away_score: data.away_score ?? null,
      home_xg: data.home_xg ?? null,
      away_xg: data.away_xg ?? null,
      status: "finished",
      competition: "MLS",
      season,
      data_source: "fbref",
      updated_at: new Date().toISOString(),
    };
    await upsertSupabase("matches", [matchRecord]);
  }

  // ── Patch match-level xG if currently null (for existing matches) ────────
  if (!isNew && (data.home_xg != null || data.away_xg != null)) {
    const matchRow = await querySupabase(
      "matches",
      `id=eq.${matchId}&select=home_xg,away_xg&limit=1`
    );
    if (matchRow.length > 0) {
      const patch: any = {};
      if (matchRow[0].home_xg == null && data.home_xg != null) {
        patch.home_xg = data.home_xg;
      }
      if (matchRow[0].away_xg == null && data.away_xg != null) {
        patch.away_xg = data.away_xg;
      }
      if (Object.keys(patch).length > 0 && !dryRun) {
        await patchSupabase("matches", `id=eq.${matchId}`, patch);
      }
    }
  }

  // ── Player stats ─────────────────────────────────────────────────────────
  const players = data.players || [];
  const playerRecords = buildPlayerRecords(players, matchId);

  if (playerRecords.length > 0 && !dryRun) {
    await upsertSupabase("player_match_stats", playerRecords);
  }

  // ── Shots ────────────────────────────────────────────────────────────────
  const shots = data.shots || [];
  let shotsInserted = 0;

  if (shots.length > 0 && !isNew) {
    // Only insert FBref shots for existing matches without shot data (ASA owns shots)
    const existingShots = await querySupabase(
      "match_shots",
      `match_id=eq.${matchId}&limit=1`
    );
    if (existingShots.length === 0 && !dryRun) {
      const shotRecords = buildShotRecords(shots, matchId);
      await upsertSupabase("match_shots", shotRecords);
      shotsInserted = shotRecords.length;
    }
  }

  return {
    ok: true,
    matchId,
    players: playerRecords.length,
    shots: shotsInserted,
    isNew,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — FBref JSON Seeder ═══\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const seasonFlag = args.find((a) => a.startsWith("--season="));
  const targetSeason = seasonFlag
    ? parseInt(seasonFlag.split("=")[1], 10)
    : null;

  if (dryRun) console.log("[DRY RUN] No data will be written.\n");

  if (!existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    console.error(
      "Run the Python scraper first: python scripts/fbref-scraper/scrape_fbref.py"
    );
    process.exit(1);
  }

  const seasonDirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}$/.test(d.name))
    .map((d) => d.name)
    .sort();

  if (!seasonDirs.length) {
    console.log("No season directories found. Run the scraper first.");
    return;
  }

  let totalMatches = 0;
  let totalNew = 0;
  let totalEnriched = 0;
  let totalPlayers = 0;
  let totalShots = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const seasonDir of seasonDirs) {
    const season = parseInt(seasonDir, 10);
    if (targetSeason && season !== targetSeason) continue;

    const dirPath = join(DATA_DIR, seasonDir);
    const files = readdirSync(dirPath)
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .sort();

    if (!files.length) continue;

    console.log(`\n── Season ${season} — ${files.length} matches ──`);

    for (let i = 0; i < files.length; i++) {
      const filepath = join(dirPath, files[i]);
      const matchFileId = basename(files[i], ".json");
      process.stdout.write(
        `  [${i + 1}/${files.length}] ${matchFileId}... `
      );

      try {
        const result = await processMatch(filepath, dryRun);
        if (result.skipped) {
          totalSkipped++;
          console.log("SKIP (FotMob data exists)");
          continue;
        }
        totalMatches++;
        totalPlayers += result.players;
        totalShots += result.shots;
        if (result.isNew) {
          totalNew++;
          console.log(
            `NEW → ${result.players} players`
          );
        } else {
          totalEnriched++;
          console.log(
            `ENRICH → ${result.players} players${result.shots > 0 ? `, ${result.shots} shots` : ""}`
          );
        }
      } catch (err: any) {
        console.log(`FAIL: ${err.message}`);
        totalFailed++;
      }

      await delay(100);
    }
  }

  console.log("\n═══ Seed Summary ═══");
  console.log(`  Matches seeded:   ${totalMatches}`);
  console.log(`  New matches:      ${totalNew}`);
  console.log(`  Enriched:         ${totalEnriched}`);
  console.log(`  Skipped (FotMob): ${totalSkipped}`);
  console.log(`  Player records:   ${totalPlayers}`);
  console.log(`  Shot records:     ${totalShots}`);
  console.log(`  Failed:           ${totalFailed}`);
  console.log("\n═══ FBref JSON seed complete ═══");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
