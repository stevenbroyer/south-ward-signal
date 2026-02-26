/**
 * American Soccer Analysis (ASA) API Client
 *
 * REST client for https://app.americansocceranalysis.com/api/v1/
 * Provides xG, goals-added (g+), and advanced MLS analytics.
 */

import type { GoalsAdded, PlayerStats } from '@sws/shared';
import { ASA_API } from '@sws/shared';

// ─── ASA Response Types ────────────────────────────────────

interface AsaTeamXgRow {
  team_id: string;
  team_name: string;
  season_name: string;
  count_games: number;
  shots_for: number;
  shots_against: number;
  goals_for: number;
  goals_against: number;
  xgoals_for: number;
  xgoals_against: number;
  xgoal_difference: number;
  goal_difference: number;
  points: number;
}

interface AsaPlayerGaPlusRow {
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  season_name: string;
  minutes_played: number;
  data: {
    dribbling: number;
    fouling: number;
    interrupting: number;
    passing: number;
    receiving: number;
    shooting: number;
  };
  general_position: string;
  goals_added_raw: number;
  goals_added_above_avg: number;
}

interface AsaTeamGaPlusRow {
  team_id: string;
  team_name: string;
  season_name: string;
  minutes: number;
  goals_added_raw: number;
  goals_added_above_avg: number;
}

interface AsaMatchXgRow {
  match_id: string;
  date: string;
  home_team_id: string;
  home_team_name: string;
  away_team_id: string;
  away_team_name: string;
  home_goals: number;
  away_goals: number;
  home_xgoals: number;
  away_xgoals: number;
}

interface AsaPlayerXgRow {
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  general_position: string;
  season_name: string;
  minutes_played: number;
  shots: number;
  shots_on_target: number;
  goals: number;
  xgoals: number;
  xplace: number;
  goals_minus_xgoals: number;
  key_passes: number;
  primary_assists: number;
  xassists: number;
  primary_assists_minus_xassists: number;
  xgoals_plus_xassists: number;
}

// ─── HTTP transport ────────────────────────────────────────

const MAX_RETRIES = 3;

