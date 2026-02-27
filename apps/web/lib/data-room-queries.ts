/**
 * Data Room — Supabase Query Functions
 * Central query layer for all data room pages.
 */

import { supabase } from './supabase';

const isConfigured = !!supabase;
const NYRB = 'New York Red Bulls';

/** Wrap a query so it returns a fallback on any error (e.g. missing table) */
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// ── Overview ────────────────────────────────────────────────────

export interface OverviewMetrics {
  points: number;
  ppg: number;
  xgDiff: number;
  goalsAdded: number;
  form: string[];
  confRank: number;
  gamesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  xgFor: number;
  xgAgainst: number;
}

const EMPTY_OVERVIEW: OverviewMetrics = { points: 0, ppg: 0, xgDiff: 0, goalsAdded: 0, form: [], confRank: 0, gamesPlayed: 0, goalsFor: 0, goalsAgainst: 0, xgFor: 0, xgAgainst: 0 };

export async function getOverviewMetrics(season = 2025): Promise<OverviewMetrics> {
  if (!isConfigured) return EMPTY_OVERVIEW;
  return safeQuery(async () => {
    const [standingRes, teamStatsRes] = await Promise.all([
      supabase.from('standings').select('*').ilike('team', '%Red Bulls%').eq('season', season).single(),
      supabase.from('team_season_stats').select('*').eq('team', NYRB).eq('season', season).single(),
    ]);
    const s = standingRes.data;
    const ts = teamStatsRes.data;
    return {
      points: s?.points ?? 0,
      ppg: s?.ppg ? Number(s.ppg) : 0,
      xgDiff: ts ? Number(ts.xg_for) - Number(ts.xg_against) : 0,
      goalsAdded: ts?.goals_added ? Number(ts.goals_added) : 0,
      form: (s?.form || []) as string[],
      confRank: s?.position ?? 0,
      gamesPlayed: s?.games_played ?? 0,
      goalsFor: s?.goals_for ?? 0,
      goalsAgainst: s?.goals_against ?? 0,
      xgFor: ts ? Number(ts.xg_for) : 0,
      xgAgainst: ts ? Number(ts.xg_against) : 0,
    };
  }, EMPTY_OVERVIEW);
}

export async function getSeasonXgRace(season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('team_match_advanced')
      .select('match_date, xg_for, xg_against, goals_for, goals_against, opponent, is_home, result')
      .eq('team', NYRB).eq('season', season)
      .order('match_date', { ascending: true });
    if (!data) return [];
    let cumXgFor = 0, cumXgAgainst = 0;
    return data.map((m, i) => {
      cumXgFor += Number(m.xg_for);
      cumXgAgainst += Number(m.xg_against);
      return { matchweek: i + 1, date: m.match_date, xgFor: +cumXgFor.toFixed(2), xgAgainst: +cumXgAgainst.toFixed(2), opponent: m.opponent, result: m.result };
    });
  }, []);
}

export async function getFormStreak(season = 2025, limit = 10) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('team_match_advanced')
      .select('match_id, match_date, opponent, is_home, result, goals_for, goals_against')
      .eq('team', NYRB).eq('season', season)
      .order('match_date', { ascending: false }).limit(limit);
    return (data || []).reverse();
  }, []);
}

export async function getPointsTrajectory(season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('team_match_advanced')
      .select('match_date, result')
      .eq('team', NYRB).eq('season', season)
      .order('match_date', { ascending: true });
    if (!data) return [];
    let cumPoints = 0;
    return data.map((m, i) => {
      cumPoints += m.result === 'W' ? 3 : m.result === 'D' ? 1 : 0;
      const mw = i + 1;
      return { matchweek: mw, points: cumPoints, playoffPace: +(mw * 1.5).toFixed(1), shieldPace: +(mw * 2.0).toFixed(1) };
    });
  }, []);
}

export async function getTopPerformers(season = 2025, limit = 3) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('player_stats')
      .select('name, position, goals, assists, xg, goals_added, minutes, games_played')
      .eq('team', NYRB).eq('season', season)
      .order('goals_added', { ascending: false }).limit(limit);
    return data || [];
  }, []);
}

// ── Matches ─────────────────────────────────────────────────────

