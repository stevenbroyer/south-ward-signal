import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Shared ESPN → Supabase sync for MLS / RBNY match data.
 * Free, no API key. Used by the daily cron route and the admin "Sync now" button.
 * Writes to sm_teams, sm_seasons, sm_fixtures, sm_standings, sm_fixture_stats.
 */

const ESPN_BASE = 'https://site.api.espn.com/apis';
const MLS_SPORT = 'soccer/usa.1';
const ESPN_RBNY_ID = 190;
const MLS_LEAGUE_ID = 779;
const ESPN_SEASON_ID = 20260;
const SEASON_YEAR = 2026;

export interface SyncResult {
  ok: boolean;
  results: string[];
  error?: string;
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateRange(from: Date, to: Date): string {
  const f = `${from.getFullYear()}${pad(from.getMonth() + 1)}${pad(from.getDate())}`;
  const t = `${to.getFullYear()}${pad(to.getMonth() + 1)}${pad(to.getDate())}`;
  return `${f}-${t}`;
}

function extractScore(score: any): number {
  if (score == null) return 0;
  if (typeof score === 'number') return score;
  if (typeof score === 'string') return Number(score) || 0;
  return Number(score.value ?? score.displayValue ?? 0);
}

function parseFixture(evt: any) {
  const comp = evt.competitions?.[0];
  if (!comp) return null;

  const competitors = comp.competitors || [];
  const home = competitors.find((c: any) => c.homeAway === 'home');
  const away = competitors.find((c: any) => c.homeAway === 'away');
  if (!home || !away) return null;

  const status = comp.status?.type;
  let state = 'NS';
  if (status?.state === 'post' || status?.completed) state = 'FT';
  else if (status?.state === 'in') state = 'LIVE';

  return {
    id: Number(evt.id),
    season_id: ESPN_SEASON_ID,
    league_id: MLS_LEAGUE_ID,
    home_team_id: Number(home.team?.id || home.id),
    away_team_id: Number(away.team?.id || away.id),
    home_team_name: home.team?.displayName || '',
    away_team_name: away.team?.displayName || '',
    starting_at: evt.date,
    state,
    home_score: state === 'FT' || state === 'LIVE' ? extractScore(home.score) : null,
    away_score: state === 'FT' || state === 'LIVE' ? extractScore(away.score) : null,
    length: 90,
  };
}

/** Collect unique team rows from a list of ESPN events (so FK constraints never fail). */
function collectTeams(events: any[]): any[] {
  const map = new Map<number, any>();
  for (const evt of events) {
    for (const c of evt.competitions?.[0]?.competitors || []) {
      const t = c?.team;
      const id = Number(t?.id);
      if (!id || map.has(id)) continue;
      map.set(id, {
        id,
        name: t.displayName || t.name || 'Unknown',
        short_code: t.abbreviation || null,
        is_focus: id === ESPN_RBNY_ID,
      });
    }
  }
  return [...map.values()];
}

export async function runEspnSync(db: SupabaseClient): Promise<SyncResult> {
  const results: string[] = [];

  try {
    // 1. Season
    await db.from('sm_seasons').update({ is_current: false }).eq('is_current', true);
    await db.from('sm_seasons').upsert(
      { id: ESPN_SEASON_ID, league_id: MLS_LEAGUE_ID, year: SEASON_YEAR, is_current: true },
      { onConflict: 'id' },
    );
    results.push('season: ok');

    // 2. MLS teams
    const teamsData = await fetchJson<any>(`${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/teams`);
    const teamRows = (teamsData?.sports?.[0]?.leagues?.[0]?.teams || [])
      .map((entry: any) => {
        const t = entry.team || entry;
        const id = Number(t.id);
        if (!id) return null;
        return {
          id,
          name: t.displayName || t.name,
          short_code: t.abbreviation || null,
          is_focus: id === ESPN_RBNY_ID,
        };
      })
      .filter(Boolean);
    if (teamRows.length) await db.from('sm_teams').upsert(teamRows, { onConflict: 'id' });
    results.push(`teams: ${teamRows.length}`);

    // 3. Gather all fixtures: RBNY team schedule (results) + full-season scoreboard sweep.
    const events: any[] = [];
    const seenIds = new Set<number>();
    const addEvent = (evt: any) => {
      const id = Number(evt?.id);
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);
      events.push(evt);
    };

    const sched = await fetchJson<any>(
      `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/teams/${ESPN_RBNY_ID}/schedule?season=${SEASON_YEAR}`,
    );
    for (const evt of sched?.events || []) addEvent(evt);

    // Sweep the season in 30-day chunks (ESPN caps each scoreboard query at ~100 events).
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    const end = new Date(now.getFullYear(), 11, 15);
    let cursor = new Date(start);
    while (cursor < end) {
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + 30);
      const range = formatDateRange(cursor, chunkEnd > end ? end : chunkEnd);
      try {
        const sb = await fetchJson<any>(
          `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/scoreboard?dates=${range}`,
        );
        for (const evt of sb?.events || []) addEvent(evt);
      } catch (err) {
        results.push(`chunk ${range}: ${(err as Error).message}`);
      }
      cursor = chunkEnd;
    }

