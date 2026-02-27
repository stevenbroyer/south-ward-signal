/**
 * South Ward Signal — SofaScore Data Enrichment
 *
 * Enriches matches with SofaScore data:
 * player ratings, events/incidents, match statistics.
 * Replaces seed-fotmob.ts (FotMob API is locked behind Cloudflare Turnstile).
 *
 * Usage: npx tsx scripts/seed-sofascore.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1';

const NYRB_SOFASCORE_ID = 2506;

async function fetchSofaScore(path: string) {
  const res = await fetch(`${SOFASCORE_BASE}${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${SOFASCORE_BASE}${path}`);
  return res.json();
}

async function upsertSupabase(table: string, records: any[]) {
  if (!records.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[UPSERT] ${table}: ${res.status} — ${text}`);
  }
}

async function patchSupabase(table: string, filter: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[PATCH] ${table}: ${res.status} — ${text}`);
  }
}

async function querySupabase(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Enrich a single match ─────────────────────────────────────

async function enrichMatch(matchId: string, sofascoreEventId: number, homeTeam: string, awayTeam: string) {
  console.log(`  Enriching ${matchId} (SofaScore: ${sofascoreEventId})...`);

  try {
    // Fetch lineups (includes player ratings)
    const lineups = await fetchSofaScore(`/event/${sofascoreEventId}/lineups`);
    await delay(500);

    // Fetch incidents (goals, cards, subs)
    const incidentData = await fetchSofaScore(`/event/${sofascoreEventId}/incidents`);
    await delay(500);

    // Fetch match statistics
    let statistics: any = null;
    try {
      statistics = await fetchSofaScore(`/event/${sofascoreEventId}/statistics`);
    } catch { /* stats not always available */ }
    await delay(500);

    // Fetch momentum graph
    let momentumData: any[] = [];
    try {
      const graphRes = await fetchSofaScore(`/event/${sofascoreEventId}/graph`);
      momentumData = (graphRes.graphPoints || []).map((p: any) => ({
        minute: p.minute,
        value: p.value,
      }));
    } catch { /* graph not always available */ }
    await delay(500);

    // Fetch shotmap (supplement match_shots if empty)
    let shotmapData: any[] = [];
    try {
      const shotmapRes = await fetchSofaScore(`/event/${sofascoreEventId}/shotmap`);
      shotmapData = shotmapRes.shotmap || [];
    } catch { /* shotmap not always available */ }
    await delay(500);

    // Extract events from incidents
    const incidents = (incidentData.incidents || []).filter(
      (i: any) => i.incidentType === 'goal' || i.incidentType === 'card' || i.incidentType === 'substitution'
    );

    const events = incidents.map((i: any) => ({
      type: i.incidentType,
      time: i.time,
      addedTime: i.addedTime || null,
      player: i.player?.name || i.playerIn?.name || null,
      assistPlayer: i.assist1?.name || null,
      isHome: i.isHome,
      incidentClass: i.incidentClass || null,
      playerIn: i.playerIn?.name || null,
      playerOut: i.playerOut?.name || null,
    }));

    // Build structured stats JSONB from statistics
    let parsedStats: Record<string, Record<string, number>> = {};
    if (statistics?.statistics) {
      const allPeriod = statistics.statistics.find((s: any) => s.period === 'ALL');
      if (allPeriod) {
        for (const group of allPeriod.groups || []) {
          for (const item of group.statisticsItems || []) {
            const key = item.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/(^_|_$)/g, '');
            parsedStats[key] = {
              home: parseFloat(item.home) || 0,
              away: parseFloat(item.away) || 0,
            };
          }
        }
      }
    }

    // Update matches table with events, momentum, and structured stats
    const matchPatch: any = {
      fotmob_id: String(sofascoreEventId),
      events: JSON.stringify(events),
      updated_at: new Date().toISOString(),
    };
    if (momentumData.length > 0) {
      matchPatch.momentum = JSON.stringify(momentumData);
    }
    if (Object.keys(parsedStats).length > 0) {
      matchPatch.stats = JSON.stringify(parsedStats);
    }
    await patchSupabase('matches', `id=eq.${matchId}`, matchPatch);

    // Extract player ratings and stats from lineups
    const playerRecords: any[] = [];

    for (const side of [
      { players: lineups.home?.players || [], team: homeTeam },
      { players: lineups.away?.players || [], team: awayTeam },
    ]) {
      for (const p of side.players) {
        const stats = p.statistics || {};
        playerRecords.push({
          match_id: matchId,
          player_name: p.player?.name || 'Unknown',
          team: side.team,
          position: p.position || p.player?.position || null,
          minutes_played: stats.minutesPlayed || 0,
          goals: stats.goals || 0,
          assists: stats.goalAssist || 0,
          shots: stats.totalShots || 0,
          key_passes: stats.keyPass || 0,
          passes: stats.totalPass || 0,
          pass_accuracy: stats.totalPass > 0
            ? Math.round((stats.accuratePass / stats.totalPass) * 100)
            : null,
          tackles: stats.totalTackle || 0,
          interceptions: stats.interceptionWon || 0,
          fouls: stats.fouls || 0,
          fotmob_rating: stats.rating ? Number(stats.rating.toFixed(1)) : null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (playerRecords.length) {
      await upsertSupabase('player_match_stats', playerRecords);
    }

    // Supplement match_shots from SofaScore shotmap if we have data
    if (shotmapData.length > 0) {
      const shotRecords = shotmapData.map((s: any) => {
        const shotType = s.shotType || 'regular';
        const isGoal = shotType === 'goal';
        const isSaved = shotType === 'save' || shotType === 'saved';
        const isBlocked = shotType === 'blocked';
        const isPost = shotType === 'post';
        const outcome = isGoal ? 'goal' : isSaved ? 'saved' : isBlocked ? 'blocked' : isPost ? 'post' : 'off_target';

        return {
          match_id: matchId,
          team: s.isHome ? homeTeam : awayTeam,
          player: s.player?.name || 'Unknown',
          minute: s.time || 0,
          x: s.playerCoordinates?.x ?? 50,
          y: s.playerCoordinates?.y ?? 50,
          xg: s.xg || 0,
          outcome,
          body_part: s.bodyPart || null,
          shot_type: s.situation || null,
          home_team_side: s.isHome,
        };
      });
      if (shotRecords.length) {
        await upsertSupabase('match_shots', shotRecords);
      }
    }

    const statsSummary = Object.keys(parsedStats).length > 0
      ? `stats: ${Object.keys(parsedStats).length} metrics`
      : '';
    const momentumSummary = momentumData.length > 0 ? `momentum: ${momentumData.length}pts` : '';
    const shotsSummary = shotmapData.length > 0 ? `shots: ${shotmapData.length}` : '';

    console.log(`  ✓ ${matchId}: ${events.length} events, ${playerRecords.length} players ${[statsSummary, momentumSummary, shotsSummary].filter(Boolean).join(', ')}`);
    return true;
  } catch (err: any) {
    console.error(`  ✗ ${matchId}: ${err.message}`);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('═══ South Ward Signal — SofaScore Enrichment ═══\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase not configured.');
    process.exit(1);
  }

  // Get finished NYRB matches — re-enrich all to fill momentum/stats/shotmap
  const matches = await querySupabase(
    'matches',
    `status=eq.finished&or=(home_team.eq.New York Red Bulls,away_team.eq.New York Red Bulls)&order=date.desc`
  );

  console.log(`Found ${matches.length} matches to enrich.\n`);

  if (!matches.length) {
    console.log('No matches to enrich. Done.');
    return;
  }

  // Fetch NYRB's recent match history from SofaScore
  console.log('Fetching NYRB match history from SofaScore...');
  const sofascoreMatches: any[] = [];

  for (let page = 0; page < 5; page++) {
    try {
      const data = await fetchSofaScore(`/team/${NYRB_SOFASCORE_ID}/events/last/${page}`);
      const events = data.events || [];
      if (events.length === 0) break;
      sofascoreMatches.push(...events);
      await delay(1000);
    } catch {
      break;
    }
  }

  console.log(`Found ${sofascoreMatches.length} SofaScore matches.\n`);

  let enriched = 0;
  let failed = 0;

  for (const match of matches) {
    const matchDate = new Date(match.date).toISOString().split('T')[0];

    // Find matching SofaScore event by date + teams
    const sofaMatch = sofascoreMatches.find((sm: any) => {
      const smDate = new Date(sm.startTimestamp * 1000).toISOString().split('T')[0];
      if (smDate !== matchDate) return false;

      // Match by team names (fuzzy — SofaScore may use slightly different names)
      const homeMatch = sm.homeTeam?.name?.includes('Red Bull') || match.home_team?.includes(sm.homeTeam?.name?.split(' ')[0]);
      const awayMatch = sm.awayTeam?.name?.includes('Red Bull') || match.away_team?.includes(sm.awayTeam?.name?.split(' ')[0]);
      return homeMatch || awayMatch;
    });

    if (sofaMatch) {
      const success = await enrichMatch(
        match.id,
        sofaMatch.id,
        sofaMatch.homeTeam.name,
        sofaMatch.awayTeam.name
      );
      if (success) enriched++;
      else failed++;
      await delay(2000); // Rate limit: ~1 match per 2 seconds
    } else {
      console.log(`  Skip: no SofaScore match for ${matchDate} (${match.home_team} vs ${match.away_team})`);
    }
  }

  console.log(`\n═══ SofaScore enrichment complete ═══`);
  console.log(`Enriched: ${enriched}, Failed: ${failed}, Skipped: ${matches.length - enriched - failed}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
