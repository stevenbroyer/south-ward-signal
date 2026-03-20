import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Cron — ESPN MLS Data Sync
 *
 * Runs daily at 7 AM UTC via Vercel cron.
 * Syncs fixtures, standings, and form from ESPN's free public API.
 */

const ESPN_BASE = 'https://site.api.espn.com/apis';
const MLS_SPORT = 'soccer/usa.1';
const ESPN_RBNY_ID = 190;
const MLS_LEAGUE_ID = 779;
const ESPN_SEASON_ID = 20260;

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN ${res.status}: ${url}`);
  return res.json() as Promise<T>;
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

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this header automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const db = createClient(supabaseUrl, supabaseKey);
  const results: string[] = [];

  try {
    // 1. Ensure season exists
    await db.from('sm_seasons').update({ is_current: false }).eq('is_current', true);
    await db.from('sm_seasons').upsert(
      { id: ESPN_SEASON_ID, league_id: MLS_LEAGUE_ID, year: 2026, is_current: true },
      { onConflict: 'id' },
    );
    results.push('season: ok');

    // 2. Sync teams
    const teamsData = await fetchJson<any>(`${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/teams`);
    const teams = teamsData?.sports?.[0]?.leagues?.[0]?.teams || [];
    for (const entry of teams) {
      const t = entry.team || entry;
      const id = Number(t.id);
      if (!id) continue;
      await db.from('sm_teams').upsert(
        { id, name: t.displayName || t.name, short_code: t.abbreviation || null, is_focus: id === ESPN_RBNY_ID },
        { onConflict: 'id' },
      );
    }
    results.push(`teams: ${teams.length}`);

    // 3. Sync RBNY past results
    const schedData = await fetchJson<any>(
      `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/teams/${ESPN_RBNY_ID}/schedule?season=2026`,
    );
    let pastCount = 0;
    for (const evt of schedData?.events || []) {
      const row = parseFixture(evt);
      if (!row) continue;
      await db.from('sm_fixtures').upsert(row, { onConflict: 'id' });
      pastCount++;
    }
    results.push(`rbny_past: ${pastCount}`);

    // 4. Sync upcoming fixtures (next 60 days)
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + 60);
    const dateRange = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${future.getFullYear()}${pad(future.getMonth() + 1)}${pad(future.getDate())}`;

    const sbData = await fetchJson<any>(
      `${ESPN_BASE}/site/v2/sports/${MLS_SPORT}/scoreboard?dates=${dateRange}`,
    );
    let upcomingCount = 0;
    for (const evt of sbData?.events || []) {
      const row = parseFixture(evt);
      if (!row) continue;
      await db.from('sm_fixtures').upsert(row, { onConflict: 'id' });
      upcomingCount++;
    }
    results.push(`upcoming: ${upcomingCount}`);

    // 5. Sync standings
    const stData = await fetchJson<any>(
      `${ESPN_BASE}/v2/sports/${MLS_SPORT}/standings?season=2026`,
    );
    let standingsCount = 0;
    for (const conf of stData?.children || []) {
      const confName = conf.name || null;
      for (const entry of conf.standings?.entries || []) {
        const teamId = Number(entry.team?.id);
        if (!teamId) continue;
        const stats: Record<string, number> = {};
        for (const s of entry.stats || []) stats[s.name || s.abbreviation] = Number(s.value) || 0;

        await db.from('sm_standings').upsert(
          {
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
          },
          { onConflict: 'season_id,team_id' },
        );
        standingsCount++;
      }
    }
    results.push(`standings: ${standingsCount}`);

    // 6. Sync match stats for recent RBNY fixtures
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

    let matchStatsCount = 0;
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
        for (const team of summary?.boxscore?.teams || []) {
          const teamId = Number(team.team?.id);
          if (!teamId) continue;
          for (const stat of team.statistics || []) {
            const mapping = STAT_MAP[stat.name];
            if (!mapping) continue;
            await db.from('sm_fixture_stats').upsert(
              { fixture_id: fix.id, team_id: teamId, stat_type_id: mapping.typeId, stat_code: mapping.code, value: Number(stat.displayValue) || 0 },
              { onConflict: 'fixture_id,team_id,stat_type_id' },
            );
            matchStatsCount++;
          }
        }
      } catch (e: any) {
        results.push(`stats_err_${fix.id}: ${e.message}`);
      }
    }
    results.push(`match_stats: ${matchStatsCount}`);

    // 7. Compute RBNY form
    const { data: fixtures } = await db
      .from('sm_fixtures')
      .select('home_team_id, home_score, away_score')
      .eq('state', 'FT')
      .or(`home_team_id.eq.${ESPN_RBNY_ID},away_team_id.eq.${ESPN_RBNY_ID}`)
      .order('starting_at', { ascending: false })
      .limit(5);

    if (fixtures?.length) {
      const form = fixtures
        .map((f) => {
          const isHome = f.home_team_id === ESPN_RBNY_ID;
          const gf = isHome ? f.home_score : f.away_score;
          const ga = isHome ? f.away_score : f.home_score;
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

    return NextResponse.json({ ok: true, results, ts: new Date().toISOString() });
  } catch (err: any) {
    console.error('[cron/sync-espn]', err);
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }
}
