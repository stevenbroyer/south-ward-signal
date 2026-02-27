/**
 * South Ward Signal — Standings History Seeder
 *
 * Populates the `standings_history` table to power the BumpChart visualization.
 * Reconstructs week-by-week standings from ASA game-level xGoals data,
 * supplemented with ESPN standings for the current season.
 *
 * Seasons: 2023, 2024, 2025
 *
 * Usage: npx tsx scripts/seed-standings-history.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ASA_BASE = "https://app.americansocceranalysis.com/api/v1";

const SEASONS = [2023, 2024, 2025];

// ── Conference Maps ─────────────────────────────────────────────────────────

const EASTERN_CONFERENCE = new Set([
  "Atlanta United FC",
  "CF Montréal",
  "Charlotte FC",
  "Chicago Fire FC",
  "Columbus Crew",
  "D.C. United",
  "FC Cincinnati",
  "Inter Miami CF",
  "Nashville SC",
  "New England Revolution",
  "New York City FC",
  "New York Red Bulls",
  "Orlando City SC",
  "Philadelphia Union",
  "Toronto FC",
]);

const WESTERN_CONFERENCE = new Set([
  "Austin FC",
  "Colorado Rapids",
  "FC Dallas",
  "Houston Dynamo FC",
  "LA Galaxy",
  "Los Angeles FC",
  "Minnesota United FC",
  "Portland Timbers",
  "Real Salt Lake",
  "San Jose Earthquakes",
  "Seattle Sounders FC",
  "Sporting Kansas City",
  "St. Louis City SC",
  "Vancouver Whitecaps FC",
  "San Diego FC",
]);

function getConference(teamName: string): string {
  if (EASTERN_CONFERENCE.has(teamName)) return "Eastern";
  if (WESTERN_CONFERENCE.has(teamName)) return "Western";
  // Fuzzy match for slight name variations across seasons
  for (const name of EASTERN_CONFERENCE) {
    if (teamName.includes(name) || name.includes(teamName)) return "Eastern";
  }
  for (const name of WESTERN_CONFERENCE) {
    if (teamName.includes(name) || name.includes(teamName)) return "Western";
  }
  return "Unknown";
}

// ── Utility Functions ───────────────────────────────────────────────────────

async function fetchJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function upsertSupabase(table: string, records: any[]) {
  if (!records.length) return;
  // Batch in chunks of 500 to avoid payload limits
  const BATCH_SIZE = 500;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
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

// ── Matchweek Assignment ────────────────────────────────────────────────────

interface GameRecord {
  game_id: string;
  date: string; // YYYY-MM-DD
  home_team: string;
  away_team: string;
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
}

/**
 * Group games into matchweeks. Games within a 4-day window are considered
 * the same matchweek. This handles mid-week fixtures that sometimes span
 * Wednesday-Sunday windows.
 */
function assignMatchweeks(games: GameRecord[]): Map<number, GameRecord[]> {
  if (!games.length) return new Map();

  // Sort by date
  const sorted = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const weeks = new Map<number, GameRecord[]>();
  let currentWeek = 1;
  let windowStart = new Date(sorted[0].date).getTime();
  const WINDOW_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

  for (const game of sorted) {
    const gameTime = new Date(game.date).getTime();
    if (gameTime - windowStart > WINDOW_MS) {
      // Start a new matchweek
      currentWeek++;
      windowStart = gameTime;
    }
    if (!weeks.has(currentWeek)) weeks.set(currentWeek, []);
    weeks.get(currentWeek)!.push(game);
  }

  return weeks;
}

// ── Points Calculation ──────────────────────────────────────────────────────

interface TeamStanding {
  team: string;
  teamId: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  conference: string;
}

