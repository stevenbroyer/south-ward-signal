/**
 * Data Room — Supabase Query Functions (SportMonks tables)
 * Central query layer for all data room pages.
 */

import { supabase } from './supabase';

const isConfigured = !!supabase;
const RBNY_TEAM_ID = 383;

// MLS season IDs from SportMonks (populated by sync)
// We look up by year → sm_seasons table

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Get SportMonks season ID for a given year */
async function getSeasonId(year: number): Promise<number | null> {
  const { data } = await supabase
    .from('sm_seasons')
    .select('id')
    .eq('year', year)
    .eq('league_id', 779)
    .single();
  return data?.id || null;
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

const EMPTY_OVERVIEW: OverviewMetrics = {
  points: 0, ppg: 0, xgDiff: 0, goalsAdded: 0, form: [],
  confRank: 0, gamesPlayed: 0, goalsFor: 0, goalsAgainst: 0, xgFor: 0, xgAgainst: 0,
};

export async function getOverviewMetrics(season = 2026): Promise<OverviewMetrics> {
  if (!isConfigured) return EMPTY_OVERVIEW;
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return EMPTY_OVERVIEW;

    // Get standings for RBNY
    const { data: standing } = await supabase
      .from('sm_standings')
      .select('*')
      .eq('season_id', seasonId)
      .eq('team_id', RBNY_TEAM_ID)
      .single();

    // Get RBNY fixtures for the season to compute form
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, home_team_id, away_team_id, home_score, away_score, state')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: false })
      .limit(10);

    const form = (fixtures || []).map((f) => {
      const isHome = f.home_team_id === RBNY_TEAM_ID;
      const gf = isHome ? f.home_score : f.away_score;
      const ga = isHome ? f.away_score : f.home_score;
      if ((gf ?? 0) > (ga ?? 0)) return 'W';
      if ((gf ?? 0) === (ga ?? 0)) return 'D';
      return 'L';
    }).reverse();

    // Aggregate xG across all RBNY fixtures this season
    const allFixtureIds = (fixtures || []).map((f) => f.id);
    // Get all finished RBNY fixture IDs for xG aggregation (not just last 10)
    const { data: allFixtures } = await supabase
      .from('sm_fixtures')
      .select('id, home_team_id')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

    let xgFor = 0;
    let xgAgainst = 0;
    if (allFixtures?.length) {
      const fIds = allFixtures.map((f) => f.id);
      const { data: xgStats } = await supabase
        .from('sm_fixture_stats')
        .select('fixture_id, team_id, stat_code, value')
        .in('fixture_id', fIds)
        .in('stat_code', ['expected-goals', 'expected-goals-against']);

      for (const s of xgStats || []) {
        const fixture = allFixtures.find((f) => f.id === s.fixture_id);
        const isRbny = s.team_id === RBNY_TEAM_ID;
        if (s.stat_code === 'expected-goals' && isRbny) xgFor += Number(s.value) || 0;
        if (s.stat_code === 'expected-goals' && !isRbny) xgAgainst += Number(s.value) || 0;
      }
    }

    const pts = standing?.points ?? 0;
    // Use fixture count when standings games_played is 0
    const gp = standing?.games_played || (allFixtures?.length ?? 0);

    // Compute goals from fixtures when standings has zeros
    let goalsFor = standing?.goals_for ?? 0;
    let goalsAgainst = standing?.goals_against ?? 0;
    if (!goalsFor && !goalsAgainst && allFixtures?.length) {
      const allFull = await supabase
        .from('sm_fixtures')
        .select('home_team_id, home_score, away_score')
        .eq('season_id', seasonId)
        .eq('state', 'FT')
        .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);
      for (const f of allFull.data || []) {
        const isHome = f.home_team_id === RBNY_TEAM_ID;
        goalsFor += (isHome ? f.home_score : f.away_score) ?? 0;
        goalsAgainst += (isHome ? f.away_score : f.home_score) ?? 0;
      }
    }

    return {
      points: pts,
      ppg: gp > 0 ? +(pts / gp).toFixed(2) : 0,
      xgDiff: +(xgFor - xgAgainst).toFixed(1),
      goalsAdded: 0,
      form,
      confRank: standing?.position ?? 0,
      gamesPlayed: gp,
      goalsFor,
      goalsAgainst,
      xgFor: +xgFor.toFixed(1),
      xgAgainst: +xgAgainst.toFixed(1),
    };
  }, EMPTY_OVERVIEW);
}

export async function getSeasonXgRace(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    // Get all RBNY fixtures in order
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, starting_at, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: true });

    if (!fixtures?.length) return [];

    // Get xG stats for all fixtures
    const fixtureIds = fixtures.map((f) => f.id);
    const { data: xgStats } = await supabase
      .from('sm_fixture_stats')
      .select('fixture_id, team_id, stat_code, value')
      .in('fixture_id', fixtureIds)
      .eq('stat_code', 'expected-goals');

    const xgMap = new Map<number, { for: number; against: number }>();
    for (const s of xgStats || []) {
      if (!xgMap.has(s.fixture_id)) xgMap.set(s.fixture_id, { for: 0, against: 0 });
      const entry = xgMap.get(s.fixture_id)!;
      if (s.team_id === RBNY_TEAM_ID) entry.for = Number(s.value) || 0;
      else entry.against = Number(s.value) || 0;
    }

    let cumXgFor = 0;
    let cumXgAgainst = 0;

    return fixtures.map((f, i) => {
      const isHome = f.home_team_id === RBNY_TEAM_ID;
      const gf = (isHome ? f.home_score : f.away_score) ?? 0;
      const ga = (isHome ? f.away_score : f.home_score) ?? 0;
      const xg = xgMap.get(f.id);
      // Use xG if available, fall back to actual goals
      cumXgFor += xg ? xg.for : gf;
      cumXgAgainst += xg ? xg.against : ga;

      const opponent = isHome ? f.away_team_name : f.home_team_name;
      const result = gf > ga ? 'W' : gf === ga ? 'D' : 'L';

      return {
        matchweek: i + 1,
        date: f.starting_at,
        xgFor: +cumXgFor.toFixed(2),
        xgAgainst: +cumXgAgainst.toFixed(2),
        opponent,
        result,
      };
    });
  }, []);
}

