import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type { Database };
export type { Tables, InsertTables, UpdateTables } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseKey);

/**
 * Untyped client for existing query functions (avoids `never` inference
 * issues with supabase-js v2's PostgREST generic chain).
 *
 * For type-safe queries in new code, import `typedSupabase` instead
 * or use the `Tables<'tableName'>` helper from `@/types/database`.
 */
export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : (null as unknown as SupabaseClient);

/**
 * Typed client — use for new queries where you want full
 * type inference on `.from('table').select('*')` chains.
 * May produce `never` when chaining multiple `.eq()` filters
 * with column subsets; fall back to `supabase` + explicit
 * `Tables<'...'>` type assertions in those cases.
 */
export const typedSupabase = isConfigured
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : (null as unknown as ReturnType<typeof createClient<Database>>);

const RBNY_TEAM_ID = 383;

const EMPTY_METRICS = {
  xgPerMatch: 0, points: 0, goalDifference: 0, ppda: 0,
  goalsScored: 0, assists: 0, shotsPer90: 0, bigChances: 0,
  goalsConceded: 0, cleanSheets: 0, tacklesWon: 0, interceptionsPer90: 0,
};

export async function getLatestMatch() {
  if (!isConfigured) return null;
  try {
    const { data } = await supabase
      .from('sm_fixtures')
      .select('*')
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: false })
      .limit(1)
      .single();
    if (!data) return null;

    // Fetch fixture stats for xG, possession, shots
    const { data: fStats } = await supabase
      .from('sm_fixture_stats')
      .select('team_id, stat_code, value')
      .eq('fixture_id', data.id)
      .in('stat_code', ['expected-goals', 'ball-possession', 'shots-total', 'shots-on-target']);

    const statMap: Record<string, Record<string, number>> = {};
    for (const s of fStats || []) {
      const side = s.team_id === data.home_team_id ? 'home' : 'away';
      if (!statMap[s.stat_code]) statMap[s.stat_code] = { home: 0, away: 0 };
      statMap[s.stat_code][side] = Number(s.value) || 0;
    }

    const xg = statMap['expected-goals'] || { home: 0, away: 0 };
    const possession = statMap['ball-possession'] || { home: 50, away: 50 };
    const shots = statMap['shots-total'] || { home: 0, away: 0 };

    return {
      id: String(data.id),
      date: data.starting_at,
      home_team: data.home_team_name,
      away_team: data.away_team_name,
      home_score: data.home_score,
      away_score: data.away_score,
      home_xg: xg.home,
      away_xg: xg.away,
      status: 'finished',
      venue: null,
      stats: { possession, shots },
    };
  } catch (err) {
    console.error('[getLatestMatch]', err);
    return null;
  }
}

export async function getStandings(_conference = 'Eastern') {
  if (!isConfigured) return [];
  try {
    // Get current season
    const { data: season } = await supabase
      .from('sm_seasons')
      .select('id')
      .eq('league_id', 779)
      .eq('is_current', true)
      .single();
    if (!season) return [];

    const { data } = await supabase
      .from('sm_standings')
      .select('*')
      .eq('season_id', season.id)
      .order('position', { ascending: true });

    if (!data?.length) return [];

    // If standings have zeros for games_played, compute from fixtures
    const needsCompute = data.every((s) => !s.games_played);
    let computedMap: Map<number, { w: number; d: number; l: number; gf: number; ga: number; form: string[] }> | null = null;

    if (needsCompute) {
      const { data: fixtures } = await supabase
        .from('sm_fixtures')
        .select('home_team_id, away_team_id, home_score, away_score')
        .eq('season_id', season.id)
        .eq('state', 'FT');

      computedMap = new Map();
      for (const f of fixtures || []) {
        const hs = f.home_score ?? 0;
        const as = f.away_score ?? 0;
        for (const tid of [f.home_team_id, f.away_team_id]) {
          if (!computedMap.has(tid)) computedMap.set(tid, { w: 0, d: 0, l: 0, gf: 0, ga: 0, form: [] });
          const t = computedMap.get(tid)!;
          const isHome = tid === f.home_team_id;
          const gf = isHome ? hs : as;
          const ga = isHome ? as : hs;
          t.gf += gf;
          t.ga += ga;
          const r = gf > ga ? 'W' : gf === ga ? 'D' : 'L';
          if (r === 'W') t.w++; else if (r === 'D') t.d++; else t.l++;
          t.form.push(r);
        }
      }
    }

    return data.map((s) => {
      const c = computedMap?.get(s.team_id);
      const gp = c ? c.w + c.d + c.l : s.games_played;
      return {
        id: `${s.season_id}-${s.team_id}`,
        team: s.team_name,
        team_id: String(s.team_id),
        position: s.position,
        points: s.points,
        wins: c?.w ?? s.won,
        draws: c?.d ?? s.drawn,
        losses: c?.l ?? s.lost,
        goals_for: c?.gf ?? s.goals_for,
        goals_against: c?.ga ?? s.goals_against,
        goal_difference: c ? c.gf - c.ga : s.goal_difference,
        games_played: gp,
        form: c ? c.form.slice(-5) as ('W' | 'D' | 'L')[] : (s.form ? s.form.split('') : []),
        conference: s.conference,
        logo_url: null,
      };
    });
  } catch (err) {
    console.error('[getStandings]', err);
    return [];
  }
}