function computeStandingsAtWeek(
  weeklyGames: Map<number, GameRecord[]>,
  upToWeek: number,
  teamNameMap: Map<string, string>
): TeamStanding[] {
  const teamStats = new Map<
    string,
    {
      teamId: string;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
    }
  >();

  const ensureTeam = (teamName: string, teamId: string) => {
    if (!teamStats.has(teamName)) {
      teamStats.set(teamName, { teamId, points: 0, goalsFor: 0, goalsAgainst: 0 });
    }
  };

  for (let w = 1; w <= upToWeek; w++) {
    const games = weeklyGames.get(w) || [];
    for (const g of games) {
      const homeName = teamNameMap.get(g.home_team_id) || g.home_team;
      const awayName = teamNameMap.get(g.away_team_id) || g.away_team;

      ensureTeam(homeName, g.home_team_id);
      ensureTeam(awayName, g.away_team_id);

      const home = teamStats.get(homeName)!;
      const away = teamStats.get(awayName)!;

      home.goalsFor += g.home_goals;
      home.goalsAgainst += g.away_goals;
      away.goalsFor += g.away_goals;
      away.goalsAgainst += g.home_goals;

      if (g.home_goals > g.away_goals) {
        home.points += 3;
      } else if (g.home_goals < g.away_goals) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    }
  }

  const standings: TeamStanding[] = [];
  for (const [team, stats] of teamStats) {
    standings.push({
      team,
      teamId: stats.teamId,
      points: stats.points,
      goalDifference: stats.goalsFor - stats.goalsAgainst,
      goalsFor: stats.goalsFor,
      conference: getConference(team),
    });
  }

  // Sort: points desc, then goal difference desc, then goals for desc
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

// ── Fetch ASA Team Name Lookup ──────────────────────────────────────────────

async function fetchTeamNameMap(): Promise<Map<string, string>> {
  console.log("  Fetching ASA team name lookup...");
  const teams: any[] = await fetchJSON(`${ASA_BASE}/mls/teams`);
  const map = new Map<string, string>();
  for (const t of teams) {
    map.set(t.team_id, t.team_name);
  }
  console.log(`  Team lookup: ${map.size} teams indexed.`);
  return map;
}

// ── Seed From ASA Games ─────────────────────────────────────────────────────

async function seedSeasonFromASA(
  season: number,
  teamNameMap: Map<string, string>
): Promise<number> {
  console.log(`\n  [${season}] Fetching all games from ASA...`);

  const rawGames: any[] = await fetchJSON(
    `${ASA_BASE}/mls/games/xgoals?season_name=${season}`
  );
  console.log(`  [${season}] Raw games fetched: ${rawGames.length}`);

  // Filter to only completed games (those with final scores)
  const completedGames: GameRecord[] = rawGames
    .filter((g: any) => g.home_goals != null && g.away_goals != null)
    .map((g: any) => ({
      game_id: g.game_id,
      date: (g.date_time_utc || "").substring(0, 10),
      home_team: teamNameMap.get(g.home_team_id) || g.home_team_id,
      away_team: teamNameMap.get(g.away_team_id) || g.away_team_id,
      home_team_id: g.home_team_id,
      away_team_id: g.away_team_id,
      home_goals: g.home_goals,
      away_goals: g.away_goals,
    }));

  console.log(`  [${season}] Completed games: ${completedGames.length}`);

  if (!completedGames.length) {
    console.log(`  [${season}] No completed games found, skipping.`);
    return 0;
  }

  // Assign matchweeks
  const weeklyGames = assignMatchweeks(completedGames);
  const totalWeeks = Math.max(...weeklyGames.keys());
  console.log(`  [${season}] Matchweeks identified: ${totalWeeks}`);

  // Compute standings at each week and build records
  const records: any[] = [];

  for (let week = 1; week <= totalWeeks; week++) {
    const standings = computeStandingsAtWeek(weeklyGames, week, teamNameMap);

    // Find the last game date in this week for the snapshot date
    const weekGames = weeklyGames.get(week) || [];
    const snapshotDate =
      weekGames.length > 0
        ? weekGames.reduce((latest, g) =>
            g.date > latest ? g.date : latest,
          weekGames[0].date)
        : null;

    for (let i = 0; i < standings.length; i++) {
      const s = standings[i];
      records.push({
        week,
        season,
        team: s.team,
        team_id: s.teamId,
        position: i + 1, // 1-indexed rank
        points: s.points,
        conference: s.conference,
        snapshot_date: snapshotDate || `${season}-01-01`,
      });
    }
  }

  console.log(`  [${season}] Total standings rows: ${records.length}`);

  // Upsert in batches
  await upsertSupabase("standings_history", records);
  console.log(`  [${season}] Upserted ${records.length} rows.`);

  return records.length;
}

// ── Supplement Current Season with ESPN Standings ────────────────────────────

async function supplementWithESPN(season: number): Promise<number> {
  console.log(`\n  [ESPN] Fetching current ESPN standings for ${season}...`);

  try {
    const data: any = await fetchJSON(
      "http://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/standings"
    );

    const children = data?.children || [];
    if (!children.length) {
      console.log("  [ESPN] No conference data found.");
      return 0;
    }

    // ESPN gives us the current snapshot -- we will use this as the
    // latest matchweek. First, figure out what the latest week is
    // from the ASA data we already inserted.
    const existing: any[] = await querySupabase(
      "standings_history",
      `select=week&season=eq.${season}&order=week.desc&limit=1`
    );
    const latestWeek = existing?.[0]?.week || 1;
    const espnWeek = latestWeek + 1; // ESPN snapshot = next week marker

    const records: any[] = [];
    let position = 1;

    for (const conf of children) {
      const confName = (conf.name || "").includes("East") ? "Eastern" : "Western";
      const entries = conf?.standings?.entries || [];

      for (const entry of entries) {
        const teamName = entry?.team?.displayName || entry?.team?.name || "Unknown";
        const teamId = entry?.team?.id ? String(entry.team.id) : null;

        // Extract points from stats array
        let points = 0;
        for (const stat of entry?.stats || []) {
          if (stat.name === "points" || stat.abbreviation === "PTS") {
            points = stat.value || 0;
            break;
          }
        }

        records.push({
          week: espnWeek,
          season,
          team: teamName,
          team_id: teamId,
          position: position++,
          points,
          conference: confName,
          snapshot_date: new Date().toISOString().split("T")[0],
        });
      }
    }

    if (records.length) {
      // Re-rank: sort by points desc overall, then assign overall position
      records.sort((a: any, b: any) => b.points - a.points);
      records.forEach((r: any, i: number) => (r.position = i + 1));

      await upsertSupabase("standings_history", records);
      console.log(`  [ESPN] Upserted ${records.length} rows for week ${espnWeek}.`);
    }

    return records.length;
  } catch (err: any) {
    console.error(`  [ESPN] Error: ${err.message}`);
    return 0;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ South Ward Signal — Standings History Seeder ═══");
  console.log(`Seasons: ${SEASONS.join(", ")}\n`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  // Build team name lookup once
  const teamNameMap = await fetchTeamNameMap();
  await delay(1000);

  const summary: Record<number, number> = {};

  for (const season of SEASONS) {
    try {
      summary[season] = await seedSeasonFromASA(season, teamNameMap);
    } catch (err: any) {
      console.error(`  [${season}] Error: ${err.message}`);
      summary[season] = 0;
    }
    await delay(2000);
  }

  // Supplement current season with ESPN live standings
  const currentSeason = SEASONS[SEASONS.length - 1];
  try {
    const espnRows = await supplementWithESPN(currentSeason);
    summary[currentSeason] = (summary[currentSeason] || 0) + espnRows;
  } catch (err: any) {
    console.error(`  [ESPN] Error: ${err.message}`);
  }

  // Print summary
  console.log("\n═══ Summary ═══");
  let totalRows = 0;
  for (const season of SEASONS) {
    const count = summary[season] || 0;
    totalRows += count;
    console.log(`  ${season}: ${count} rows`);
  }
  console.log(`  Total: ${totalRows} rows`);
  console.log("\n═══ Standings history seeding complete ═══");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