export async function getFormStreak(season = 2026, limit = 10) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    const { data } = await supabase
      .from('sm_fixtures')
      .select('id, starting_at, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: false })
      .limit(limit);

    return (data || []).reverse().map((f) => {
      const isHome = f.home_team_id === RBNY_TEAM_ID;
      const gf = (isHome ? f.home_score : f.away_score) ?? 0;
      const ga = (isHome ? f.away_score : f.home_score) ?? 0;
      return {
        match_id: String(f.id),
        match_date: f.starting_at,
        opponent: isHome ? f.away_team_name : f.home_team_name,
        is_home: isHome,
        result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
        goals_for: gf,
        goals_against: ga,
      };
    });
  }, []);
}

export async function getPointsTrajectory(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    const { data } = await supabase
      .from('sm_fixtures')
      .select('id, starting_at, home_team_id, away_team_id, home_score, away_score')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: true });

    if (!data) return [];
    let cumPoints = 0;
    return data.map((f, i) => {
      const isHome = f.home_team_id === RBNY_TEAM_ID;
      const gf = (isHome ? f.home_score : f.away_score) ?? 0;
      const ga = (isHome ? f.away_score : f.home_score) ?? 0;
      const result = gf > ga ? 'W' : gf === ga ? 'D' : 'L';
      cumPoints += result === 'W' ? 3 : result === 'D' ? 1 : 0;
      const mw = i + 1;
      return {
        matchweek: mw,
        points: cumPoints,
        playoffPace: +(mw * 1.5).toFixed(1),
        shieldPace: +(mw * 2.0).toFixed(1),
      };
    });
  }, []);
}

export async function getTopPerformers(season = 2026, limit = 3) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    // Get goal scorers from events
    const { data: goals } = await supabase
      .from('sm_events')
      .select('player_name, player_id, fixture_id, sm_fixtures!inner(season_id)')
      .eq('event_type', 'goal')
      .eq('sm_fixtures.season_id', seasonId);

    // Get all RBNY finished fixture IDs this season
    const { data: seasonFixtures } = await supabase
      .from('sm_fixtures')
      .select('id')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

    const fIds = (seasonFixtures || []).map((f) => f.id);
    if (!fIds.length) return [];

    // Count goals per player
    const goalCounts = new Map<string, { name: string; goals: number; playerId: number }>();
    for (const g of goals || []) {
      const key = g.player_name || 'Unknown';
      const existing = goalCounts.get(key) || { name: key, goals: 0, playerId: g.player_id };
      existing.goals++;
      goalCounts.set(key, existing);
    }

    // Get assists from lineup_stats
    const { data: assistStats } = await supabase
      .from('sm_lineup_stats')
      .select('player_id, value')
      .in('fixture_id', fIds)
      .eq('team_id', RBNY_TEAM_ID)
      .eq('stat_code', 'assists');

    const assistMap = new Map<number, number>();
    for (const a of assistStats || []) {
      assistMap.set(a.player_id, (assistMap.get(a.player_id) || 0) + (Number(a.value) || 0));
    }

    // Get minutes from lineup_stats
    const { data: minuteStats } = await supabase
      .from('sm_lineup_stats')
      .select('player_id, value')
      .in('fixture_id', fIds)
      .eq('team_id', RBNY_TEAM_ID)
      .eq('stat_code', 'minutes-played');

    const minuteMap = new Map<number, number>();
    for (const m of minuteStats || []) {
      minuteMap.set(m.player_id, (minuteMap.get(m.player_id) || 0) + (Number(m.value) || 0));
    }

    // Get appearances
    const { data: appearances } = await supabase
      .from('sm_lineups')
      .select('player_id')
      .in('fixture_id', fIds)
      .eq('team_id', RBNY_TEAM_ID);

    const appMap = new Map<number, number>();
    for (const a of appearances || []) {
      appMap.set(a.player_id, (appMap.get(a.player_id) || 0) + 1);
    }

    // Get player info
    const { data: playerInfo } = await supabase
      .from('sm_players')
      .select('id, common_name, name, position, image_path')
      .eq('team_id', RBNY_TEAM_ID);

    const playerMap = new Map((playerInfo || []).map((p) => [p.id, p]));

    // Build combined score: goals + assists (weighted)
    const allPlayerIds = new Set([
      ...Array.from(goalCounts.values()).map((g) => g.playerId),
      ...Array.from(assistMap.keys()),
    ]);

    const ranked = Array.from(allPlayerIds).map((pid) => {
      const player = playerMap.get(pid);
      const name = player?.common_name || player?.name || Array.from(goalCounts.values()).find((g) => g.playerId === pid)?.name || 'Unknown';
      const g = Array.from(goalCounts.values()).find((gc) => gc.playerId === pid)?.goals || 0;
      const a = assistMap.get(pid) || 0;
      return {
        name,
        position: player?.position || null,
        goals: g,
        assists: a,
        xg: 0,
        goals_added: 0,
        minutes: minuteMap.get(pid) || 0,
        games_played: appMap.get(pid) || 0,
        image_url: player?.image_path || null,
        _score: g * 2 + a, // Weight goals higher for ranking
      };
    });

    return ranked
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...p }) => p);
  }, []);
}

// ── Matches ─────────────────────────────────────────────────────

export async function getMatchList(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    const { data } = await supabase
      .from('sm_fixtures')
      .select('*')
      .eq('season_id', seasonId)
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: false });

    // Get xG for all fixtures
    const fixtureIds = (data || []).map((f) => f.id);
    const { data: xgStats } = await supabase
      .from('sm_fixture_stats')
      .select('fixture_id, team_id, stat_code, value')
      .in('fixture_id', fixtureIds)
      .eq('stat_code', 'expected-goals');

    const xgMap = new Map<string, number>();
    for (const s of xgStats || []) {
      xgMap.set(`${s.fixture_id}-${s.team_id}`, Number(s.value) || 0);
    }

    return (data || []).map((f) => ({
      id: String(f.id),
      date: f.starting_at,
      home_team: f.home_team_name,
      away_team: f.away_team_name,
      home_score: f.home_score,
      away_score: f.away_score,
      home_xg: xgMap.get(`${f.id}-${f.home_team_id}`) || 0,
      away_xg: xgMap.get(`${f.id}-${f.away_team_id}`) || 0,
      status: f.state === 'FT' ? 'finished' : f.state === 'LIVE' ? 'live' : 'scheduled',
      venue: null,
      competition: 'MLS',
      season,
      stats: {},
    }));
  }, []);
}