export async function getMatchList(season = 2025, filters?: { result?: string; home?: boolean }) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('matches').select('*')
      .or(`home_team.eq.${NYRB},away_team.eq.${NYRB}`)
      .eq('season', season)
      .order('date', { ascending: false });
    let matches = data || [];
    if (filters?.result) {
      matches = matches.filter((m) => {
        const isHome = m.home_team === NYRB;
        const gf = isHome ? m.home_score : m.away_score;
        const ga = isHome ? m.away_score : m.home_score;
        if (filters.result === 'W') return (gf ?? 0) > (ga ?? 0);
        if (filters.result === 'D') return (gf ?? 0) === (ga ?? 0);
        if (filters.result === 'L') return (gf ?? 0) < (ga ?? 0);
        return true;
      });
    }
    if (filters?.home !== undefined) {
      matches = matches.filter((m) => filters.home ? m.home_team === NYRB : m.away_team === NYRB);
    }
    return matches;
  }, []);
}

export async function getMatchDetail(matchId: string) {
  if (!isConfigured) return null;
  return safeQuery(async () => {
    const { data } = await supabase.from('matches').select('*').eq('id', matchId).single();
    return data;
  }, null);
}

export async function getMatchShots(matchId: string) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('match_shots').select('*').eq('match_id', matchId).order('minute', { ascending: true });
    return data || [];
  }, []);
}

export async function getMatchXgFlow(matchId: string) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('match_xg_flow').select('*').eq('match_id', matchId).order('minute', { ascending: true });
    return data || [];
  }, []);
}

export async function getMatchPlayerStats(matchId: string) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('player_match_stats').select('*').eq('match_id', matchId).order('fotmob_rating', { ascending: false });
    return data || [];
  }, []);
}

// ── Players ─────────────────────────────────────────────────────

export async function getPlayerList(season = 2025, filters?: { position?: string; sort?: string }) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    let query = supabase.from('player_stats').select('*').eq('team', NYRB).eq('season', season);
    if (filters?.position && filters.position !== 'all') query = query.eq('position', filters.position);
    query = query.order(filters?.sort || 'goals_added', { ascending: false });
    const { data } = await query;
    return data || [];
  }, []);
}

export async function getPlayerDetail(playerName: string, season = 2025) {
  if (!isConfigured) return null;
  return safeQuery(async () => {
    const { data } = await supabase.from('player_stats').select('*').eq('name', playerName).eq('season', season).single();
    return data;
  }, null);
}

export async function getPlayerMatchLog(playerName: string, _season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('player_match_stats')
      .select('*, matches!inner(date, home_team, away_team, home_score, away_score)')
      .eq('player_name', playerName)
      .order('created_at', { ascending: true });
    return data || [];
  }, []);
}

export async function getPlayerSeasonHistory(playerName: string) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('player_season_history').select('*').eq('player_name', playerName).eq('team', NYRB).order('season', { ascending: true });
    return data || [];
  }, []);
}

export async function getPlayerGoalsAddedBreakdown(playerName: string, season = 2025) {
  if (!isConfigured) return null;
  return safeQuery(async () => {
    const { data } = await supabase
      .from('player_season_history')
      .select('ga_dribbling, ga_passing, ga_receiving, ga_shooting, ga_defending, goals_added')
      .eq('player_name', playerName).eq('team', NYRB).eq('season', season).single();
    return data;
  }, null);
}

export async function getPlayersForCompare(playerNames: string[], season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('player_stats').select('*').eq('season', season).in('name', playerNames);
    return data || [];
  }, []);
}

// ── Team ────────────────────────────────────────────────────────

export async function getTeamMatchTrends(season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('team_match_advanced').select('*').eq('team', NYRB).eq('season', season).order('match_date', { ascending: true });
    return data || [];
  }, []);
}

