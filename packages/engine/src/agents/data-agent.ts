/**
 * Data Collection & Normalization Agent
 *
 * Orchestrates data fetching across API-Football, American Soccer Analysis,
 * and FBref. Enriches base match data with advanced metrics (xG, g+),
 * normalizes into the shared MatchData schema, and handles graceful
 * degradation when secondary sources are unavailable.
 */

import type { MatchData, Standing, PlayerStats, Fixture } from '@sws/shared';

import {
  buildMatchData,
  getFixtures,
  getLastMatch,
  getStandings as apiGetStandings,
} from '../data-sources/api-football';

import {
  getMatchXGoals,
  buildMatchGoalsAdded,
  getPlayerXGoals,
  mapToPlayerStats,
} from '../data-sources/asa';

import {
  getMatchReport,
  findMatchReportUrl,
} from '../data-sources/fbref';

// ─── Constants ──────────────────────────────────────────────

const LOG_PREFIX = '[DATA-AGENT]';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1_000;

// ─── Retry helper ───────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      const jitter = Math.random() * backoff * 0.2;
      const waitMs = Math.round(backoff + jitter);
      console.warn(
        `${LOG_PREFIX} Retry ${attempt}/${MAX_RETRIES} for ${label} after ${waitMs}ms`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `${LOG_PREFIX} ${label} attempt ${attempt + 1} failed: ${lastError.message}`,
      );

      // Don't retry on 4xx client errors (except 429 rate limits)
      if (
        lastError.message.includes('400') ||
        lastError.message.includes('401') ||
        lastError.message.includes('403') ||
        lastError.message.includes('404')
      ) {
        break;
      }
    }
  }

  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
}

// ─── Public API ────────────────────────────────────────────

/**
 * Fetch complete match data for a given fixture ID.
 *
 * 1. Pulls core match data from API-Football (score, stats, events, lineups).
 * 2. Enriches with ASA match-level xG when available.
 * 3. Enriches with ASA goals-added context.
 * 4. Optionally enriches with FBref player-level advanced stats.
 *
 * Secondary sources (ASA, FBref) are best-effort: if they fail or data is
 * not yet available (ASA can lag 24-48h post-match), the agent returns
 * what it has and logs warnings.
 */
export async function fetchMatchData(fixtureId: string): Promise<MatchData> {
  console.log(`${LOG_PREFIX} Fetching match data for fixture ${fixtureId}`);

  // Step 1: Core data from API-Football (required)
  const matchData = await withRetry(
    () => buildMatchData(fixtureId),
    `API-Football fixture ${fixtureId}`,
  );
  console.log(
    `${LOG_PREFIX} Core data loaded: ${matchData.home_team} ${matchData.home_score}-${matchData.away_score} ${matchData.away_team}`,
  );

  // Step 2: Enrich with ASA xG (best-effort)
  try {
    const xgData = await withRetry(
      () => getMatchXGoals(matchData.date),
      'ASA match xG',
    );

    if (xgData) {
      matchData.home_xg = Math.round(xgData.home_xgoals * 100) / 100;
      matchData.away_xg = Math.round(xgData.away_xgoals * 100) / 100;
      console.log(
        `${LOG_PREFIX} ASA xG enrichment: ${matchData.home_xg} - ${matchData.away_xg}`,
      );
    } else {
      console.warn(
        `${LOG_PREFIX} ASA xG data not available for this match (may be delayed post-match).`,
      );
    }
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} ASA xG enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Step 3: Enrich with goals-added context (best-effort)
  try {
    const goalsAdded = await withRetry(
      () => buildMatchGoalsAdded(matchData.home_team, matchData.away_team),
      'ASA goals-added',
    );
    matchData.goals_added = goalsAdded;
    console.log(
      `${LOG_PREFIX} Goals-added context loaded: home ${goalsAdded.home_total}, away ${goalsAdded.away_total}`,
    );
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} ASA goals-added enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Step 4: Optionally enrich with FBref player-level stats (best-effort)
  try {
    const dateStr = matchData.date.slice(0, 10);
    const fbrefUrl = await findMatchReportUrl(
      matchData.home_team,
      matchData.away_team,
      dateStr,
    );

    if (fbrefUrl) {
      const fbrefReport = await withRetry(
        () => getMatchReport(fbrefUrl),
        'FBref match report',
      );

      // Merge FBref possession/stats if API-Football returned zeroes
      if (
        fbrefReport.stats.possession &&
        matchData.stats.possession.home === 0
      ) {
        matchData.stats.possession = fbrefReport.stats.possession;
      }
      if (fbrefReport.stats.shots && matchData.stats.shots.home === 0) {
        matchData.stats.shots = fbrefReport.stats.shots;
      }

      console.log(
        `${LOG_PREFIX} FBref enrichment complete (${fbrefReport.playerStats.length} player records).`,
      );
    } else {
      console.warn(
        `${LOG_PREFIX} FBref match report not found for ${matchData.home_team} vs ${matchData.away_team} on ${dateStr}.`,
      );
    }
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} FBref enrichment failed (non-blocking): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  console.log(`${LOG_PREFIX} Match data assembly complete for fixture ${fixtureId}.`);
  return matchData;
}

