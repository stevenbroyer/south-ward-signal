/**
 * South Ward Signal — FotMob JSON Seeder
 *
 * Reads raw FotMob match JSON from data/fotmob/ (saved by the Python scraper)
 * and upserts to Supabase: matches, player_match_stats, match_shots.
 *
 * Data priority:
 *   - ASA owns: xG, xA, goals_added (never overwritten on existing records)
 *   - FotMob owns: ratings, duels, dribbles, touches, clearances, events, momentum
 *   - New matches (pre-2022): FotMob provides everything
 *
 * Usage: npx tsx scripts/seed-fotmob-json.ts
 *        npx tsx scripts/seed-fotmob-json.ts --season=2024
 *        npx tsx scripts/seed-fotmob-json.ts --dry-run
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, basename } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DATA_DIR = join(__dirname, "..", "data", "fotmob");

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
    const conflict = ON_CONFLICT[table] ? `?on_conflict=${ON_CONFLICT[table]}` : "";
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
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
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
  fotmobId: string,
  dateStr: string,
  homeTeam: string,
  awayTeam: string
): Promise<{ matchId: string; isNew: boolean }> {
  // 1. Check by fotmob_id
  const byFotmob = await querySupabase(
    "matches",
    `fotmob_id=eq.${fotmobId}&limit=1`
  );
  if (byFotmob.length > 0) {
    return { matchId: byFotmob[0].id, isNew: false };
  }

  // 2. Check by date — fetch all matches on that date, then fuzzy-match teams
  const date = dateStr.substring(0, 10);
  if (date) {
    const homeNorm = normalizeTeam(homeTeam);
    const awayNorm = normalizeTeam(awayTeam);
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
  }

  // 3. Create new match
  return { matchId: `fotmob-${fotmobId}`, isNew: true };
}

// ── Extract player stats from FotMob playerStats dict ────────────────────────

function extractStatValue(
  statsGroups: any[],
  key: string
): number {
  for (const group of statsGroups) {
    const items = group.stats || {};
    if (typeof items === "object" && !Array.isArray(items)) {
      for (const [_title, val] of Object.entries(items)) {
        const v = val as any;
        if (v?.key === key || _title === key) {
          return Number(v?.stat?.value) || 0;
        }
      }
    }
  }
  return 0;
}

function extractStatFraction(
  statsGroups: any[],
  key: string
): { succeeded: number; total: number } {
  for (const group of statsGroups) {
    const items = group.stats || {};
    if (typeof items === "object" && !Array.isArray(items)) {
      for (const [_title, val] of Object.entries(items)) {
        const v = val as any;
        if (v?.key === key || _title === key) {
          const stat = v?.stat || {};
          return {
            succeeded: Number(stat.value) || 0,
            total: Number(stat.total) || Number(stat.value) || 0,
          };
        }
      }
    }
  }
  return { succeeded: 0, total: 0 };
}

function getStatVal(statsGroups: any[], key: string): number {
  // Walk all groups looking for a stat by its key field
  for (const group of statsGroups) {
    const items = group.stats || {};
    // stats can be a dict of { [title]: { key, stat } }
    if (typeof items === "object" && !Array.isArray(items)) {
      for (const val of Object.values(items)) {
        const v = val as any;
        if (v?.key === key) {
          return Number(v?.stat?.value) || 0;
        }
      }
    }
  }
  return 0;
}

function getStatFrac(statsGroups: any[], key: string): { val: number; total: number } {
  for (const group of statsGroups) {
    const items = group.stats || {};
    if (typeof items === "object" && !Array.isArray(items)) {
      for (const val of Object.values(items)) {
        const v = val as any;
        if (v?.key === key) {
          return {
            val: Number(v?.stat?.value) || 0,
            total: Number(v?.stat?.total) || Number(v?.stat?.value) || 0,
          };
        }
      }
    }
  }
  return { val: 0, total: 0 };
}

function buildPlayerRecords(detail: any, matchId: string): any[] {
  const records: any[] = [];
  const playerStats = detail.content?.playerStats || {};
  const lineupData = detail.content?.lineup || {};

  // Build a map of player ID -> starter/sub info from lineup
  const starterIds = new Set<number>();
  const subEvents: Record<number, { subIn?: number; subOut?: number }> = {};

  for (const side of ["homeTeam", "awayTeam"]) {
    const team = lineupData[side] || {};
    for (const p of team.starters || []) {
      starterIds.add(p.id);
    }
    for (const p of team.subs || []) {
      const perf = p.performance || {};
      const events = perf.substitutionEvents || [];
      for (const e of events) {
        if (!subEvents[p.id]) subEvents[p.id] = {};
        if (e.type === "subIn") subEvents[p.id].subIn = e.time;
        if (e.type === "subOut") subEvents[p.id].subOut = e.time;
      }
    }
    // Also check starters for sub-off events
    for (const p of team.starters || []) {
      const perf = p.performance || {};
      const events = perf.substitutionEvents || [];
      for (const e of events) {
        if (!subEvents[p.id]) subEvents[p.id] = {};
        if (e.type === "subOut") subEvents[p.id].subOut = e.time;
      }
    }
  }

  // Determine which team is home
  const homeTeamId = detail.general?.homeTeam?.id;

  for (const [_playerId, pData] of Object.entries(playerStats)) {
    const p = pData as any;
    const statsGroups = p.stats || [];
    const pid = Number(p.id);

    const dribbles = getStatFrac(statsGroups, "dribbles_succeeded");
    const groundDuels = getStatFrac(statsGroups, "ground_duels_won");
    const aerials = getStatFrac(statsGroups, "aerials_won");
    const longBalls = getStatFrac(statsGroups, "long_balls_accurate");
    const accuratePasses = getStatFrac(statsGroups, "accurate_passes");
    const accurateCrosses = getStatFrac(statsGroups, "accurate_crosses");
    const duelsWon = getStatVal(statsGroups, "duel_won");
    const duelsLost = getStatVal(statsGroups, "duel_lost");

    records.push({
      match_id: matchId,
      player_name: p.name || "Unknown",
      team: normalizeTeam(p.teamName || "Unknown"),
      position: p.usualPosition || p.positionId || null,
      minutes_played: getStatVal(statsGroups, "minutes_played"),
      goals: getStatVal(statsGroups, "goals"),
      assists: getStatVal(statsGroups, "assists"),
      shots: getStatVal(statsGroups, "ShotsOnTarget") + getStatVal(statsGroups, "ShotsOffTarget") + getStatVal(statsGroups, "blocked_shots"),
      shots_on_target: getStatVal(statsGroups, "ShotsOnTarget"),
      key_passes: getStatVal(statsGroups, "chances_created"),
      passes: accuratePasses.total || 0,
      pass_accuracy:
        accuratePasses.total > 0
          ? Math.round((accuratePasses.val / accuratePasses.total) * 10000) / 100
          : null,
      tackles: getStatVal(statsGroups, "matchstats.headers.tackles"),
      interceptions: getStatVal(statsGroups, "interceptions"),
      fouls: getStatVal(statsGroups, "fouls"),
      yellows: 0, // Will be derived from match events
      reds: 0,
      fotmob_rating: getStatVal(statsGroups, "rating_title") || null,
      dribbles_attempted: dribbles.total,
      dribbles_succeeded: dribbles.val,
      duels_won: duelsWon,
      duels_total: duelsWon + duelsLost,
      aerial_duels_won: aerials.val,
      aerial_duels_total: aerials.total,
      touches: getStatVal(statsGroups, "touches"),
      clearances: getStatVal(statsGroups, "clearances"),
      blocks: getStatVal(statsGroups, "shot_blocks"),
      crosses: accurateCrosses.total || 0,
      long_balls: longBalls.total,
      long_balls_accurate: longBalls.val,
      saves: getStatVal(statsGroups, "saves"),
      goals_prevented: (() => {
        const gp = getStatVal(statsGroups, "goals_prevented");
        return gp !== 0 ? gp : null;
      })(),
      shirt_number: p.shirtNumber || null,
      is_starter: starterIds.has(pid),
      sub_on_minute: subEvents[pid]?.subIn ?? null,
      sub_off_minute: subEvents[pid]?.subOut ?? null,
      is_home: p.teamId === homeTeamId,
      fotmob_player_id: pid || null,
      data_source: "fotmob",
    });
  }

  // Enrich yellows/reds from match events
  const events = detail.content?.matchFacts?.events?.events || [];
  for (const ev of events) {
    if (ev.type === "Yellow" || ev.type === "YellowRed") {
      const pid = ev.player?.id;
      const rec = records.find((r) => r.fotmob_player_id === pid);
      if (rec) rec.yellows = 1;
    }
    if (ev.type === "Red" || ev.type === "YellowRed") {
      const pid = ev.player?.id;
      const rec = records.find((r) => r.fotmob_player_id === pid);
      if (rec) rec.reds = 1;
    }
  }

  return records;
}

// ── Extract shots from FotMob shotmap ────────────────────────────────────────

function extractShots(detail: any, matchId: string): any[] {
  const shots = detail.content?.shotmap?.shots;
  if (!Array.isArray(shots)) return [];

  const homeTeamId = detail.general?.homeTeam?.id;

  return shots.map((s: any) => {
    let outcome = "off_target";
    const eventType = (s.eventType || "").toLowerCase();
    if (eventType === "goal") outcome = "goal";
    else if (eventType === "attemptsaved" || s.isSavedOffLine) outcome = "saved";
    else if (s.isBlocked) outcome = "blocked";
    else if (s.isOnTarget) outcome = "saved";

    return {
      match_id: matchId,
      team: normalizeTeam(s.teamName || "Unknown"),
      player: s.fullName || s.playerName || "Unknown",
      minute: s.min || 0,
      x: s.x != null ? Number(s.x) : 0,
      y: s.y != null ? Number(s.y) : 0,
      xg: s.expectedGoals != null ? Number(s.expectedGoals) : 0,
      outcome,
      body_part: s.shotType || null,
      shot_type: s.situation || null,
      home_team_side: s.teamId === homeTeamId,
      expected_goals_on_target:
        s.expectedGoalsOnTarget != null
          ? Number(s.expectedGoalsOnTarget)
          : null,
      situation: s.situation || null,
      fotmob_player_id: s.playerId || null,
      on_goal_shot: s.onGoalShot ? JSON.stringify(s.onGoalShot) : null,
    };
  });
}

// ── Process a single match JSON ──────────────────────────────────────────────

async function processMatch(
  filepath: string,
  dryRun: boolean
): Promise<{ ok: boolean; matchId: string; players: number; shots: number; isNew: boolean; skipped?: boolean }> {
  const raw = readFileSync(filepath, "utf-8");
  const detail = JSON.parse(raw);

  const general = detail.general || {};
  const fileMatchId = basename(filepath, ".json");
  const jsonMatchId = String(general.matchId || fileMatchId);

  // Skip redirected matches — FotMob recycles old page URLs to current matches
  if (jsonMatchId !== fileMatchId) {
    return { ok: true, matchId: "", players: 0, shots: 0, isNew: false, skipped: true };
  }

  const fotmobId = jsonMatchId;
  const dateStr = general.matchTimeUTCDate || "";
  const homeTeam = general.homeTeam?.name || "Unknown";
  const awayTeam = general.awayTeam?.name || "Unknown";

  // Determine scores from header
  const header = detail.header || {};
  const homeScore = header.teams?.[0]?.score ?? null;
  const awayScore = header.teams?.[1]?.score ?? null;

  const { matchId, isNew } = await resolveMatchId(
    fotmobId,
    dateStr,
    homeTeam,
    awayTeam
  );

  // ── Match-level data ───────────────────────────────────────────────────

  const content = detail.content || {};
  const matchFacts = content.matchFacts || {};
  const events = matchFacts.events?.events || [];
  const momentum = content.momentum?.main?.data || [];
  const lineup = content.lineup || {};

  const infoBox = matchFacts.infoBox || {};
  const referee = typeof infoBox.Referee === "object" ? infoBox.Referee?.text : infoBox.Referee || null;
  const attendance =
    infoBox.Attendance != null
      ? Number(String(infoBox.Attendance).replace(/[^0-9]/g, "")) || null
      : null;
  const stadium = typeof infoBox.Stadium === "object" ? infoBox.Stadium?.name : infoBox.Stadium || null;

  const potm = matchFacts.playerOfTheMatch || {};
  const playerOfMatch = potm.name?.fullName || potm.name || null;
  const playerOfMatchRating = potm.rating?.num
    ? parseFloat(String(potm.rating.num))
    : null;

  const homeFormation = lineup.homeTeam?.formation || null;
  const awayFormation = lineup.awayTeam?.formation || null;
  const homeCoach = lineup.homeTeam?.coach?.name || null;
  const awayCoach = lineup.awayTeam?.coach?.name || null;
  const matchRound = general.matchRound || general.leagueRoundName || null;
  const weather = content.weather || null;
  const season = dateStr ? parseInt(dateStr.substring(0, 4), 10) : null;

  if (isNew) {
    const matchRecord: any = {
      id: matchId,
      date: dateStr || null,
      home_team: normalizeTeam(homeTeam),
      away_team: normalizeTeam(awayTeam),
      home_score: homeScore != null ? Number(homeScore) : null,
      away_score: awayScore != null ? Number(awayScore) : null,
      status: "finished",
      venue: stadium || general.venue || null,
      competition: "MLS",
      season,
      fotmob_id: fotmobId,
      momentum: JSON.stringify(momentum),
      events: JSON.stringify(events),
      referee,
      attendance,
      player_of_match: playerOfMatch,
      player_of_match_rating: playerOfMatchRating,
      home_formation: homeFormation,
      away_formation: awayFormation,
      home_coach: homeCoach,
      away_coach: awayCoach,
      match_round: matchRound ? String(matchRound) : null,
      weather: weather ? JSON.stringify(weather) : "{}",
      data_source: "fotmob",
      updated_at: new Date().toISOString(),
    };

    if (!dryRun) {
      await upsertSupabase("matches", [matchRecord]);
    }
  } else {
    // Enrich existing match — preserve ASA-owned fields
    const enrichData: any = {
      fotmob_id: fotmobId,
      momentum: JSON.stringify(momentum),
      events: JSON.stringify(events),
      referee,
      attendance,
      player_of_match: playerOfMatch,
      player_of_match_rating: playerOfMatchRating,
      home_formation: homeFormation,
      away_formation: awayFormation,
      home_coach: homeCoach,
      away_coach: awayCoach,
      match_round: matchRound ? String(matchRound) : null,
      weather: weather ? JSON.stringify(weather) : "{}",
      data_source: "api-football+fotmob",
      updated_at: new Date().toISOString(),
    };

    if (!dryRun) {
      await patchSupabase("matches", `id=eq.${matchId}`, enrichData);
    }
  }

  // ── Player stats ───────────────────────────────────────────────────────

  const playerRecords = buildPlayerRecords(detail, matchId);

  if (playerRecords.length > 0 && !dryRun) {
    await upsertSupabase("player_match_stats", playerRecords);
  }

  // ── Shots ──────────────────────────────────────────────────────────────

  const shotRecords = extractShots(detail, matchId);

  if (shotRecords.length > 0 && !dryRun && isNew) {
    // Only insert FotMob shots for new matches (ASA owns shot data for existing)
    await upsertSupabase("match_shots", shotRecords);
  }

  return {
    ok: true,
    matchId,
    players: playerRecords.length,
    shots: shotRecords.length,
    isNew,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — FotMob JSON Seeder ═══\n");

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
      "Run the Python scraper first: python scripts/fotmob-scraper/scrape_fotmob.py"
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
  let totalPlayers = 0;
  let totalShots = 0;
  let totalNew = 0;
  let totalEnriched = 0;
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
      const fotmobId = basename(files[i], ".json");
      process.stdout.write(
        `  [${i + 1}/${files.length}] Match ${fotmobId}... `
      );

      try {
        const result = await processMatch(filepath, dryRun);
        if (result.skipped) {
          totalSkipped++;
          console.log("SKIP (redirected)");
          continue;
        }
        if (result.isNew) {
          totalNew++;
          console.log(
            `NEW → ${result.players} players, ${result.shots} shots`
          );
        } else {
          totalEnriched++;
          console.log(
            `ENRICH → ${result.players} players`
          );
        }
        totalMatches++;
        totalPlayers += result.players;
        totalShots += result.shots;
      } catch (err: any) {
        console.log(`FAIL: ${err.message}`);
        totalFailed++;
      }

      await delay(100);
    }
  }

  console.log("\n═══ Seed Summary ═══");
  console.log(`  Matches processed: ${totalMatches}`);
  console.log(`  Skipped (redirected): ${totalSkipped}`);
  console.log(`  New matches created: ${totalNew}`);
  console.log(`  Existing matches enriched: ${totalEnriched}`);
  console.log(`  Player stat records: ${totalPlayers}`);
  console.log(`  Shot records (new matches): ${totalShots}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log("\n═══ FotMob JSON seed complete ═══");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