export async function getMatchDetail(matchId: string) {
  if (!isConfigured) return null;
  return safeQuery(async () => {
    const fixtureId = Number(matchId);
    if (isNaN(fixtureId)) return null;

    const { data: fixture } = await supabase
      .from('sm_fixtures')
      .select('*')
      .eq('id', fixtureId)
      .single();

    if (!fixture) return null;

    // Get stats for this fixture
    const { data: stats } = await supabase
      .from('sm_fixture_stats')
      .select('team_id, stat_code, value')
      .eq('fixture_id', fixtureId);

    // Build stats object keyed by stat_code with home/away values
    const statsObj: Record<string, Record<string, number>> = {};
    for (const s of stats || []) {
      const side = s.team_id === fixture.home_team_id ? 'home' : 'away';
      if (!statsObj[s.stat_code]) statsObj[s.stat_code] = { home: 0, away: 0 };
      statsObj[s.stat_code][side] = Number(s.value) || 0;
    }

    // Get events
    const { data: events } = await supabase
      .from('sm_events')
      .select('*')
      .eq('fixture_id', fixtureId)
      .order('minute', { ascending: true });

    const xg = statsObj['expected-goals'] || { home: 0, away: 0 };

    return {
      id: String(fixture.id),
      date: fixture.starting_at,
      home_team: fixture.home_team_name,
      away_team: fixture.away_team_name,
      home_score: fixture.home_score,
      away_score: fixture.away_score,
      home_xg: xg.home,
      away_xg: xg.away,
      status: fixture.state === 'FT' ? 'finished' : fixture.state === 'LIVE' ? 'live' : 'scheduled',
      venue: null,
      competition: 'MLS',
      stats: {
        possession: statsObj['ball-possession'] || { home: 50, away: 50 },
        shots: statsObj['shots-total'] || { home: 0, away: 0 },
        shots_on_target: statsObj['shots-on-target'] || { home: 0, away: 0 },
        xg: statsObj['expected-goals'] || { home: 0, away: 0 },
        xgot: statsObj['expected-goals-on-target'] || { home: 0, away: 0 },
        npxg: statsObj['expected-non-penalty-goals'] || { home: 0, away: 0 },
        corners: statsObj['corners'] || { home: 0, away: 0 },
        fouls: statsObj['fouls'] || { home: 0, away: 0 },
        offsides: statsObj['offsides'] || { home: 0, away: 0 },
        passing_accuracy: statsObj['successful-passes-percentage'] || { home: 0, away: 0 },
        passes: statsObj['passes'] || { home: 0, away: 0 },
        tackles: statsObj['tackles'] || { home: 0, away: 0 },
        interceptions: statsObj['interceptions'] || { home: 0, away: 0 },
        duels_won: statsObj['duels-won'] || { home: 0, away: 0 },
        dribbles: statsObj['successful-dribbles'] || { home: 0, away: 0 },
        key_passes: statsObj['key-passes'] || { home: 0, away: 0 },
        big_chances: statsObj['big-chances-created'] || { home: 0, away: 0 },
        big_chances_missed: statsObj['big-chances-missed'] || { home: 0, away: 0 },
        crosses: statsObj['total-crosses'] || { home: 0, away: 0 },
        long_balls: statsObj['successful-long-passes'] || { home: 0, away: 0 },
        attacks: statsObj['attacks'] || { home: 0, away: 0 },
        dangerous_attacks: statsObj['dangerous-attacks'] || { home: 0, away: 0 },
      },
      events: (events || []).map((e) => ({
        type: e.event_type,
        minute: e.minute,
        player: e.player_name,
        relatedPlayer: e.related_player,
        team: e.team_id === fixture.home_team_id ? fixture.home_team_name : fixture.away_team_name,
      })),
      fotmob_id: null,
      momentum: [],
    };
  }, null);
}

export async function getMatchShots(_matchId: string) {
  // Shot-level data requires xG Advanced add-on — return empty for now
  return [];
}

export async function getMatchXgFlow(_matchId: string) {
  return [];
}

export async function getMatchPlayerStats(matchId: string) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const fixtureId = Number(matchId);
    if (isNaN(fixtureId)) return [];

    const { data: lineups } = await supabase
      .from('sm_lineups')
      .select('*')
      .eq('fixture_id', fixtureId)
      .order('is_starter', { ascending: false });

    // Get per-player stats for this fixture
    const { data: playerStats } = await supabase
      .from('sm_lineup_stats')
      .select('player_id, stat_code, value')
      .eq('fixture_id', fixtureId);

    const statsMap = new Map<number, Record<string, number>>();
    for (const s of playerStats || []) {
      if (!statsMap.has(s.player_id)) statsMap.set(s.player_id, {});
      statsMap.get(s.player_id)![s.stat_code] = Number(s.value) || 0;
    }

    // Get fixture to determine team names
    const { data: fixtureInfo } = await supabase
      .from('sm_fixtures')
      .select('home_team_id, away_team_id, home_team_name, away_team_name')
      .eq('id', fixtureId)
      .single();

    const teamNameMap = new Map<number, string>();
    if (fixtureInfo) {
      teamNameMap.set(fixtureInfo.home_team_id, fixtureInfo.home_team_name);
      teamNameMap.set(fixtureInfo.away_team_id, fixtureInfo.away_team_name);
    }

    return (lineups || []).map((lu) => {
      const ps = statsMap.get(lu.player_id) || {};
      return {
        player_name: lu.player_name,
        team: teamNameMap.get(lu.team_id) || null,
        position: lu.position,
        jersey_number: lu.jersey_number,
        is_starter: lu.is_starter,
        minutes: ps['minutes-played'] || (lu.is_starter ? 90 : 0),
        rating: ps['rating'] || null,
        goals: ps['goals'] || 0,
        assists: ps['assists'] || 0,
        shots: ps['shots-total'] || 0,
        shots_on_target: ps['shots-on-target'] || 0,
        key_passes: ps['key-passes'] || 0,
        passes: ps['passes'] || 0,
        accurate_passes_pct: ps['accurate-passes-pct'] || 0,
        tackles: ps['tackles'] || 0,
        interceptions: ps['interceptions'] || 0,
        duels_won: ps['duels-won'] || 0,
        dribbles: ps['successful-dribbles'] || 0,
        touches: ps['touches'] || 0,
        fotmob_rating: ps['rating'] ? +(ps['rating']).toFixed(1) : null,
      };
    });
  }, []);
}

// ── Players ─────────────────────────────────────────────────────

