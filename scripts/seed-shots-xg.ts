/**
 * South Ward Signal — Shots & xG Flow Seeder
 *
 * Populates the match_shots and match_xg_flow Supabase tables using
 * the American Soccer Analysis (ASA) API for seasons 2023–2025.
 *
 * Tables populated: match_shots, match_xg_flow
 *
 * Usage:
 *   npx tsx scripts/seed-shots-xg.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ASA_BASE = "https://app.americansocceranalysis.com/api/v1";
const NYRB_ASA_ID = "a2lqRX2Mr0";

const SEASONS = [2023, 2024, 2025];

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
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

async function querySupabase(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Outcome mapping ────────────────────────────────────────────────────────

function deriveOutcome(shot: any): string {
  if (shot.goal === 1) return 'goal';
  if (shot.blocked === 1) return 'blocked';
  // If shot ended on target (within goal frame) but wasn't a goal, it was saved
  const endY = shot.shot_end_location_y ?? 50;
  if (shot.shot_end_location_x === 100 && endY >= 36 && endY <= 64) return 'saved';
  return 'off_target';
}

// ── Build lookups ──────────────────────────────────────────────────────────

async function buildPlayerNameLookup(): Promise<Map<string, string>> {
  console.log("[LOOKUP] Building player name lookup...");
  const nameMap = new Map<string, string>();
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const batch: any[] = await fetchJSON(
      `${ASA_BASE}/mls/players?offset=${offset}&limit=${pageSize}`
    );
    for (const p of batch) {
      nameMap.set(p.player_id, p.player_name || "Unknown");
    }
    if (batch.length < pageSize) break;
    offset += pageSize;
    await delay(500);
  }

  console.log(`[LOOKUP] Player lookup: ${nameMap.size} players indexed.`);
  return nameMap;
}

async function buildTeamNameLookup(): Promise<Map<string, string>> {
  console.log("[LOOKUP] Building team name lookup...");
  const teams: any[] = await fetchJSON(`${ASA_BASE}/mls/teams`);
  const teamMap = new Map<string, string>();
  for (const t of teams) {
    teamMap.set(t.team_id, t.team_name);
  }
  console.log(`[LOOKUP] Team lookup: ${teamMap.size} teams indexed.`);
  return teamMap;
}

// ── Match ID resolution ────────────────────────────────────────────────────

async function resolveMatchId(dateTimeUtc: string): Promise<string | null> {
  const date = (dateTimeUtc || "").substring(0, 10);
  if (!date) return null;

  const matches = await querySupabase(
    "matches",
    `date=gte.${date}T00:00:00&date=lte.${date}T23:59:59&or=(home_team.ilike.%25Red Bull%25,away_team.ilike.%25Red Bull%25)&limit=1`
  );

  if (matches.length > 0) {
    return matches[0].id;
  }
  return null;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Shots & xG Flow Seed ═══\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  // Build team name lookup (player names come directly from shot data)
  const teamNames = await buildTeamNameLookup();
  await delay(1000);

  // Tracking totals
  let totalShots = 0;
  let totalFlow = 0;
  const seasonCounts: Record<number, { shots: number; flow: number }> = {};

  for (const season of SEASONS) {
    console.log(`\n── Season ${season} ──────────────────────────────────`);
    seasonCounts[season] = { shots: 0, flow: 0 };

    // Fetch NYRB games for this season
    let games: any[];
    try {
      games = await fetchJSON(
        `${ASA_BASE}/mls/games/xgoals?season_name=${season}&team_id=${NYRB_ASA_ID}`
      );
      console.log(`[SEASON ${season}] Found ${games.length} games.`);
    } catch (err: any) {
      console.warn(`[SEASON ${season}] Failed to fetch games: ${err.message}`);
      continue;
    }
    await delay(1000);

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const gameId = game.game_id;
      const dateStr = (game.date_time_utc || "").substring(0, 10);

      console.log(
        `  [${i + 1}/${games.length}] Game ${gameId} (${dateStr})...`
      );

      // Resolve our match ID from Supabase
      const matchId = await resolveMatchId(game.date_time_utc);
      if (!matchId) {
        console.log(`    ⚠ No matching match found for ${dateStr}, skipping.`);
        await delay(1000);
        continue;
      }

      // Determine home team info for this game
      const isHomeTeam = (teamId: string) => teamId === game.home_team_id;

      // ── Fetch shots ──────────────────────────────────────────────
      try {
        const shots: any[] = await fetchJSON(
          `${ASA_BASE}/mls/games/shots?game_id=${gameId}`
        );

        const shotRecords = shots.map((s: any) => ({
          match_id: matchId,
          team: teamNames.get(s.team_id) || s.team_id,
          player: s.shooter_player_name || playerNames.get(s.shooter_player_id) || 'Unknown',
          minute: s.game_minute || s.expanded_minute || 0,
          x: s.shot_location_x || 0,
          y: s.shot_location_y || 0,
          xg: s.shot_xg || 0,
          outcome: deriveOutcome(s),
          body_part: s.head === 1 ? 'Head' : 'Foot',
          shot_type: s.pattern_of_play || null,
          home_team_side: isHomeTeam(s.team_id),
        }));

        if (shotRecords.length > 0) {
          // Delete existing shots for this match to allow clean re-runs
          await fetch(`${SUPABASE_URL}/rest/v1/match_shots?match_id=eq.${matchId}`, {
            method: 'DELETE',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          });
          await upsertSupabase("match_shots", shotRecords);
          seasonCounts[season].shots += shotRecords.length;
          totalShots += shotRecords.length;
          console.log(`    Shots: ${shotRecords.length} inserted.`);
        }
      } catch (err: any) {
        console.warn(`    Shots fetch failed: ${err.message}`);
      }

      await delay(1000);

      // ── Fetch xG flow ────────────────────────────────────────────
      try {
        const flow: any[] = await fetchJSON(
          `${ASA_BASE}/mls/games/game-flow?game_id=${gameId}`
        );

        // ASA returns per-minute xG values — accumulate into cumulative
        // Sort by minute and deduplicate (keep last value per minute)
        flow.sort((a: any, b: any) => (a.expanded_minute || 0) - (b.expanded_minute || 0));
        const minuteMap = new Map<number, { home: number; away: number }>();
        let cumHome = 0;
        let cumAway = 0;
        for (const f of flow) {
          const min = f.expanded_minute || 0;
          cumHome += f.home_team_value || 0;
          cumAway += f.away_team_value || 0;
          minuteMap.set(min, { home: cumHome, away: cumAway });
        }
        const flowRecords = Array.from(minuteMap.entries()).map(([min, vals]) => ({
          match_id: matchId,
          minute: min,
          home_xg: Math.round(vals.home * 10000) / 10000,
          away_xg: Math.round(vals.away * 10000) / 10000,
        }));

        if (flowRecords.length > 0) {
          // Use on_conflict for the composite unique key (match_id, minute)
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/match_xg_flow?on_conflict=match_id,minute`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Prefer: "resolution=merge-duplicates,return=minimal",
              },
              body: JSON.stringify(flowRecords),
            }
          );
          if (!res.ok) {
            const text = await res.text();
            console.error(`    [UPSERT] match_xg_flow: ${res.status} — ${text}`);
          }
          seasonCounts[season].flow += flowRecords.length;
          totalFlow += flowRecords.length;
          console.log(`    xG Flow: ${flowRecords.length} entries inserted.`);
        }
      } catch (err: any) {
        console.warn(`    xG flow fetch failed: ${err.message}`);
      }

      await delay(1000);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("\n═══ Seed Summary ═══");
  console.log(`Total shots inserted: ${totalShots}`);
  console.log(`Total xG flow entries inserted: ${totalFlow}`);
  for (const season of SEASONS) {
    const c = seasonCounts[season];
    console.log(
      `  Season ${season}: ${c.shots} shots, ${c.flow} flow entries`
    );
  }
  console.log("\n═══ Shots & xG flow seed complete ═══");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