/**
 * Fetch current MLS Eastern Conference standings.
 */
export async function fetchStandings(): Promise<Standing[]> {
  console.log(`${LOG_PREFIX} Fetching MLS Eastern Conference standings`);

  const standings = await withRetry(
    () => apiGetStandings(),
    'API-Football standings',
  );

  console.log(
    `${LOG_PREFIX} Standings loaded: ${standings.length} teams in Eastern Conference`,
  );
  return standings;
}

/**
 * Fetch player-level stats from ASA (xG, xA, goals-added).
 *
 * @param team - Optional team filter. Defaults to NYRB.
 */
export async function fetchPlayerStats(
  team?: string,
): Promise<PlayerStats[]> {
  console.log(
    `${LOG_PREFIX} Fetching player stats${team ? ` for ${team}` : ' for NYRB'}`,
  );

  const xgRows = await withRetry(
    () => getPlayerXGoals(),
    'ASA player xG',
  );

  let stats = mapToPlayerStats(xgRows);

  // Filter by team if specified
  if (team) {
    const teamLower = team.toLowerCase();
    stats = stats.filter(
      (p) =>
        p.team.toLowerCase().includes(teamLower) ||
        teamLower.includes(p.team.toLowerCase()),
    );
  }

  console.log(`${LOG_PREFIX} Player stats loaded: ${stats.length} players`);
  return stats;
}

/**
 * Fetch the next upcoming NYRB fixture.
 * Returns null if no upcoming fixtures are found.
 */
export async function fetchNextFixture(): Promise<Fixture | null> {
  console.log(`${LOG_PREFIX} Fetching next NYRB fixture`);

  const fixtures = await withRetry(
    () => getFixtures({ next: 1 }),
    'API-Football next fixture',
  );

  if (fixtures.length === 0) {
    console.warn(`${LOG_PREFIX} No upcoming NYRB fixtures found.`);
    return null;
  }

  const next = fixtures[0];
  console.log(
    `${LOG_PREFIX} Next fixture: ${next.home_team} vs ${next.away_team} on ${next.date}`,
  );
  return next;
}

/**
 * Find the most recently finished NYRB match and return both
 * the fixture metadata and the full enriched MatchData.
 *
 * Returns null if no recent finished match is found.
 */
export async function findRecentMatch(): Promise<{
  fixture: Fixture;
  data: MatchData;
} | null> {
  console.log(`${LOG_PREFIX} Finding most recent NYRB match`);

  const lastFixture = await withRetry(
    () => getLastMatch(),
    'API-Football last match',
  );

  if (!lastFixture) {
    console.warn(`${LOG_PREFIX} No recent NYRB match found.`);
    return null;
  }

  if (lastFixture.status !== 'finished') {
    console.warn(
      `${LOG_PREFIX} Most recent match (${lastFixture.id}) status is "${lastFixture.status}", not "finished".`,
    );
    return null;
  }

  console.log(
    `${LOG_PREFIX} Last finished match: fixture ${lastFixture.id} (${lastFixture.home_team} vs ${lastFixture.away_team})`,
  );

  const data = await fetchMatchData(lastFixture.id);

  return { fixture: lastFixture, data };
}