export async function getPlayerList(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    // Get RBNY players from sm_players
    const { data: players } = await supabase
      .from('sm_players')
      .select('*')
      .eq('team_id', RBNY_TEAM_ID);

    if (!players?.length) return [];

    const seasonId = await getSeasonId(season);

    // Get appearance counts from lineups for this season
    let appearanceMap = new Map<number, number>();
    let goalMap = new Map<string, number>();
    let assistMap = new Map<string, number>();

    if (seasonId) {
      // Get all RBNY fixture IDs for this season
      const { data: seasonFixtures } = await supabase
        .from('sm_fixtures')
        .select('id')
        .eq('season_id', seasonId)
        .eq('state', 'FT')
        .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

      const fixtureIds = (seasonFixtures || []).map((f) => f.id);

      if (fixtureIds.length > 0) {
        // Count appearances from lineups
        const { data: lineups } = await supabase
          .from('sm_lineups')
          .select('player_id, fixture_id')
          .in('fixture_id', fixtureIds)
          .eq('team_id', RBNY_TEAM_ID);

        for (const lu of lineups || []) {
          appearanceMap.set(lu.player_id, (appearanceMap.get(lu.player_id) || 0) + 1);
        }

        // Get aggregated player stats from lineup_stats
        const { data: pStats } = await supabase
          .from('sm_lineup_stats')
          .select('player_id, stat_code, value')
          .in('fixture_id', fixtureIds)
          .eq('team_id', RBNY_TEAM_ID);

        // Aggregate per player
        const playerAgg = new Map<number, Record<string, number>>();
        for (const s of pStats || []) {
          if (!playerAgg.has(s.player_id)) playerAgg.set(s.player_id, {});
          const agg = playerAgg.get(s.player_id)!;
          agg[s.stat_code] = (agg[s.stat_code] || 0) + (Number(s.value) || 0);
        }

        // Also get goals/assists from events for accuracy
        const { data: goals } = await supabase
          .from('sm_events')
          .select('player_name, player_id')
          .in('fixture_id', fixtureIds)
          .eq('event_type', 'goal');

        for (const g of goals || []) {
          const key = g.player_name || '';
          goalMap.set(key, (goalMap.get(key) || 0) + 1);
        }

        // Merge stats into maps
        for (const [pid, stats] of playerAgg) {
          const player = players.find((p) => p.id === pid);
          if (player) {
            const name = player.common_name || player.name;
            if (stats['assists']) assistMap.set(name, stats['assists']);
          }
        }

        // Store full stat aggregations for the return
        for (const p of players) {
          const agg = playerAgg.get(p.id);
          if (agg) {
            (p as any)._agg = agg;
          }
        }
      }
    }

    return players.map((p) => {
      const agg = (p as any)._agg || {};
      const name = p.common_name || p.name;
      return {
        id: String(p.id),
        name,
        team: 'New York RB',
        position: p.position || p.detailed_position || 'Unknown',
        season,
        games_played: appearanceMap.get(p.id) || 0,
        minutes: agg['minutes-played'] || (appearanceMap.get(p.id) || 0) * 90,
        goals: goalMap.get(name) || goalMap.get(p.name) || 0,
        assists: assistMap.get(name) || 0,
        xg: 0,
        xa: 0,
        goals_added: null,
        key_passes: agg['key-passes'] || null,
        tackles_won: agg['tackles-won'] || agg['tackles'] || null,
        interceptions: agg['interceptions'] || null,
        pass_completion: agg['accurate-passes-pct'] ? +(agg['accurate-passes-pct'] / (appearanceMap.get(p.id) || 1)).toFixed(0) : null,
        image_url: p.image_path,
      };
    });
  }, []);
}

export async function getPlayerDetail(playerName: string, _season = 2026) {
  if (!isConfigured) return null;
  return safeQuery(async () => {
    const { data } = await supabase
      .from('sm_players')
      .select('*')
      .eq('team_id', RBNY_TEAM_ID)
      .or(`common_name.eq.${playerName},name.ilike.%${playerName}%`)
      .single();

    if (!data) return null;

    // Get season stats from lineup_stats
    const seasonId = await getSeasonId(_season);
    let agg: Record<string, number> = {};
    let appearances = 0;
    let goals = 0;
    let assists = 0;

    if (seasonId) {
      const { data: seasonFixtures } = await supabase
        .from('sm_fixtures')
        .select('id')
        .eq('season_id', seasonId)
        .eq('state', 'FT')
        .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

      const fIds = (seasonFixtures || []).map((f) => f.id);
      if (fIds.length > 0) {
        // Appearances
        const { data: lineups } = await supabase
          .from('sm_lineups')
          .select('fixture_id')
          .in('fixture_id', fIds)
          .eq('player_id', data.id);
        appearances = lineups?.length || 0;

        // Aggregate stats
        const { data: pStats } = await supabase
          .from('sm_lineup_stats')
          .select('stat_code, value')
          .in('fixture_id', fIds)
          .eq('player_id', data.id);

        for (const s of pStats || []) {
          agg[s.stat_code] = (agg[s.stat_code] || 0) + (Number(s.value) || 0);
        }

        // Goals/assists from events
        const { data: goalEvents } = await supabase
          .from('sm_events')
          .select('event_type')
          .in('fixture_id', fIds)
          .eq('player_id', data.id)
          .in('event_type', ['goal', 'pen-shootout-goal']);
        goals = goalEvents?.length || 0;
      }
    }

    return {
      id: String(data.id),
      name: data.common_name || data.name,
      team: 'New York RB',
      position: data.position || data.detailed_position || 'Unknown',
      season: _season,
      games_played: appearances,
      minutes: agg['minutes-played'] || 0,
      goals,
      assists: agg['assists'] || 0,
      xg: 0,
      xa: 0,
      goals_added: null,
      key_passes: agg['key-passes'] || null,
      tackles_won: agg['tackles-won'] || agg['tackles'] || null,
      interceptions: agg['interceptions'] || null,
      pass_completion: appearances > 0 && agg['accurate-passes-pct'] ? +(agg['accurate-passes-pct'] / appearances).toFixed(0) : null,
      aerial_duels_won: agg['aerials-won'] || null,
      progressive_passes: agg['passes-in-final-third'] || null,
      progressive_carries: null,
      shot_creating_actions: agg['chances-created'] || null,
      goal_creating_actions: agg['big-chances-created'] || null,
      image_url: data.image_path,
    };
  }, null);
}

