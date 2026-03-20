/**
 * SportMonks Football API v3 — Shared Client
 *
 * Used by sync-sportmonks.ts and backfill-sportmonks.ts
 */

const API_TOKEN = process.env.SPORTMONKS_API_TOKEN || '';
const BASE_URL = 'https://api.sportmonks.com/v3/football';

export const MLS_LEAGUE_ID = 779;
export const NWSL_LEAGUE_ID = 2328;
export const RBNY_TEAM_ID = 383;
export const RBNY_TEAM_IDS = [190, 383]; // 190 = "Red Bull New York" (2026+), 383 = "New York RB" (historical)

// Stat type IDs → human-readable codes (from SportMonks types API)
export const STAT_TYPES: Record<number, string> = {
  34: 'corners',
  41: 'shots-off-target',
  42: 'shots-total',
  43: 'attacks',
  44: 'dangerous-attacks',
  45: 'ball-possession',
  46: 'ball-safe',
  49: 'shots-insidebox',
  50: 'shots-outsidebox',
  51: 'offsides',
  52: 'goals',
  53: 'goal-kicks',
  54: 'goal-attempts',
  55: 'free-kicks',
  56: 'fouls',
  57: 'saves',
  58: 'shots-blocked',
  59: 'substitutions',
  60: 'throwins',
  62: 'long-passes',
  64: 'hit-woodwork',
  65: 'successful-headers',
  78: 'tackles',
  80: 'passes',
  81: 'successful-passes',
  82: 'successful-passes-pct',
  83: 'redcards',
  84: 'yellowcards',
  86: 'shots-on-target',
  87: 'injuries',
  98: 'total-crosses',
  99: 'accurate-crosses',
  100: 'interceptions',
  108: 'dribble-attempts',
  109: 'successful-dribbles',
  117: 'key-passes',
  580: 'big-chances-created',
  581: 'big-chances-missed',
  1533: 'successful-crosses-pct',
  1605: 'successful-dribbles-pct',
  // xG stats (from xGFixture include / Pressure Index & xG bundle)
  5304: 'expected-goals',
  5305: 'expected-goals-on-target',
  7939: 'expected-points',
  7941: 'expected-goals-free-kicks',
  7942: 'expected-goals-corners',
  7943: 'expected-non-penalty-goals',
  7944: 'expected-goals-set-play',
  7945: 'expected-goals-open-play',
  9685: 'shooting-performance',
  9687: 'expected-goals-against',
  27264: 'successful-long-passes',
  27265: 'successful-long-passes-pct',
};

// Player-level stat type IDs (from lineup details)
export const PLAYER_STAT_TYPES: Record<number, string> = {
  40: 'captain',
  41: 'shots-off-target',
  42: 'shots-total',
  51: 'offsides',
  52: 'goals',
  56: 'fouls',
  57: 'saves',
  58: 'shots-blocked',
  78: 'tackles',
  79: 'assists',
  80: 'passes',
  84: 'yellowcards',
  86: 'shots-on-target',
  88: 'goals-conceded',
  94: 'dispossessed',
  96: 'fouls-drawn',
  97: 'blocked-shots',
  98: 'total-crosses',
  99: 'accurate-crosses',
  100: 'interceptions',
  101: 'clearances',
  104: 'saves-inside-box',
  105: 'total-duels',
  106: 'duels-won',
  107: 'aerials-won',
  108: 'dribble-attempts',
  109: 'successful-dribbles',
  110: 'dribbled-past',
  116: 'accurate-passes',
  117: 'key-passes',
  118: 'rating',
  119: 'minutes-played',
  120: 'touches',
  122: 'long-balls',
  123: 'long-balls-won',
  580: 'big-chances-created',
  581: 'big-chances-missed',
  584: 'good-high-claim',
  1491: 'duels-lost',
  1533: 'successful-crosses-pct',
  1535: 'gk-goals-conceded',
  1584: 'accurate-passes-pct',
  9706: 'chances-created',
  27266: 'aerials-lost',
  27267: 'tackles-won',
  27268: 'tackles-won-pct',
  27269: 'passes-in-final-third',
  27271: 'ball-recovery',
  27272: 'backward-passes',
  27273: 'possession-lost',
  27274: 'aerials',
  27275: 'aerials-won-pct',
  27276: 'duels-won-pct',
};

// Event type IDs
export const EVENT_TYPES: Record<number, string> = {
  14: 'goal',
  15: 'own-goal',
  16: 'penalty',
  17: 'missed-penalty',
  18: 'substitution',
  19: 'yellowcard',
  20: 'redcard',
  21: 'yellowred',
  22: 'pen-shootout-miss',
  23: 'pen-shootout-goal',
};