async function asaFetch<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${ASA_API.BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = 1000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff + Math.random() * 500));
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`ASA API ${res.status}: ${text}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (
        lastError.message.includes('400') ||
        lastError.message.includes('404')
      ) {
        break; // Don't retry client errors
      }
    }
  }

  throw lastError || new Error('ASA API request failed');
}

// ─── NYRB team ID resolution ──────────────────────────────

let nyrbAsaTeamId: string | null = null;

async function resolveNyrbTeamId(): Promise<string> {
  if (nyrbAsaTeamId) return nyrbAsaTeamId;

  const teams = await asaFetch<Array<{ team_id: string; team_name: string }>>(
    `/mls/teams`,
  );

  const nyrb = teams.find(
    (t) =>
      t.team_name.includes('Red Bulls') ||
      t.team_name.includes('NY Red Bulls') ||
      t.team_name.includes('New York RB'),
  );

  if (!nyrb) {
    throw new Error('Could not find NYRB in ASA teams list.');
  }

  nyrbAsaTeamId = nyrb.team_id;
  return nyrbAsaTeamId;
}

// ─── Public API ────────────────────────────────────────────

/**
 * Get team-level xG data for NYRB for the current season.
 */
export async function getTeamXGoals(
  season?: string,
): Promise<AsaTeamXgRow | null> {
  const teamId = await resolveNyrbTeamId();
  const seasonParam = season || String(new Date().getFullYear());

  const rows = await asaFetch<AsaTeamXgRow[]>(
    `/mls/teams/xgoals`,
    {
      team_id: teamId,
      season_name: seasonParam,
    },
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get match-level xG for a specific NYRB match by date.
 */
export async function getMatchXGoals(
  matchDate: string,
): Promise<AsaMatchXgRow | null> {
  const teamId = await resolveNyrbTeamId();

  // ASA returns all matches; filter by team and date
  const rows = await asaFetch<AsaMatchXgRow[]>(
    `/mls/matches/xgoals`,
    {
      season_name: matchDate.slice(0, 4),
    },
  );

  const dateStr = matchDate.slice(0, 10); // YYYY-MM-DD

  const match = rows.find(
    (r) =>
      r.date.startsWith(dateStr) &&
      (r.home_team_id === teamId || r.away_team_id === teamId),
  );

  return match ?? null;
}

/**
 * Get player-level goals-added (g+) for NYRB.
 */
export async function getPlayerGoalsAdded(
  season?: string,
): Promise<AsaPlayerGaPlusRow[]> {
  const teamId = await resolveNyrbTeamId();
  const seasonParam = season || String(new Date().getFullYear());

  const rows = await asaFetch<AsaPlayerGaPlusRow[]>(
    `/mls/players/goals-added`,
    {
      team_id: teamId,
      season_name: seasonParam,
    },
  );

  // Sort by total g+ descending
  return rows.sort(
    (a, b) => b.goals_added_above_avg - a.goals_added_above_avg,
  );
}

/**
 * Get team-level goals-added (g+) for NYRB.
 */
export async function getTeamGoalsAdded(
  season?: string,
): Promise<AsaTeamGaPlusRow | null> {
  const teamId = await resolveNyrbTeamId();
  const seasonParam = season || String(new Date().getFullYear());

  const rows = await asaFetch<AsaTeamGaPlusRow[]>(
    `/mls/teams/goals-added`,
    {
      team_id: teamId,
      season_name: seasonParam,
    },
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get player-level xG/xA data for NYRB.
 */
export async function getPlayerXGoals(
  season?: string,
): Promise<AsaPlayerXgRow[]> {
  const teamId = await resolveNyrbTeamId();
  const seasonParam = season || String(new Date().getFullYear());

  const rows = await asaFetch<AsaPlayerXgRow[]>(
    `/mls/players/xgoals`,
    {
      team_id: teamId,
      season_name: seasonParam,
    },
  );

  return rows.sort((a, b) => b.xgoals_plus_xassists - a.xgoals_plus_xassists);
}

/**
 * Build a GoalsAdded structure for a specific match, pulling from
 * season-level g+ data. Provides context for match coverage.
 */
export async function buildMatchGoalsAdded(
  homeTeamName: string,
  awayTeamName: string,
): Promise<GoalsAdded> {
  const allPlayers = await asaFetch<AsaPlayerGaPlusRow[]>(
    `/mls/players/goals-added`,
    {
      season_name: String(new Date().getFullYear()),
    },
  );

  // Find players from both teams
  const homeNameLower = homeTeamName.toLowerCase();
  const awayNameLower = awayTeamName.toLowerCase();

  const homePlayers = allPlayers.filter((p) =>
    p.team_name.toLowerCase().includes(homeNameLower) ||
    homeNameLower.includes(p.team_name.toLowerCase()),
  );
  const awayPlayers = allPlayers.filter((p) =>
    p.team_name.toLowerCase().includes(awayNameLower) ||
    awayNameLower.includes(p.team_name.toLowerCase()),
  );

  const homeTotal = homePlayers.reduce(
    (sum, p) => sum + p.goals_added_above_avg,
    0,
  );
  const awayTotal = awayPlayers.reduce(
    (sum, p) => sum + p.goals_added_above_avg,
    0,
  );

  // Top 5 performers across both teams
  const allMatchPlayers = [...homePlayers, ...awayPlayers].sort(
    (a, b) => b.goals_added_above_avg - a.goals_added_above_avg,
  );

  const topPerformers = allMatchPlayers.slice(0, 5).map((p) => ({
    player: p.player_name,
    g_plus: Math.round(p.goals_added_above_avg * 100) / 100,
    team: p.team_name,
  }));

  return {
    home_total: Math.round(homeTotal * 100) / 100,
    away_total: Math.round(awayTotal * 100) / 100,
    top_performers: topPerformers,
  };
}

/**
 * Convert ASA player xG data to the shared PlayerStats format.
 */
export function mapToPlayerStats(rows: AsaPlayerXgRow[]): PlayerStats[] {
  return rows.map((r) => ({
    name: r.player_name,
    team: r.team_name,
    position: r.general_position,
    games_played: 0, // Not directly available from xG endpoint
    minutes: r.minutes_played,
    goals: r.goals,
    assists: r.primary_assists,
    xg: Math.round(r.xgoals * 100) / 100,
    xa: Math.round(r.xassists * 100) / 100,
    key_passes: r.key_passes,
  }));
}