export async function getPlayerMatchLog(playerName: string, _season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    // Find player's fixture appearances via lineups
    const { data } = await supabase
      .from('sm_lineups')
      .select('fixture_id, player_id, player_name, is_starter, sm_fixtures(starting_at, home_team_name, away_team_name, home_score, away_score)')
      .ilike('player_name', `%${playerName}%`)
      .order('fixture_id', { ascending: true });

    if (!data?.length) return [];

    // Get per-match stats for this player
    const fixtureIds = data.map((lu) => lu.fixture_id);
    const playerId = data[0].player_id;

    const { data: pStats } = await supabase
      .from('sm_lineup_stats')
      .select('fixture_id, stat_code, value')
      .in('fixture_id', fixtureIds)
      .eq('player_id', playerId);

    const statsMap = new Map<number, Record<string, number>>();
    for (const s of pStats || []) {
      if (!statsMap.has(s.fixture_id)) statsMap.set(s.fixture_id, {});
      statsMap.get(s.fixture_id)![s.stat_code] = Number(s.value) || 0;
    }

    return data.map((lu: any) => {
      const ps = statsMap.get(lu.fixture_id) || {};
      return {
        fixture_id: lu.fixture_id,
        player_name: lu.player_name,
        is_starter: lu.is_starter,
        minutes: ps['minutes-played'] || (lu.is_starter ? 90 : 0),
        goals: ps['goals'] || 0,
        assists: ps['assists'] || 0,
        xg: 0,
        rating: ps['rating'] || null,
        key_passes: ps['key-passes'] || 0,
        tackles: ps['tackles'] || 0,
        interceptions: ps['interceptions'] || 0,
        touches: ps['touches'] || 0,
        matches: lu.sm_fixtures,
      };
    });
  }, []);
}

export async function getPlayerSeasonHistory(playerName: string) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    // Find the player
    const { data: player } = await supabase
      .from('sm_players')
      .select('id')
      .eq('team_id', RBNY_TEAM_ID)
      .or(`common_name.eq.${playerName},name.ilike.%${playerName}%`)
      .single();

    if (!player) return [];

    // Get all seasons we have data for
    const { data: seasons } = await supabase
      .from('sm_seasons')
      .select('id, year')
      .eq('league_id', 779)
      .order('year', { ascending: true });

    if (!seasons?.length) return [];

    const results: Array<{
      season: number; games_played: number; goals: number;
      assists: number; xg: number; goals_added: number | null;
      minutes: number;
    }> = [];

    for (const season of seasons) {
      // Get RBNY fixture IDs for this season
      const { data: seasonFixtures } = await supabase
        .from('sm_fixtures')
        .select('id')
        .eq('season_id', season.id)
        .eq('state', 'FT')
        .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

      const fIds = (seasonFixtures || []).map((f) => f.id);
      if (!fIds.length) continue;

      // Check if player appeared in any lineup this season
      const { data: lineups } = await supabase
        .from('sm_lineups')
        .select('fixture_id')
        .in('fixture_id', fIds)
        .eq('player_id', player.id);

      const apps = lineups?.length || 0;
      if (!apps) continue;

      // Aggregate stats
      const { data: pStats } = await supabase
        .from('sm_lineup_stats')
        .select('stat_code, value')
        .in('fixture_id', fIds)
        .eq('player_id', player.id);

      const agg: Record<string, number> = {};
      for (const s of pStats || []) {
        agg[s.stat_code] = (agg[s.stat_code] || 0) + (Number(s.value) || 0);
      }

      // Goals from events
      const { data: goalEvents } = await supabase
        .from('sm_events')
        .select('id')
        .in('fixture_id', fIds)
        .eq('player_id', player.id)
        .eq('event_type', 'goal');

      results.push({
        season: season.year,
        games_played: apps,
        goals: goalEvents?.length || 0,
        assists: agg['assists'] || 0,
        xg: 0,
        goals_added: null,
        minutes: agg['minutes-played'] || 0,
      });
    }

    return results;
  }, []);
}

export async function getPlayerGoalsAddedBreakdown(_playerName: string, _season = 2026) {
  // Goals Added is ASA-specific metric, not available from SportMonks
  return null;
}

export async function getPlayersForCompare(playerNames: string[], _season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    // Try matching by common_name first, then by name
    const { data } = await supabase
      .from('sm_players')
      .select('*')
      .eq('team_id', RBNY_TEAM_ID);

    const matched = (data || []).filter((p) =>
      playerNames.some((n) => (p.common_name || p.name) === n || p.name.includes(n))
    );

    if (!matched.length) return [];

    const seasonId = await getSeasonId(_season);
    if (!seasonId) return matched.map((p) => ({
      id: String(p.id), name: p.common_name || p.name, team: 'New York RB',
      position: p.position, goals: 0, assists: 0, xg: 0, xa: 0, minutes: 0,
      games_played: 0, key_passes: 0, pass_completion: 0,
    }));

    const { data: seasonFixtures } = await supabase
      .from('sm_fixtures')
      .select('id')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

    const fIds = (seasonFixtures || []).map((f) => f.id);
    if (!fIds.length) return matched.map((p) => ({
      id: String(p.id), name: p.common_name || p.name, team: 'New York RB',
      position: p.position, goals: 0, assists: 0, xg: 0, xa: 0, minutes: 0,
      games_played: 0, key_passes: 0, pass_completion: 0,
    }));

    const playerIds = matched.map((p) => p.id);

    // Get lineups for appearances
    const { data: lineups } = await supabase
      .from('sm_lineups')
      .select('player_id, fixture_id')
      .in('fixture_id', fIds)
      .in('player_id', playerIds);

    const appMap = new Map<number, number>();
    for (const lu of lineups || []) {
      appMap.set(lu.player_id, (appMap.get(lu.player_id) || 0) + 1);
    }

    // Get aggregated stats
    const { data: pStats } = await supabase
      .from('sm_lineup_stats')
      .select('player_id, stat_code, value')
      .in('fixture_id', fIds)
      .in('player_id', playerIds);

    const playerAgg = new Map<number, Record<string, number>>();
    for (const s of pStats || []) {
      if (!playerAgg.has(s.player_id)) playerAgg.set(s.player_id, {});
      const agg = playerAgg.get(s.player_id)!;
      agg[s.stat_code] = (agg[s.stat_code] || 0) + (Number(s.value) || 0);
    }

    // Get goals from events
    const { data: goals } = await supabase
      .from('sm_events')
      .select('player_id')
      .in('fixture_id', fIds)
      .in('player_id', playerIds)
      .eq('event_type', 'goal');

    const goalMap = new Map<number, number>();
    for (const g of goals || []) {
      goalMap.set(g.player_id, (goalMap.get(g.player_id) || 0) + 1);
    }

    return matched.map((p) => {
      const agg = playerAgg.get(p.id) || {};
      const apps = appMap.get(p.id) || 0;
      return {
        id: String(p.id),
        name: p.common_name || p.name,
        team: 'New York RB',
        position: p.position,
        goals: goalMap.get(p.id) || 0,
        assists: agg['assists'] || 0,
        xg: 0,
        xa: 0,
        minutes: agg['minutes-played'] || 0,
        games_played: apps,
        key_passes: agg['key-passes'] || 0,
        pass_completion: apps > 0 && agg['accurate-passes-pct'] ? +(agg['accurate-passes-pct'] / apps).toFixed(0) : 0,
      };
    });
  }, []);
}

