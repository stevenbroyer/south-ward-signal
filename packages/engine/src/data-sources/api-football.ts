/**
 * API-Football v3 Client
 *
 * Full REST client for api-sports.io / API-Football v3.
 * Rate-limited to 30 requests/minute. Includes exponential backoff retry.
 */

import PQueue from 'p-queue';
import type {
  MatchData,
  MatchStats,
  Goal,
  PlayerLineup,
  Fixture,
  Standing,
} from '@sws/shared';
import { API_FOOTBALL, NYRB } from '@sws/shared';

// ─── Types from API-Football responses ─────────────────────

interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | unknown[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    venue: { name: string; city: string };
    status: { short: string; long: string; elapsed: number | null };
  };
  league: { id: number; name: string; season: number; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: Record<string, { home: number | null; away: number | null }>;
}

interface ApiFixtureStats {
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: number | string | null }>;
}

interface ApiFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}

interface ApiFixtureLineup {
  team: { id: number; name: string };
  formation: string;
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
}

interface ApiStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

// ─── Rate limiter ──────────────────────────────────────────

const queue = new PQueue({
  intervalCap: API_FOOTBALL.RATE_LIMIT_PER_MINUTE,
  interval: 60_000,
  carryoverConcurrencyCount: true,
});

// ─── NYRB team ID resolution ───────────────────────────────

let nyrbTeamId: number | null = null;

async function getNyrbTeamId(): Promise<number> {
  if (nyrbTeamId) return nyrbTeamId;

  const data = await apiFetch<
    Array<{ team: { id: number; name: string } }>
  >('/teams', {
    search: 'Red Bulls',
    league: String(API_FOOTBALL.MLS_LEAGUE_ID),
    season: String(API_FOOTBALL.CURRENT_SEASON),
  });

  const match = data.find(
    (t) =>
      t.team.name.includes('Red Bulls') ||
      t.team.name.includes('New York RB'),
  );

  if (!match) {
    throw new Error('Could not find NYRB team ID in API-Football.');
  }

  nyrbTeamId = match.team.id;
  return nyrbTeamId;
}