export async function getNextScheduledMatch() {
  if (!isConfigured) return null;
  try {
    const { data } = await supabase
      .from('sm_fixtures')
      .select('*')
      .eq('state', 'NS')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .gte('starting_at', new Date().toISOString())
      .order('starting_at', { ascending: true })
      .limit(1)
      .single();
    if (!data) return null;
    return {
      id: String(data.id),
      date: data.starting_at,
      home_team: data.home_team_name,
      away_team: data.away_team_name,
      home_score: null,
      away_score: null,
      status: 'scheduled',
      venue: null,
    };
  } catch {
    return null;
  }
}

export async function getPlayerStats(_team = 'New York Red Bulls') {
  if (!isConfigured) return [];
  const { data } = await supabase
    .from('sm_players')
    .select('*')
    .eq('team_id', RBNY_TEAM_ID);
  return (data || []).map((p) => ({
    id: String(p.id),
    name: p.common_name || p.name,
    team: 'New York RB',
    position: p.position,
    goals: 0,
    assists: 0,
    goals_added: null,
  }));
}

export async function getRecentMatches(limit = 5) {
  if (!isConfigured) return [];
  const { data } = await supabase
    .from('sm_fixtures')
    .select('*')
    .eq('state', 'FT')
    .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
    .order('starting_at', { ascending: false })
    .limit(limit);
  return (data || []).map((f) => ({
    id: String(f.id),
    date: f.starting_at,
    home_team: f.home_team_name,
    away_team: f.away_team_name,
    home_score: f.home_score,
    away_score: f.away_score,
    status: 'finished',
  }));
}

export async function getTeamSeasonMetrics(_team = 'New York Red Bulls') {
  if (!isConfigured) return EMPTY_METRICS;

  try {
    // Get current season
    const { data: season } = await supabase
      .from('sm_seasons')
      .select('id')
      .eq('league_id', 779)
      .eq('is_current', true)
      .single();

    if (!season) return EMPTY_METRICS;

    // Get RBNY standing
    const { data: standing } = await supabase
      .from('sm_standings')
      .select('*')
      .eq('season_id', season.id)
      .eq('team_id', RBNY_TEAM_ID)
      .single();

    // Get RBNY finished fixtures this season
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, home_team_id, away_team_id, home_score, away_score')
      .eq('season_id', season.id)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

    const matches = fixtures || [];
    const matchCount = matches.length || 1;

    let goalsScored = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;

    for (const m of matches) {
      const isHome = m.home_team_id === RBNY_TEAM_ID;
      const scored = (isHome ? m.home_score : m.away_score) ?? 0;
      const conceded = (isHome ? m.away_score : m.home_score) ?? 0;
      goalsScored += scored;
      goalsConceded += conceded;
      if (conceded === 0) cleanSheets++;
    }

    // Get aggregate stats from sm_fixture_stats
    const fixtureIds = matches.map((m) => m.id);
    let totalShots = 0;
    let totalTackles = 0;
    let totalInterceptions = 0;
    let bigChances = 0;

    if (fixtureIds.length > 0) {
      const { data: stats } = await supabase
        .from('sm_fixture_stats')
        .select('stat_code, value')
        .in('fixture_id', fixtureIds)
        .eq('team_id', RBNY_TEAM_ID);

      for (const s of stats || []) {
        if (s.stat_code === 'shots-total') totalShots += Number(s.value) || 0;
        if (s.stat_code === 'tackles') totalTackles += Number(s.value) || 0;
        if (s.stat_code === 'interceptions') totalInterceptions += Number(s.value) || 0;
        if (s.stat_code === 'big-chances-created') bigChances += Number(s.value) || 0;
      }
    }

    return {
      xgPerMatch: 0,
      points: standing?.points ?? 0,
      goalDifference: standing?.goal_difference ?? 0,
      ppda: 0,
      goalsScored,
      assists: 0,
      shotsPer90: +(totalShots / matchCount).toFixed(1),
      bigChances,
      goalsConceded,
      cleanSheets,
      tacklesWon: totalTackles,
      interceptionsPer90: +(totalInterceptions / matchCount).toFixed(1),
    };
  } catch (err) {
    console.error('[getTeamSeasonMetrics]', err);
    return EMPTY_METRICS;
  }
}