// ── Team ────────────────────────────────────────────────────────

export async function getTeamMatchTrends(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('*')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: true });

    if (!fixtures?.length) return [];

    // For each fixture, get relevant stats
    const fixtureIds = fixtures.map((f) => f.id);
    const { data: allStats } = await supabase
      .from('sm_fixture_stats')
      .select('fixture_id, team_id, stat_code, value')
      .in('fixture_id', fixtureIds)
      .eq('team_id', RBNY_TEAM_ID);

    const statsMap = new Map<number, Record<string, number>>();
    for (const s of allStats || []) {
      if (!statsMap.has(s.fixture_id)) statsMap.set(s.fixture_id, {});
      statsMap.get(s.fixture_id)![s.stat_code] = Number(s.value) || 0;
    }

    // Get opponent xG (we need both teams' stats for xG against)
    const { data: oppXgStats } = await supabase
      .from('sm_fixture_stats')
      .select('fixture_id, team_id, value')
      .in('fixture_id', fixtureIds)
      .neq('team_id', RBNY_TEAM_ID)
      .eq('stat_code', 'expected-goals');

    const oppXgMap = new Map<number, number>();
    for (const s of oppXgStats || []) {
      oppXgMap.set(s.fixture_id, Number(s.value) || 0);
    }

    return fixtures.map((f) => {
      const isHome = f.home_team_id === RBNY_TEAM_ID;
      const gf = (isHome ? f.home_score : f.away_score) ?? 0;
      const ga = (isHome ? f.away_score : f.home_score) ?? 0;
      const stats = statsMap.get(f.id) || {};

      return {
        match_id: String(f.id),
        match_date: f.starting_at,
        opponent: isHome ? f.away_team_name : f.home_team_name,
        is_home: isHome,
        result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
        goals_for: gf,
        goals_against: ga,
        xg_for: stats['expected-goals'] || 0,
        xg_against: oppXgMap.get(f.id) || 0,
        clean_sheet: ga === 0,
        ppda: 0,
        possession: stats['ball-possession'] || 0,
        shots: stats['shots-total'] || 0,
        shots_on_target: stats['shots-on-target'] || 0,
      };
    });
  }, []);
}

export async function getHomeAwaySplit(season = 2026) {
  if (!isConfigured) return { home: null, away: null };
  return safeQuery(async () => {
    const trends = await getTeamMatchTrends(season);
    if (!trends.length) return { home: null, away: null };

    const aggregate = (matches: typeof trends) => {
      const count = matches.length || 1;
      return {
        games: matches.length,
        wins: matches.filter((m) => m.result === 'W').length,
        draws: matches.filter((m) => m.result === 'D').length,
        losses: matches.filter((m) => m.result === 'L').length,
        goalsFor: matches.reduce((s, m) => s + m.goals_for, 0),
        goalsAgainst: matches.reduce((s, m) => s + m.goals_against, 0),
        avgXgFor: +(matches.reduce((s, m) => s + m.xg_for, 0) / count).toFixed(2),
        avgXgAgainst: +(matches.reduce((s, m) => s + m.xg_against, 0) / count).toFixed(2),
        cleanSheets: matches.filter((m) => m.clean_sheet).length,
      };
    };

    return {
      home: aggregate(trends.filter((m) => m.is_home)),
      away: aggregate(trends.filter((m) => !m.is_home)),
    };
  }, { home: null, away: null });
}

export async function getShotZones(_season = 2026) {
  // Shot-level data requires xG Advanced — return empty for now
  return [];
}

// ── League ──────────────────────────────────────────────────────

export async function getEnhancedStandings(season = 2026, _conference = 'Eastern') {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    const { data } = await supabase
      .from('sm_standings')
      .select('*')
      .eq('season_id', seasonId)
      .order('position', { ascending: true });

    // Get xG for all teams
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, home_team_id, away_team_id, home_score, away_score')
      .eq('season_id', seasonId)
      .eq('state', 'FT');

    const fixtureIds = (fixtures || []).map((f) => f.id);
    let teamXg = new Map<number, { xgFor: number; xgAgainst: number }>();

    if (fixtureIds.length > 0) {
      const { data: xgStats } = await supabase
        .from('sm_fixture_stats')
        .select('fixture_id, team_id, value')
        .in('fixture_id', fixtureIds)
        .eq('stat_code', 'expected-goals');

      const fixtureTeams = new Map<number, { home: number; away: number }>();
      for (const f of fixtures || []) {
        fixtureTeams.set(f.id, { home: f.home_team_id, away: f.away_team_id });
      }

      for (const s of xgStats || []) {
        if (!teamXg.has(s.team_id)) teamXg.set(s.team_id, { xgFor: 0, xgAgainst: 0 });
        teamXg.get(s.team_id)!.xgFor += Number(s.value) || 0;
        // Also add to opponent's xgAgainst
        const ft = fixtureTeams.get(s.fixture_id);
        if (ft) {
          const oppId = s.team_id === ft.home ? ft.away : ft.home;
          if (!teamXg.has(oppId)) teamXg.set(oppId, { xgFor: 0, xgAgainst: 0 });
          teamXg.get(oppId)!.xgAgainst += Number(s.value) || 0;
        }
      }
    }

    // Get team logos
    const teamIds = (data || []).map((s) => s.team_id);
    const { data: teams } = await supabase
      .from('sm_teams')
      .select('id, logo_path')
      .in('id', teamIds);
    const logoMap = new Map((teams || []).map((t) => [t.id, t.logo_path]));

    // Compute W/D/L/GF/GA from fixtures when standings has zeros
    const needsCompute = (data || []).every((s) => !s.games_played);
    let computedMap: Map<number, { w: number; d: number; l: number; gf: number; ga: number; form: string[] }> | null = null;
    if (needsCompute && fixtures?.length) {
      computedMap = new Map();
      for (const f of fixtures) {
        const hs = f.home_score ?? 0;
        const as_ = f.away_score ?? 0;
        for (const tid of [f.home_team_id, f.away_team_id]) {
          if (!computedMap.has(tid)) computedMap.set(tid, { w: 0, d: 0, l: 0, gf: 0, ga: 0, form: [] });
          const t = computedMap.get(tid)!;
          const isHome = tid === f.home_team_id;
          const gf = isHome ? hs : as_;
          const ga = isHome ? as_ : hs;
          t.gf += gf;
          t.ga += ga;
          const r = gf > ga ? 'W' : gf === ga ? 'D' : 'L';
          if (r === 'W') t.w++; else if (r === 'D') t.d++; else t.l++;
          t.form.push(r);
        }
      }
    }

    return (data || []).map((s) => {
      const xg = teamXg.get(s.team_id);
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
        form: c ? c.form.slice(-5) : (s.form ? s.form.split('') : []),
        season,
        conference: s.conference,
        ppg: gp > 0 ? +(s.points / gp).toFixed(2) : 0,
        xg_for: xg ? +xg.xgFor.toFixed(1) : null,
        xg_against: xg ? +xg.xgAgainst.toFixed(1) : null,
        xg_diff: xg ? +(xg.xgFor - xg.xgAgainst).toFixed(1) : null,
        goals_added: null,
        logo_url: logoMap.get(s.team_id) || null,
      };
    });
  }, []);
}