    // Ensure all opponent teams exist, then batch-upsert fixtures.
    const allTeams = collectTeams(events);
    if (allTeams.length) await db.from('sm_teams').upsert(allTeams, { onConflict: 'id' });

    const fixtureRows = events.map(parseFixture).filter(Boolean);
    if (fixtureRows.length) {
      const { error } = await db.from('sm_fixtures').upsert(fixtureRows, { onConflict: 'id' });
      if (error) results.push(`fixtures error: ${error.message}`);
    }
    results.push(`fixtures: ${fixtureRows.length}`);

    // 4. Standings
    const stData = await fetchJson<any>(
      `${ESPN_BASE}/v2/sports/${MLS_SPORT}/standings?season=${SEASON_YEAR}`,
    );
    const standingRows: any[] = [];
    for (const conf of stData?.children || []) {
      const confName = conf.name || conf.abbreviation || null;
      for (const entry of conf.standings?.entries || []) {
        const teamId = Number(entry.team?.id);
        if (!teamId) continue;
        const stats: Record<string, number> = {};
        for (const s of entry.stats || []) stats[s.name || s.abbreviation] = Number(s.value) || 0;
        standingRows.push({
          season_id: ESPN_SEASON_ID,
          team_id: teamId,
          team_name: entry.team?.displayName || '',
          position: stats.rank || 0,
          points: stats.points || 0,
          won: stats.wins || 0,
          drawn: stats.ties || 0,
          lost: stats.losses || 0,
          goals_for: stats.pointsFor || 0,
          goals_against: stats.pointsAgainst || 0,
          goal_difference: stats.pointDifferential || 0,
          games_played: stats.gamesPlayed || 0,
          form: null,
          conference: confName,
        });
      }
    }
    if (standingRows.length) {
      await db.from('sm_standings').upsert(standingRows, { onConflict: 'season_id,team_id' });
    }
    results.push(`standings: ${standingRows.length}`);

    // 5. Match stats for recent finished RBNY fixtures (possession / shots)
    const STAT_MAP: Record<string, { code: string; typeId: number }> = {
      possessionPct: { code: 'ball-possession', typeId: 90001 },
      totalShots: { code: 'shots-total', typeId: 90002 },
      shotsOnTarget: { code: 'shots-on-target', typeId: 90003 },
    };
    const { data: rbnyFixtures } = await db
      .from('sm_fixtures')
      .select('id')
      .eq('state', 'FT')
      .eq('season_id', ESPN_SEASON_ID)
      .or(`home_team_id.eq.${ESPN_RBNY_ID},away_team_id.eq.${ESPN_RBNY_ID}`)
      .order('starting_at', { ascending: false })
      .limit(10);

    let statsCount = 0;
    for (const fix of rbnyFixtures || []) {
      const { count: existing } = await db
        .from('sm_fixture_stats')
        .select('*', { count: 'exact', head: true })
        .eq('fixture_id', fix.id)
        .in('stat_type_id', [90001, 90002, 90003]);
      if (existing && existing > 0) continue;

      try {
        const summary = await fetchJson<any>(
          `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/summary?event=${fix.id}`,
        );
        const statRows: any[] = [];
        for (const team of summary?.boxscore?.teams || []) {
          const teamId = Number(team.team?.id);
          if (!teamId) continue;
          for (const stat of team.statistics || []) {
            const mapping = STAT_MAP[stat.name];
            if (!mapping) continue;
            statRows.push({
              fixture_id: fix.id,
              team_id: teamId,
              stat_type_id: mapping.typeId,
              stat_code: mapping.code,
              value: Number(stat.displayValue) || 0,
            });
          }
        }
        if (statRows.length) {
          await db.from('sm_fixture_stats').upsert(statRows, { onConflict: 'fixture_id,team_id,stat_type_id' });
          statsCount += statRows.length;
        }
      } catch (err) {
        results.push(`stats ${fix.id}: ${(err as Error).message}`);
      }
    }
    results.push(`match_stats: ${statsCount}`);

    // 6. RBNY form (last 5)
    const { data: recent } = await db
      .from('sm_fixtures')
      .select('home_team_id, home_score, away_score')
      .eq('state', 'FT')
      .or(`home_team_id.eq.${ESPN_RBNY_ID},away_team_id.eq.${ESPN_RBNY_ID}`)
      .order('starting_at', { ascending: false })
      .limit(5);
    if (recent?.length) {
      const form = recent
        .map((f) => {
          const isHome = f.home_team_id === ESPN_RBNY_ID;
          const gf = (isHome ? f.home_score : f.away_score) ?? 0;
          const ga = (isHome ? f.away_score : f.home_score) ?? 0;
          return gf > ga ? 'W' : gf === ga ? 'D' : 'L';
        })
        .reverse()
        .join('');
      await db
        .from('sm_standings')
        .update({ form })
        .eq('season_id', ESPN_SEASON_ID)
        .eq('team_id', ESPN_RBNY_ID);
      results.push(`form: ${form}`);
    }

    return { ok: true, results };
  } catch (err) {
    return { ok: false, results, error: (err as Error).message };
  }
}