interface RateLimiter {
  remaining: number;
  resetAt: number;
}

const rateLimiter: RateLimiter = { remaining: 2000, resetAt: 0 };

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function smFetch<T = any>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<{ data: T[]; pagination?: any }> {
  // Rate limit guard
  if (rateLimiter.remaining < 10 && Date.now() < rateLimiter.resetAt) {
    const waitMs = rateLimiter.resetAt - Date.now() + 1000;
    console.log(`  Rate limit near, waiting ${Math.round(waitMs / 1000)}s...`);
    await delay(waitMs);
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_token', API_TOKEN);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SportMonks ${res.status}: ${endpoint} — ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  // Update rate limiter
  if (json.rate_limit) {
    rateLimiter.remaining = json.rate_limit.remaining;
    rateLimiter.resetAt = Date.now() + (json.rate_limit.resets_in_seconds || 3600) * 1000;
  }

  return { data: json.data || [], pagination: json.pagination };
}

/** Fetch all pages of a paginated endpoint */
export async function smFetchAll<T = any>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, pagination } = await smFetch<T>(endpoint, {
      ...params,
      per_page: '50',
      page: String(page),
    });
    all.push(...data);
    hasMore = pagination?.has_more ?? false;
    page++;
    await delay(50); // Be nice to API
  }

  return all;
}

/** Get all MLS seasons */
export async function getMLSSeasons() {
  return smFetchAll('/seasons', { filters: `seasonLeagues:${MLS_LEAGUE_ID}` });
}

/** Get teams for a season */
export async function getSeasonTeams(seasonId: number) {
  return smFetchAll(`/teams/seasons/${seasonId}`);
}

/** Get fixtures for a date range in a league, optionally filtered by team */
export async function getFixtures(opts: {
  from: string;
  to: string;
  leagueId?: number;
  teamId?: number;
  includes?: string;
}) {
  const filters = [`fixtureLeagues:${opts.leagueId || MLS_LEAGUE_ID}`];
  if (opts.teamId) filters.push(`fixtureParticipants:${opts.teamId}`);

  return smFetchAll('/fixtures/between/' + opts.from + '/' + opts.to, {
    filters: filters.join(';'),
    ...(opts.includes ? { include: opts.includes } : {}),
  });
}

/** Get fixtures for a specific season */
export async function getSeasonFixtures(seasonId: number, includes?: string) {
  const params: Record<string, string> = {};
  if (includes) params.include = includes;
  return smFetchAll(`/fixtures/between/2000-01-01/2030-12-31`, {
    filters: `fixtureSeason:${seasonId}`,
    ...params,
  });
}

/** Get standings for a season */
export async function getStandings(seasonId: number) {
  const { data } = await smFetch(`/standings/seasons/${seasonId}`, {
    include: 'participant',
  });
  return data;
}

/** Get team squad */
export async function getTeamSquad(teamId: number) {
  const { data } = await smFetch(`/teams/${teamId}`, {
    include: 'players.player.position;players.player.detailedPosition;players.player.nationality',
  });
  return data;
}

/** Parse score entries from fixture */
export function parseScores(scores: any[]): {
  home: number | null;
  away: number | null;
  htHome: number | null;
  htAway: number | null;
} {
  let home: number | null = null;
  let away: number | null = null;
  let htHome: number | null = null;
  let htAway: number | null = null;

  for (const s of scores || []) {
    const desc = s.description;
    const goals = s.score?.goals;
    const participant = s.score?.participant;

    if (desc === 'CURRENT') {
      if (participant === 'home') home = goals;
      else away = goals;
    } else if (desc === '1ST_HALF') {
      if (participant === 'home') htHome = goals;
      else htAway = goals;
    }
  }

  return { home, away, htHome, htAway };
}

/** Map fixture state to our simplified state */
export function mapState(stateId: number): string {
  // SportMonks state IDs:
  // 1=NS, 2=INPLAY_1H, 3=INPLAY_2H, 4=HT, 5=FT, 6=AET, 7=PEN, etc.
  const FINISHED = [5, 6, 7, 8, 9, 11];
  const LIVE = [2, 3, 4, 21, 22, 23, 24, 25];
  const POSTPONED = [10, 12, 13, 14, 15, 16, 17, 18, 19];

  if (FINISHED.includes(stateId)) return 'FT';
  if (LIVE.includes(stateId)) return 'LIVE';
  if (POSTPONED.includes(stateId)) return 'POSTPONED';
  return 'NS'; // Not started
}