// ─── HTTP transport ────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is not set.');
  }

  const url = new URL(endpoint, API_FOOTBALL.BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = 1000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff + Math.random() * 500));
    }

    try {
      const response = await queue.add(async () => {
        const res = await fetch(url.toString(), {
          headers: {
            'x-apisports-key': apiKey,
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API-Football ${res.status}: ${text}`);
        }

        return res.json() as Promise<ApiFootballResponse<unknown>>;
      });

      if (!response) {
        throw new Error('Queue returned undefined');
      }

      const errors = response.errors;
      if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
        const errorMessages = Object.values(errors);
        if (errorMessages.length > 0) {
          throw new Error(`API-Football error: ${errorMessages.join(', ')}`);
        }
      }

      return response.response as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message;
      // Don't retry client errors (400-level) except 429
      if (msg.includes('4') && !msg.includes('429')) {
        break;
      }
    }
  }

  throw lastError || new Error('API-Football request failed');
}

// ─── Public API ────────────────────────────────────────────

/**
 * Get NYRB fixtures for the current season.
 * Optionally filter by date range or next N matches.
 */
export async function getFixtures(options?: {
  next?: number;
  from?: string;
  to?: string;
  season?: number;
}): Promise<Fixture[]> {
  const teamId = await getNyrbTeamId();
  const params: Record<string, string> = {
    team: String(teamId),
    league: String(API_FOOTBALL.MLS_LEAGUE_ID),
    season: String(options?.season ?? API_FOOTBALL.CURRENT_SEASON),
  };

  if (options?.next) params.next = String(options.next);
  if (options?.from) params.from = options.from;
  if (options?.to) params.to = options.to;

  const fixtures = await apiFetch<ApiFixture[]>('/fixtures', params);

  return fixtures.map((f) => mapFixture(f));
}

/**
 * Get the most recent finished NYRB match.
 */
export async function getLastMatch(): Promise<Fixture | null> {
  const teamId = await getNyrbTeamId();

  const fixtures = await apiFetch<ApiFixture[]>('/fixtures', {
    team: String(teamId),
    league: String(API_FOOTBALL.MLS_LEAGUE_ID),
    season: String(API_FOOTBALL.CURRENT_SEASON),
    last: '1',
  });

  if (fixtures.length === 0) return null;
  return mapFixture(fixtures[0]);
}

/**
 * Get detailed match statistics for a specific fixture.
 */
export async function getMatchStats(
  fixtureId: string | number,
): Promise<MatchStats> {
  const stats = await apiFetch<ApiFixtureStats[]>('/fixtures/statistics', {
    fixture: String(fixtureId),
  });

  if (stats.length < 2) {
    throw new Error(`Incomplete stats for fixture ${fixtureId}`);
  }

  const home = mapTeamStats(stats[0].statistics);
  const away = mapTeamStats(stats[1].statistics);

  return {
    possession: {
      home: home.possession,
      away: away.possession,
    },
    shots: { home: home.shots, away: away.shots },
    shots_on_target: {
      home: home.shotsOnTarget,
      away: away.shotsOnTarget,
    },
    corners: { home: home.corners, away: away.corners },
    fouls: { home: home.fouls, away: away.fouls },
    passing_accuracy: {
      home: home.passingAccuracy,
      away: away.passingAccuracy,
    },
    ppda: { home: 0, away: 0 }, // Not directly available from API-Football
  };
}

/**
 * Get events (goals, cards, subs) for a fixture.
 */
export async function getMatchEvents(
  fixtureId: string | number,
): Promise<Goal[]> {
  const events = await apiFetch<ApiFixtureEvent[]>('/fixtures/events', {
    fixture: String(fixtureId),
  });

  return events
    .filter((e) => e.type === 'Goal')
    .map((e) => ({
      player: e.player.name,
      minute: e.time.elapsed + (e.time.extra ?? 0),
      team: e.team.name,
      assist: e.assist.name ?? undefined,
      type: mapGoalType(e.detail),
    }));
}

/**
 * Get lineups for a fixture.
 */
export async function getLineups(
  fixtureId: string | number,
): Promise<{ home: PlayerLineup[]; away: PlayerLineup[] }> {
  const lineups = await apiFetch<ApiFixtureLineup[]>('/fixtures/lineups', {
    fixture: String(fixtureId),
  });

  if (lineups.length < 2) {
    return { home: [], away: [] };
  }

  const mapPlayers = (
    lineup: ApiFixtureLineup,
  ): PlayerLineup[] => {
    const starters: PlayerLineup[] = lineup.startXI.map((p) => ({
      name: p.player.name,
      number: p.player.number,
      position: p.player.pos,
    }));

    const subs: PlayerLineup[] = lineup.substitutes.map((p) => ({
      name: p.player.name,
      number: p.player.number,
      position: p.player.pos,
    }));

    return [...starters, ...subs];
  };

  return {
    home: mapPlayers(lineups[0]),
    away: mapPlayers(lineups[1]),
  };
}

/**
 * Get MLS Eastern Conference standings.
 */
export async function getStandings(
  season?: number,
): Promise<Standing[]> {
  const data = await apiFetch<
    Array<{ league: { standings: ApiStanding[][] } }>
  >('/standings', {
    league: String(API_FOOTBALL.MLS_LEAGUE_ID),
    season: String(season ?? API_FOOTBALL.CURRENT_SEASON),
  });

  if (data.length === 0 || !data[0].league.standings) {
    return [];
  }

  // MLS standings are grouped -- find the Eastern Conference group
  const allGroups = data[0].league.standings;
  const eastern =
    allGroups.find((g) =>
      g.some((t) => t.group.toLowerCase().includes('east')),
    ) ?? allGroups[0];

  return eastern.map((s) => ({
    team: s.team.name,
    team_id: String(s.team.id),
    position: s.rank,
    points: s.points,
    wins: s.all.win,
    draws: s.all.draw,
    losses: s.all.lose,
    goals_for: s.all.goals.for,
    goals_against: s.all.goals.against,
    goal_difference: s.goalsDiff,
    form: (s.form || '').split('').map((c) => c as 'W' | 'D' | 'L'),
    games_played: s.all.played,
  }));
}

/**
 * Build a full MatchData object from a fixture ID.
 */
export async function buildMatchData(
  fixtureId: string | number,
): Promise<MatchData> {
  const [fixtures, stats, goals, lineups] = await Promise.all([
    apiFetch<ApiFixture[]>('/fixtures', { id: String(fixtureId) }),
    getMatchStats(fixtureId),
    getMatchEvents(fixtureId),
    getLineups(fixtureId),
  ]);

  if (fixtures.length === 0) {
    throw new Error(`Fixture ${fixtureId} not found.`);
  }

  const f = fixtures[0];

  return {
    match_id: String(f.fixture.id),
    date: f.fixture.date,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_score: f.goals.home ?? 0,
    away_score: f.goals.away ?? 0,
    home_xg: 0, // xG not available from API-Football; supplemented by ASA
    away_xg: 0,
    status: mapStatus(f.fixture.status.short),
    stats,
    goals,
    lineups,
  };
}

// ─── Helpers ───────────────────────────────────────────────

function mapFixture(f: ApiFixture): Fixture {
  return {
    id: String(f.fixture.id),
    date: f.fixture.date,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    venue: f.fixture.venue.name,
    competition: f.league.name,
    status: mapStatus(f.fixture.status.short),
    home_score: f.goals.home ?? undefined,
    away_score: f.goals.away ?? undefined,
  };
}

function mapStatus(
  apiStatus: string,
): 'scheduled' | 'live' | 'finished' | 'postponed' {
  switch (apiStatus) {
    case 'FT':
    case 'AET':
    case 'PEN':
      return 'finished';
    case '1H':
    case '2H':
    case 'HT':
    case 'ET':
    case 'BT':
    case 'P':
    case 'LIVE':
      return 'live';
    case 'PST':
    case 'CANC':
    case 'ABD':
    case 'AWD':
    case 'WO':
      return 'postponed';
    default:
      return 'scheduled';
  }
}

function mapGoalType(
  detail: string,
): 'goal' | 'penalty' | 'own_goal' {
  if (detail.toLowerCase().includes('penalty')) return 'penalty';
  if (detail.toLowerCase().includes('own goal')) return 'own_goal';
  return 'goal';
}

interface ParsedStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  passingAccuracy: number;
}

function mapTeamStats(
  statistics: Array<{ type: string; value: number | string | null }>,
): ParsedStats {
  const get = (type: string): number => {
    const stat = statistics.find(
      (s) => s.type.toLowerCase().replace(/\s/g, '') === type.toLowerCase().replace(/\s/g, ''),
    );
    if (!stat || stat.value === null) return 0;
    if (typeof stat.value === 'string') {
      return parseInt(stat.value.replace('%', ''), 10) || 0;
    }
    return stat.value;
  };

  return {
    possession: get('BallPossession'),
    shots: get('TotalShots'),
    shotsOnTarget: get('ShotsonGoal'),
    corners: get('CornerKicks'),
    fouls: get('Fouls'),
    passingAccuracy: get('PassesAccurate'),
  };
}
