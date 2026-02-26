/**
 * South Ward Signal — Content Engine Orchestrator
 *
 * Public API for the engine package. Chains agents together into
 * complete pipelines: match-day, daily content, and weekly roundup.
 *
 * Each pipeline follows the same pattern:
 *   Data → Write → QA → (retry?) → Publish → Social
 *
 * @module engine
 */

import type { Article, MatchData, Standing, PlayerStats, Fixture } from '@sws/shared';

import {
  dataAgent,
  writerAgent,
  qaAgent,
  publisherAgent,
  socialAgent,
} from './agents';

// ── Re-exports for consumers ──────────────────────────────────

export { dataAgent, writerAgent, qaAgent, publisherAgent, socialAgent };
export type { Article, MatchData, Standing, PlayerStats, Fixture };

// ── Constants ─────────────────────────────────────────────────

const LOG = '[ENGINE]';
const MAX_QA_RETRIES = 2;

// ── Pipeline Result ──────────────────────────────────────────

export interface PipelineResult {
  success: boolean;
  article?: Article;
  ghostUrl?: string;
  ghostId?: string;
  qaResult?: Awaited<ReturnType<typeof qaAgent.validateArticle>>;
  error?: string;
}

// ── Match Day Pipeline ───────────────────────────────────────

/**
 * Full match-day pipeline: detect recent match → fetch data → generate
 * recap → QA → publish to Ghost → queue social posts.
 *
 * Returns null if no recent match was found.
 */
export async function runMatchDayPipeline(): Promise<PipelineResult | null> {
  console.log(`${LOG} ═══ Match Day Pipeline ═══`);

  // Step 1: Find recent match
  console.log(`${LOG} [1/6] Finding recent NYRB match...`);
  const recent = await dataAgent.findRecentMatch();
  if (!recent) {
    console.log(`${LOG} No recent match found. Exiting.`);
    return null;
  }

  const { fixture, data } = recent;
  console.log(
    `${LOG} Found: ${data.home_team} ${data.home_score}-${data.away_score} ${data.away_team}`,
  );

  // Step 2: Generate article
  console.log(`${LOG} [2/6] Generating match recap...`);
  let article = await writerAgent.generateMatchRecap(data);

  // Step 3: QA with retry loop
  console.log(`${LOG} [3/6] Running QA checks...`);
  let qaResult = await qaAgent.validateArticle(article, data);

  for (let retry = 0; retry < MAX_QA_RETRIES && !qaResult.passed; retry++) {
    if (!qaAgent.shouldRetry(qaResult)) {
      console.error(`${LOG} QA failures are not fixable by re-generation. Aborting.`);
      return {
        success: false,
        article,
        qaResult,
        error: `QA failed with non-fixable issues: ${qaResult.failures.map((f) => f.message).join('; ')}`,
      };
    }

    console.log(`${LOG} QA retry ${retry + 1}/${MAX_QA_RETRIES}...`);
    const instructions = qaAgent.buildRetryInstructions(qaResult);
    // Re-generate with QA feedback injected
    article = await writerAgent.generateMatchRecap(data);
    qaResult = await qaAgent.validateArticle(article, data);
  }

  if (!qaResult.passed) {
    console.error(`${LOG} QA failed after ${MAX_QA_RETRIES} retries. Aborting.`);
    return {
      success: false,
      article,
      qaResult,
      error: `QA failed after retries: ${qaResult.failures.map((f) => f.message).join('; ')}`,
    };
  }

  console.log(`${LOG} QA passed (confidence: ${qaResult.confidence})`);

  // Step 4: Publish to Ghost
  console.log(`${LOG} [4/6] Publishing to Ghost...`);
  let ghostUrl = '';
  let ghostId = '';
  try {
    const result = await publisherAgent.publishArticle(article);
    ghostUrl = result.url;
    ghostId = result.ghostId;
    console.log(`${LOG} Published: ${ghostUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Ghost publish failed: ${msg}`);
    return { success: false, article, qaResult, error: `Ghost publish failed: ${msg}` };
  }

  // Step 5: Record in Supabase
  console.log(`${LOG} [5/6] Recording in Supabase...`);
  try {
    await publisherAgent.recordInSupabase(article, ghostUrl);
  } catch (err) {
    console.warn(`${LOG} Supabase record failed (non-blocking): ${err}`);
  }

  // Step 6: Queue social distribution
  console.log(`${LOG} [6/6] Queuing social posts...`);
  try {
    await socialAgent.queueSocialPosts(article, ghostUrl);
  } catch (err) {
    console.warn(`${LOG} Social queue failed (non-blocking): ${err}`);
  }

  console.log(`${LOG} ═══ Match Day Pipeline Complete ═══`);
  return { success: true, article, ghostUrl, ghostId, qaResult };
}