export async function getStandingsHistory(season = 2026, _conference = 'Eastern') {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    // Get all finished fixtures for the season, ordered chronologically
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .order('starting_at', { ascending: true });

    if (!fixtures?.length) return [];

    // Build week-by-week standings from results
    const teamStats = new Map<number, { name: string; pts: number; gf: number; ga: number; gp: number }>();

    const result: Array<{ week: number; team: string; position: number; points: number }> = [];

    fixtures.forEach((f, i) => {
      // Update home team
      if (!teamStats.has(f.home_team_id)) {
        teamStats.set(f.home_team_id, { name: f.home_team_name, pts: 0, gf: 0, ga: 0, gp: 0 });
      }
      if (!teamStats.has(f.away_team_id)) {
        teamStats.set(f.away_team_id, { name: f.away_team_name, pts: 0, gf: 0, ga: 0, gp: 0 });
      }

      const home = teamStats.get(f.home_team_id)!;
      const away = teamStats.get(f.away_team_id)!;
      const hs = f.home_score ?? 0;
      const as_ = f.away_score ?? 0;

      home.gf += hs; home.ga += as_; home.gp++;
      away.gf += as_; away.ga += hs; away.gp++;

      if (hs > as_) { home.pts += 3; }
      else if (hs === as_) { home.pts += 1; away.pts += 1; }
      else { away.pts += 3; }

      // Every ~10 fixtures (roughly 1 matchweek for 30 teams), snapshot standings
      // Or simply snapshot at every RBNY game for a cleaner chart
      const week = i + 1;
      if (week % 10 === 0 || i === fixtures.length - 1) {
        const weekNum = Math.ceil(week / 10);
        const ranked = Array.from(teamStats.entries())
          .map(([id, s]) => ({ id, ...s }))
          .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);

        ranked.forEach((t, pos) => {
          result.push({
            week: weekNum,
            team: t.name,
            position: pos + 1,
            points: t.pts,
          });
        });
      }
    });

    return result;
  }, []);
}

export async function getLeagueXgScatter(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    // Get all finished fixtures this season
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, home_team_id, away_team_id')
      .eq('season_id', seasonId)
      .eq('state', 'FT');

    if (!fixtures?.length) return [];

    const fixtureIds = fixtures.map((f) => f.id);

    // Get xG for all teams
    const { data: xgStats } = await supabase
      .from('sm_fixture_stats')
      .select('fixture_id, team_id, value')
      .in('fixture_id', fixtureIds)
      .eq('stat_code', 'expected-goals');

    if (!xgStats?.length) return [];

    // Aggregate xG per team
    const teamXg = new Map<number, { xgFor: number; xgAgainst: number; games: number }>();

    // Build fixture team map for opponent lookup
    const fixtureTeams = new Map<number, { home: number; away: number }>();
    for (const f of fixtures) {
      fixtureTeams.set(f.id, { home: f.home_team_id, away: f.away_team_id });
    }

    for (const s of xgStats) {
      const teamId = s.team_id;
      const ft = fixtureTeams.get(s.fixture_id);
      if (!ft) continue;
      const opponentId = teamId === ft.home ? ft.away : ft.home;

      if (!teamXg.has(teamId)) teamXg.set(teamId, { xgFor: 0, xgAgainst: 0, games: 0 });
      const entry = teamXg.get(teamId)!;
      entry.xgFor += Number(s.value) || 0;
      entry.games++;
    }

    // Now get opponent xG for each team
    for (const s of xgStats) {
      const ft = fixtureTeams.get(s.fixture_id);
      if (!ft) continue;
      const opponentId = s.team_id === ft.home ? ft.away : ft.home;
      if (teamXg.has(opponentId)) {
        teamXg.get(opponentId)!.xgAgainst += Number(s.value) || 0;
      }
    }

    // Get team names
    const teamIds = [...teamXg.keys()];
    const { data: teams } = await supabase
      .from('sm_teams')
      .select('id, name, logo_path')
      .in('id', teamIds);

    const teamMap = new Map((teams || []).map((t) => [t.id, t]));

    return teamIds.map((tid) => {
      const t = teamMap.get(tid);
      const xg = teamXg.get(tid)!;
      const games = xg.games || 1;
      return {
        team: t?.name || 'Unknown',
        team_id: String(tid),
        xg_for_per90: +(xg.xgFor / games).toFixed(2),
        xg_against_per90: +(xg.xgAgainst / games).toFixed(2),
        is_rbny: tid === RBNY_TEAM_ID,
        logo_url: t?.logo_path || null,
      };
    });
  }, []);
}

export async function getTopScorers(season = 2026, limit = 20) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const seasonId = await getSeasonId(season);
    if (!seasonId) return [];

    // Aggregate goals from events
    const { data: goals } = await supabase
      .from('sm_events')
      .select('player_name, team_id, sm_fixtures!inner(season_id)')
      .eq('event_type', 'goal')
      .eq('sm_fixtures.season_id', seasonId);

    if (!goals?.length) return [];

    const scorers = new Map<string, { name: string; team: string; goals: number; teamId: number }>();
    for (const g of goals) {
      const key = `${g.player_name}-${g.team_id}`;
      const existing = scorers.get(key) || { name: g.player_name || 'Unknown', team: '', goals: 0, teamId: g.team_id };
      existing.goals++;
      scorers.set(key, existing);
    }

    // Get team names
    const teamIds = [...new Set(Array.from(scorers.values()).map((s) => s.teamId))];
    const { data: teams } = await supabase
      .from('sm_teams')
      .select('id, name')
      .in('id', teamIds);

    const teamMap = new Map((teams || []).map((t) => [t.id, t.name]));
    for (const s of scorers.values()) {
      s.team = teamMap.get(s.teamId) || 'Unknown';
    }

    return Array.from(scorers.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, limit)
      .map((s) => ({
        name: s.name,
        team: s.team,
        goals: s.goals,
        assists: 0,
        xg: 0,
        minutes: 0,
        games_played: 0,
      }));
  }, []);
}

