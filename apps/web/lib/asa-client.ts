/**
 * American Soccer Analysis API Client
 * Free API: https://app.americansocceranalysis.com/api/v1
 * Provides xG, xPass, Goals Added, game-level shots, salaries — 2016 to present
 */

const ASA_BASE = 'https://app.americansocceranalysis.com/api/v1';
const NYRB_ASA_ID = 'UKMUVmFs'; // ASA team ID for NYRB

async function fetchASA<T>(path: string): Promise<T> {
  const res = await fetch(`${ASA_BASE}${path}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ASA API ${res.status}: ${path}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────

export interface ASAPlayerXG {
  player_id: string;
  player_name: string;
  team_id: string[];
  general_position: string;
  minutes_played: number;
  count_games: number;
  goals: number;
  assists: number;
  xgoals: number;
  xassists: number;
  xgoals_plus_xassists: number;
  goals_minus_xgoals: number;
  key_passes: number;
  shots: number;
  shots_on_target: number;
  season_name: string;
}

export interface ASAPlayerGA {
  player_id: string;
  player_name: string;
  team_id: string[];
  general_position: string;
  minutes_played: number;
  data: Array<{
    action_type: string;
    goals_added_raw: number;
    goals_added_above_avg: number;
    count_actions: number;
  }>;
  season_name: string;
}

export interface ASATeamXG {
  team_id: string;
  team_name: string;
  count_games: number;
  goals_for: number;
  goals_against: number;
  xgoals_for: number;
  xgoals_against: number;
  goal_difference: number;
  xgoal_difference: number;
  points: number;
  xpoints: number;
  season_name: string;
}

export interface ASATeamGA {
  team_id: string;
  team_name: string;
  data: Array<{
    action_type: string;
    goals_added_for: number;
    goals_added_against: number;
    num_actions_for: number;
    num_actions_against: number;
  }>;
  season_name: string;
}

export interface ASAGameXG {
  game_id: string;
  date_time_utc: string;
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
  home_xgoals: number;
  away_xgoals: number;
  home_team_name: string;
  away_team_name: string;
}

export interface ASAPlayerSalary {
  player_id: string;
  player_name: string;
  team_id: string;
  position: string;
  base_salary: number;
  guaranteed_compensation: number;
  season_name: string;
}

export interface ASAXPass {
  player_id: string;
  player_name: string;
  team_id: string[];
  general_position: string;
  minutes_played: number;
  attempted_passes: number;
  pass_completion_percentage: number;
  xpass_completion_percentage: number;
  passes_completed_over_expected: number;
  passes_completed_over_expected_p100: number;
  season_name: string;
}

export interface ASATeamXPass {
  team_id: string;
  team_name: string;
  count_games: number;
  attempted_passes_for: number;
  pass_completion_percentage_for: number;
  xpass_completion_percentage_for: number;
  passes_completed_over_expected_for: number;
  attempted_passes_against: number;
  pass_completion_percentage_against: number;
  xpass_completion_percentage_against: number;
  season_name: string;
}

// ── API Functions ────────────────────────────────────────────────

export async function getPlayerXGoals(season: number, teamId = NYRB_ASA_ID): Promise<ASAPlayerXG[]> {
  return fetchASA(`/mls/players/xgoals?season_name=${season}&team_id[]=${teamId}`);
}

export async function getPlayerGoalsAdded(season: number, teamId = NYRB_ASA_ID): Promise<ASAPlayerGA[]> {
  return fetchASA(`/mls/players/goals-added?season_name=${season}&team_id[]=${teamId}`);
}

export async function getPlayerXPass(season: number, teamId = NYRB_ASA_ID): Promise<ASAXPass[]> {
  return fetchASA(`/mls/players/xpass?season_name=${season}&team_id[]=${teamId}`);
}

export async function getPlayerSalaries(season: number, teamId = NYRB_ASA_ID): Promise<ASAPlayerSalary[]> {
  return fetchASA(`/mls/players/salaries?season_name=${season}&team_id=${teamId}`);
}

export async function getTeamXGoals(season: number): Promise<ASATeamXG[]> {
  return fetchASA(`/mls/teams/xgoals?season_name=${season}`);
}

export async function getTeamGoalsAdded(season: number, teamId = NYRB_ASA_ID): Promise<ASATeamGA[]> {
  return fetchASA(`/mls/teams/goals-added?season_name=${season}&team_id[]=${teamId}`);
}

export async function getTeamXPass(season: number): Promise<ASATeamXPass[]> {
  return fetchASA(`/mls/teams/xpass?season_name=${season}`);
}

export async function getGameXGoals(season: number, teamId = NYRB_ASA_ID): Promise<ASAGameXG[]> {
  return fetchASA(`/mls/games/xgoals?season_name=${season}&team_id[]=${teamId}`);
}

export async function getAllTeamXGoals(season: number): Promise<ASATeamXG[]> {
  return fetchASA(`/mls/teams/xgoals?season_name=${season}`);
}

export { NYRB_ASA_ID };
