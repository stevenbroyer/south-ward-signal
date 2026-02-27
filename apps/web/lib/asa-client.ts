/**
 * American Soccer Analysis API Client
 * Free API: https://app.americansocceranalysis.com/api/v1
 * Provides xG, xPass, Goals Added, game-level shots, salaries — 2016 to present
 */

const ASA_BASE = 'https://app.americansocceranalysis.com/api/v1';
const NYRB_ASA_ID = 'a2lqRX2Mr0'; // ASA team ID for NYRB

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
  return fetchASA(`/mls/players/xgoals?season_name=${season}&team_id=${teamId}`);
}

export async function getPlayerGoalsAdded(season: number, teamId = NYRB_ASA_ID): Promise<ASAPlayerGA[]> {
  return fetchASA(`/mls/players/goals-added?season_name=${season}&team_id=${teamId}`);
}

export async function getPlayerXPass(season: number, teamId = NYRB_ASA_ID): Promise<ASAXPass[]> {
  return fetchASA(`/mls/players/xpass?season_name=${season}&team_id=${teamId}`);
}

export async function getPlayerSalaries(season: number, teamId = NYRB_ASA_ID): Promise<ASAPlayerSalary[]> {
  return fetchASA(`/mls/players/salaries?season_name=${season}&team_id=${teamId}`);
}

export async function getTeamXGoals(season: number): Promise<ASATeamXG[]> {
  return fetchASA(`/mls/teams/xgoals?season_name=${season}`);
}

export async function getTeamGoalsAdded(season: number, teamId = NYRB_ASA_ID): Promise<ASATeamGA[]> {
  return fetchASA(`/mls/teams/goals-added?season_name=${season}&team_id=${teamId}`);
}

export async function getTeamXPass(season: number): Promise<ASATeamXPass[]> {
  return fetchASA(`/mls/teams/xpass?season_name=${season}`);
}

export async function getGameXGoals(season: number, teamId = NYRB_ASA_ID): Promise<ASAGameXG[]> {
  return fetchASA(`/mls/games/xgoals?season_name=${season}&team_id=${teamId}`);
}

export async function getAllTeamXGoals(season: number): Promise<ASATeamXG[]> {
  return fetchASA(`/mls/teams/xgoals?season_name=${season}`);
}

// ── Shot & Flow Data ────────────────────────────────────────────

export interface ASAGameShot {
  game_id: string;
  team_id: string;
  player_id: string;
  date: string;
  minute: number;
  second: number;
  location_x: number;
  location_y: number;
  shot_distance: number;
  shot_angle: number;
  shot_body_part: string;
  xgoal: number;
  result: string; // 'Goal' | 'Saved' | 'Blocked' | 'Off Target' | 'Post'
  pattern_of_play: string;
  season_name: string;
}

export interface ASAGameFlowEntry {
  game_id: string;
  minute: number;
  home_team_xgoals: number;
  away_team_xgoals: number;
}

export async function getGameShots(gameId: string): Promise<ASAGameShot[]> {
  return fetchASA(`/mls/games/shots?game_id=${gameId}`);
}

export async function getGameFlow(gameId: string): Promise<ASAGameFlowEntry[]> {
  return fetchASA(`/mls/games/game-flow?game_id=${gameId}`);
}

// ── Goalkeeper Data ─────────────────────────────────────────────

export interface ASAGKXGoals {
  player_id: string;
  player_name: string;
  team_id: string[];
  minutes_played: number;
  shots_faced: number;
  goals_conceded: number;
  saves: number;
  share_headed_shots: number;
  xgoals_gk_faced: number;
  goals_minus_xgoals_gk: number;
  goals_divided_by_xgoals_gk: number;
  season_name: string;
}

export interface ASAGKGoalsAdded {
  player_id: string;
  player_name: string;
  team_id: string[];
  minutes_played: number;
  data: Array<{
    action_type: string;
    goals_added_raw: number;
    goals_added_above_avg: number;
    count_actions: number;
  }>;
  season_name: string;
}

export async function getGKXGoals(season: number, teamId = NYRB_ASA_ID): Promise<ASAGKXGoals[]> {
  return fetchASA(`/mls/goalkeepers/xgoals?season_name=${season}&team_id=${teamId}`);
}

export async function getGKGoalsAdded(season: number, teamId = NYRB_ASA_ID): Promise<ASAGKGoalsAdded[]> {
  return fetchASA(`/mls/goalkeepers/goals-added?season_name=${season}&team_id=${teamId}`);
}

// ── Team Salaries ───────────────────────────────────────────────

export interface ASATeamSalary {
  team_id: string;
  team_name: string;
  season_name: string;
  guaranteed_compensation: number;
  count_players: number;
  avg_guaranteed_compensation: number;
  median_guaranteed_compensation: number;
}

export async function getTeamSalaries(season: number): Promise<ASATeamSalary[]> {
  return fetchASA(`/mls/teams/salaries?season_name=${season}`);
}

// ── Per-Game Player xGoals ──────────────────────────────────────

export async function getPlayerXGoalsByGame(season: number, teamId = NYRB_ASA_ID): Promise<ASAPlayerXG[]> {
  return fetchASA(`/mls/players/xgoals?season_name=${season}&team_id=${teamId}&split_by_game=true`);
}

export { NYRB_ASA_ID };