// ── Historical ──────────────────────────────────────────────────

export async function getMultiSeasonTeamStats(_startSeason = 2016, _endSeason = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    // Get all RBNY standings across seasons
    const { data } = await supabase
      .from('sm_standings')
      .select('*, sm_seasons!inner(year)')
      .eq('team_id', RBNY_TEAM_ID)
      .order('sm_seasons.year', { ascending: true } as any);

    // Also get per-season xG totals for RBNY
    const seasonIds = (data || []).map((s: any) => s.season_id);
    const { data: rbnyFixtures } = await supabase
      .from('sm_fixtures')
      .select('id, season_id')
      .in('season_id', seasonIds)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);

    const seasonXg = new Map<number, { xgFor: number; xgAgainst: number }>();
    if (rbnyFixtures?.length) {
      const fIds = rbnyFixtures.map((f) => f.id);
      const { data: xgStats } = await supabase
        .from('sm_fixture_stats')
        .select('fixture_id, team_id, value')
        .in('fixture_id', fIds)
        .eq('stat_code', 'expected-goals');

      const fixSeasonMap = new Map(rbnyFixtures.map((f) => [f.id, f.season_id]));
      for (const s of xgStats || []) {
        const sid = fixSeasonMap.get(s.fixture_id);
        if (!sid) continue;
        if (!seasonXg.has(sid)) seasonXg.set(sid, { xgFor: 0, xgAgainst: 0 });
        const entry = seasonXg.get(sid)!;
        if (s.team_id === RBNY_TEAM_ID) entry.xgFor += Number(s.value) || 0;
        else entry.xgAgainst += Number(s.value) || 0;
      }
    }

    return (data || []).map((s: any) => {
      const xg = seasonXg.get(s.season_id);
      return {
        team: 'New York RB',
        season: s.sm_seasons?.year || 0,
        games_played: s.games_played,
        points: s.points,
        goals_for: s.goals_for,
        goals_against: s.goals_against,
        goal_difference: s.goal_difference,
        xg_for: xg ? +xg.xgFor.toFixed(1) : 0,
        xg_against: xg ? +xg.xgAgainst.toFixed(1) : 0,
        goals_added: 0,
        xpass: 0,
        position: s.position,
      };
    });
  }, []);
}

export async function getAllTimePlayerContributions(): Promise<Array<{
  player_name: string;
  season: number;
  goals: number;
  assists: number;
  xg: number;
  goals_added: number;
  minutes: number;
  games_played: number;
  team: string;
}>> {
  return [];
}

export async function getHistoricalFormGrid() {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    // Get all RBNY fixtures across all seasons with results
    const { data: fixtures } = await supabase
      .from('sm_fixtures')
      .select('id, season_id, starting_at, home_team_id, away_team_id, home_score, away_score, sm_seasons!inner(year)')
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`)
      .order('starting_at', { ascending: true });

    return (fixtures || []).map((f: any) => {
      const isHome = f.home_team_id === RBNY_TEAM_ID;
      const gf = (isHome ? f.home_score : f.away_score) ?? 0;
      const ga = (isHome ? f.away_score : f.home_score) ?? 0;
      return {
        season: f.sm_seasons?.year || 0,
        match_date: f.starting_at,
        result: gf > ga ? 'W' : gf === ga ? 'D' : 'L',
      };
    });
  }, []);
}

export async function getSeasonsList() {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('sm_seasons')
      .select('year')
      .eq('league_id', 779)
      .order('year', { ascending: false });
    return (data || []).map((d) => d.year);
  }, []);
}

// ── Goalkeeper ──────────────────────────────────────────────────

export async function getGKStats(season = 2026) {
  if (!isConfigured) return [];
  return safeQuery(async () => {
    const { data } = await supabase
      .from('sm_players')
      .select('*')
      .eq('team_id', RBNY_TEAM_ID)
      .eq('position', 'Goalkeeper');

    if (!data?.length) return [];

    const seasonId = await getSeasonId(season);
    if (!seasonId) return data.map((p) => ({
      name: p.common_name || p.name,
      position: 'GK',
      games_played: 0,
      minutes: 0,
      saves: 0,
      goals_conceded: 0,
      clean_sheets: 0,
      goals_added: null,
      image_url: p.image_path,
      sofascore_id: null,
    }));

    const { data: seasonFixtures } = await supabase
      .from('sm_fixtures')
      .select('id')
      .eq('season_id', seasonId)
      .eq('state', 'FT')
      .or(`home_team_id.eq.${RBNY_TEAM_ID},away_team_id.eq.${RBNY_TEAM_ID}`);
    const fIds = (seasonFixtures || []).map((f) => f.id);

    return Promise.all(data.map(async (p) => {
      let minutes = 0, saves = 0, goalsConceded = 0, apps = 0;

      if (fIds.length > 0) {
        const { data: lineups } = await supabase
          .from('sm_lineups')
          .select('fixture_id')
          .in('fixture_id', fIds)
          .eq('player_id', p.id);
        apps = lineups?.length || 0;

        const { data: pStats } = await supabase
          .from('sm_lineup_stats')
          .select('stat_code, value')
          .in('fixture_id', fIds)
          .eq('player_id', p.id);

        for (const s of pStats || []) {
          if (s.stat_code === 'minutes-played') minutes += Number(s.value) || 0;
          if (s.stat_code === 'saves') saves += Number(s.value) || 0;
          if (s.stat_code === 'goals-conceded' || s.stat_code === 'gk-goals-conceded') goalsConceded += Number(s.value) || 0;
        }
      }

      return {
        name: p.common_name || p.name,
        position: 'GK',
        games_played: apps,
        minutes,
        saves,
        goals_conceded: goalsConceded,
        clean_sheets: 0,
        goals_added: null,
        image_url: p.image_path,
        sofascore_id: null,
      };
    }));
  }, []);
}

// ── Market Values & Transfers ───────────────────────────────────

export async function getPlayerMarketValues(_playerName: string) {
  return [];
}

export async function getPlayerTransfers(_playerName: string) {
  return [];
}

// ── Enhanced Standings (with logos) ─────────────────────────────

export async function getStandingsWithLogos(season = 2026, _conference = 'Eastern') {
  return getEnhancedStandings(season, _conference);
}