export async function getHomeAwaySplit(season = 2025) {
  if (!isConfigured) return { home: null, away: null };
  return safeQuery(async () => {
    const { data } = await supabase
      .from('team_match_advanced')
      .select('is_home, result, goals_for, goals_against, xg_for, xg_against, clean_sheet')
      .eq('team', NYRB).eq('season', season);
    if (!data) return { home: null, away: null };
    const aggregate = (matches: typeof data) => {
      const count = matches.length || 1;
      return {
        games: matches.length,
        wins: matches.filter((m) => m.result === 'W').length,
        draws: matches.filter((m) => m.result === 'D').length,
        losses: matches.filter((m) => m.result === 'L').length,
        goalsFor: matches.reduce((s, m) => s + (m.goals_for ?? 0), 0),
        goalsAgainst: matches.reduce((s, m) => s + (m.goals_against ?? 0), 0),
        avgXgFor: +(matches.reduce((s, m) => s + Number(m.xg_for ?? 0), 0) / count).toFixed(2),
        avgXgAgainst: +(matches.reduce((s, m) => s + Number(m.xg_against ?? 0), 0) / count).toFixed(2),
        cleanSheets: matches.filter((m) => m.clean_sheet).length,
      };
    };
    return { home: aggregate(data.filter((m) => m.is_home)), away: aggregate(data.filter((m) => !m.is_home)) };
  }, { home: null, away: null });
}

export async function getShotZones(season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data: matches } = await supabase
      .from('matches').select('id')
      .or(`home_team.eq.${NYRB},away_team.eq.${NYRB}`)
      .eq('season', season).eq('status', 'finished');
    if (!matches?.length) return [];
    const { data } = await supabase.from('match_shots').select('x, y, xg, outcome').eq('team', NYRB).in('match_id', matches.map((m) => m.id));
    return data || [];
  }, []);
}

// ── League ──────────────────────────────────────────────────────

export async function getEnhancedStandings(season = 2025, conference = 'Eastern') {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const [standingsRes, teamStatsRes] = await Promise.all([
      supabase.from('standings').select('*').eq('season', season).eq('conference', conference).order('position'),
      supabase.from('team_season_stats').select('team, xg_for, xg_against, goals_added, xpass').eq('season', season),
    ]);
    const standings = standingsRes.data || [];
    const statsMap = new Map((teamStatsRes.data || []).map((t) => [t.team, t]));
    return standings.map((s) => {
      const ts = statsMap.get(s.team);
      const xgFor = ts ? Number(ts.xg_for) : null;
      const xgAgainst = ts ? Number(ts.xg_against) : null;
      const xgDiff = xgFor != null && xgAgainst != null ? +(xgFor - xgAgainst).toFixed(1) : null;
      return { ...s, xg_for: xgFor, xg_against: xgAgainst, xg_diff: xgDiff, goals_added: ts ? Number(ts.goals_added) : null };
    });
  }, []);
}

export async function getStandingsHistory(season = 2025, conference = 'Eastern') {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('standings_history').select('*').eq('season', season).eq('conference', conference).order('week', { ascending: true });
    return data || [];
  }, []);
}

export async function getLeagueXgScatter(season = 2025) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('team_season_stats').select('team, xg_for, xg_against, goals_added, points, games_played').eq('season', season);
    return (data || []).map((t) => ({ team: t.team, xgFor: Number(t.xg_for), xgAgainst: Number(t.xg_against), goalsAdded: Number(t.goals_added), points: t.points, gamesPlayed: t.games_played }));
  }, []);
}

export async function getTopScorers(season = 2025, limit = 20) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('player_stats').select('name, team, goals, assists, xg, minutes, games_played').eq('season', season).order('goals', { ascending: false }).limit(limit);
    return data || [];
  }, []);
}

// ── Historical ──────────────────────────────────────────────────

export async function getMultiSeasonTeamStats(startSeason = 2016, endSeason = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('team_season_stats').select('*').eq('team', NYRB).gte('season', startSeason).lte('season', endSeason).order('season', { ascending: true });
    return data || [];
  }, []);
}

export async function getAllTimePlayerContributions() {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('player_season_history').select('player_name, season, goals, assists, xg, goals_added, minutes, games_played').eq('team', NYRB).order('goals_added', { ascending: false });
    return data || [];
  }, []);
}

export async function getHistoricalFormGrid() {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('team_match_advanced').select('season, match_date, result').eq('team', NYRB).order('season', { ascending: true }).order('match_date', { ascending: true });
    return data || [];
  }, []);
}

export async function getSeasonsList() {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase.from('team_season_stats').select('season').eq('team', NYRB).order('season', { ascending: false });
    return (data || []).map((d) => d.season);
  }, []);
}