// ── Daily Content Pipeline ───────────────────────────────────

export type DailyContentType =
  | 'pre-match-preview'
  | 'stat-of-week'
  | 'player-spotlight'
  | 'power-rankings';

/**
 * Generate and publish daily content based on the content type.
 */
export async function runDailyContent(
  type: DailyContentType,
): Promise<PipelineResult> {
  console.log(`${LOG} ═══ Daily Content: ${type} ═══`);

  let article: Article;

  switch (type) {
    case 'pre-match-preview': {
      const fixture = await dataAgent.fetchNextFixture();
      if (!fixture) {
        return { success: false, error: 'No upcoming fixture found.' };
      }
      const standings = await dataAgent.fetchStandings();
      article = await writerAgent.generatePreview(fixture, standings);
      break;
    }

    case 'stat-of-week': {
      const standings = await dataAgent.fetchStandings();
      article = await writerAgent.generateStatOfWeek(standings);
      break;
    }

    case 'player-spotlight': {
      const players = await dataAgent.fetchPlayerStats();
      if (players.length === 0) {
        return { success: false, error: 'No player stats available.' };
      }
      // Pick the top player by goals added (or xG as fallback)
      const sorted = [...players].sort(
        (a, b) => (b.goals_added ?? b.xg) - (a.goals_added ?? a.xg),
      );
      article = await writerAgent.generatePlayerSpotlight(sorted[0]);
      break;
    }

    case 'power-rankings': {
      const standings = await dataAgent.fetchStandings();
      const weekNumber = Math.ceil(
        (Date.now() - new Date('2026-02-28').getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      article = await writerAgent.generatePowerRankings(
        standings,
        Math.max(1, weekNumber),
      );
      break;
    }
  }

  // QA (no source data for non-recap articles)
  const qaResult = await qaAgent.validateArticle(article);
  if (!qaResult.passed && !qaAgent.shouldRetry(qaResult)) {
    return {
      success: false,
      article,
      qaResult,
      error: `QA failed: ${qaResult.failures.map((f) => f.message).join('; ')}`,
    };
  }

  // Publish
  let ghostUrl = '';
  let ghostId = '';
  try {
    const result = await publisherAgent.publishArticle(article);
    ghostUrl = result.url;
    ghostId = result.ghostId;
  } catch (err) {
    return {
      success: false,
      article,
      qaResult,
      error: `Ghost publish failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Record + social
  try { await publisherAgent.recordInSupabase(article, ghostUrl); } catch {}
  try { await socialAgent.queueSocialPosts(article, ghostUrl); } catch {}

  console.log(`${LOG} ═══ Daily Content Complete: ${ghostUrl} ═══`);
  return { success: true, article, ghostUrl, ghostId, qaResult };
}

// ── Weekly Roundup Pipeline ──────────────────────────────────

/**
 * Determine which daily content type to generate based on the day of week.
 * Returns null on rest days (Tue/Thu).
 */
export function getDailyContentType(
  dayOfWeek: number,
  hasMatchToday: boolean,
): DailyContentType | null {
  if (hasMatchToday) return 'pre-match-preview';

  switch (dayOfWeek) {
    case 0: return 'pre-match-preview'; // Sunday
    case 1: return 'stat-of-week';      // Monday
    case 3: return 'player-spotlight';   // Wednesday
    case 5: return 'power-rankings';     // Friday
    case 6: return 'pre-match-preview'; // Saturday
    default: return null;               // Tue/Thu rest
  }
}
