import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : (null as unknown as SupabaseClient);

const EMPTY_METRICS = {
  xgPerMatch: 0, points: 0, goalDifference: 0, ppda: 0,
  goalsScored: 0, assists: 0, shotsPer90: 0, bigChances: 0,
  goalsConceded: 0, cleanSheets: 0, tacklesWon: 0, interceptionsPer90: 0,
};

export async function getLatestMatch() {
  if (!isConfigured) return null;
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function getStandings(conference = 'Eastern') {
  if (!isConfigured) return [];
  const { data } = await supabase
    .from('standings')
    .select('*')
    .eq('conference', conference)
    .order('position', { ascending: true });
  return data || [];
}

export async function getPlayerStats(team = 'New York Red Bulls') {
  if (!isConfigured) return [];
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('team', team)
    .order('goals_added', { ascending: false });
  return data || [];
}

export async function getRecentMatches(limit = 5) {
  if (!isConfigured) return [];
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getTeamSeasonMetrics(team = 'New York Red Bulls') {
  if (!isConfigured) return EMPTY_METRICS;

  const [matchesRes, standingsRes, playersRes] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .or(`home_team.eq.${team},away_team.eq.${team}`)
      .eq('status', 'finished')
      .order('date', { ascending: false }),
    supabase
      .from('standings')
      .select('*')
      .ilike('team', `%${team.split(' ').pop()}%`)
      .limit(1)
      .single(),
    supabase
      .from('player_stats')
      .select('*')
      .eq('team', team),
  ]);

  const matches = matchesRes.data || [];
  const standing = standingsRes.data;
  const players = playersRes.data || [];
  const matchCount = matches.length || 1;

  // Aggregate from matches
  let totalXg = 0;
  let goalsScored = 0;
  let goalsConceded = 0;
  let cleanSheets = 0;
  let totalShots = 0;
  let totalPpda = 0;

  for (const m of matches) {
    const isHome = m.home_team === team;
    totalXg += Number(isHome ? m.home_xg : m.away_xg) || 0;
    const scored = isHome ? m.home_score : m.away_score;
    const conceded = isHome ? m.away_score : m.home_score;
    goalsScored += scored ?? 0;
    goalsConceded += conceded ?? 0;
    if ((conceded ?? 0) === 0) cleanSheets++;

    const stats = m.stats as Record<string, Record<string, number>> | null;
    if (stats?.shots) {
      totalShots += isHome ? (stats.shots.home ?? 0) : (stats.shots.away ?? 0);
    }
    if (stats?.ppda) {
      totalPpda += isHome ? (stats.ppda.home ?? 0) : (stats.ppda.away ?? 0);
    }
  }

  // Aggregate from players
  let totalAssists = 0;
  let totalTacklesWon = 0;
  let totalInterceptions = 0;

  for (const p of players) {
    totalAssists += p.assists ?? 0;
    totalTacklesWon += p.tackles_won ?? 0;
    totalInterceptions += p.interceptions ?? 0;
  }

  return {
    xgPerMatch: +(totalXg / matchCount).toFixed(2),
    points: standing?.points ?? 0,
    goalDifference: standing?.goal_difference ?? 0,
    ppda: totalPpda > 0 ? +(totalPpda / matchCount).toFixed(1) : 0,
    goalsScored,
    assists: totalAssists,
    shotsPer90: +(totalShots / matchCount).toFixed(1),
    bigChances: 0, // Not in current schema
    goalsConceded,
    cleanSheets,
    tacklesWon: totalTacklesWon,
    interceptionsPer90: +(totalInterceptions / (matchCount)).toFixed(1),
  };
}
