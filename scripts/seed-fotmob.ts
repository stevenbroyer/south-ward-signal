/**
 * South Ward Signal — FotMob Data Enrichment
 *
 * Enriches current season matches with FotMob data:
 * player ratings, momentum, events, match stats.
 * Run after matches complete.
 *
 * Usage: npx tsx scripts/seed-fotmob.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const FOTMOB_BASE = 'https://www.fotmob.com/api';

const NYRB_FOTMOB_ID = 7293;
const MATCH_SEASON = 2024;  // Season of matches in DB (from API-Football free tier)

async function fetchJSON(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function upsertSupabase(table: string, records: any[], conflictColumn = 'id') {
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

async function enrichMatch(matchId: string, fotmobId: string) {
  console.log(`  Enriching match ${matchId} (FotMob: ${fotmobId})...`);

  try {
    const detail = await fetchJSON(`${FOTMOB_BASE}/matchDetails?matchId=${fotmobId}`);
    await delay(2000);

    // Extract events
    const events = detail.content?.matchFacts?.events || [];

    // Extract momentum
    const momentum = detail.content?.matchFacts?.momentum?.main?.data || [];

    // Update matches table with FotMob data
    await fetch(`${SUPABASE_URL}/rest/v1/matches?id=eq.${matchId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        fotmob_id: fotmobId,
        momentum: JSON.stringify(momentum),
        events: JSON.stringify(events),
        updated_at: new Date().toISOString(),
      }),
    });

    // Extract player ratings and upsert to player_match_stats
    const lineups = [
      { lineup: detail.content?.lineup?.homeTeam, isHome: true, teamName: detail.general?.homeTeam?.name },
      { lineup: detail.content?.lineup?.awayTeam, isHome: false, teamName: detail.general?.awayTeam?.name },
    ];

    const playerRecords: any[] = [];
    for (const { lineup, teamName } of lineups) {
      if (!lineup?.players) continue;
      for (const row of lineup.players) {
        for (const player of row) {
          playerRecords.push({
            match_id: matchId,
            player_name: player.name,
            team: teamName || 'Unknown',
            position: player.positionStringShort || null,
            fotmob_rating: player.rating?.num ? parseFloat(player.rating.num) : null,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (playerRecords.length) {
      await upsertSupabase('player_match_stats', playerRecords);
    }

    console.log(`  ✓ Match ${matchId}: ${events.length} events, ${momentum.length} momentum pts, ${playerRecords.length} players`);
  } catch (err: any) {
    console.error(`  ✗ Match ${matchId}: ${err.message}`);
  }
}

async function main() {
  console.log('═══ South Ward Signal — FotMob Enrichment ═══\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase not configured.');
    process.exit(1);
  }

  // Get finished matches without fotmob_id
  const matches = await querySupabase(
    'matches',
    `status=eq.finished&season=eq.${MATCH_SEASON}&fotmob_id=is.null&or=(home_team.eq.New York Red Bulls,away_team.eq.New York Red Bulls)&order=date.desc`
  );

  console.log(`Found ${matches.length} matches without FotMob data.\n`);

  if (!matches.length) {
    console.log('No matches to enrich. Done.');
    return;
  }

  // For now, we'll need to manually map fixture IDs to FotMob IDs
  // or search FotMob's team fixtures endpoint
  try {
    const teamData = await fetchJSON(`${FOTMOB_BASE}/teams?id=${NYRB_FOTMOB_ID}`);
    await delay(2000);

    const fixtures = teamData.fixtures?.allFixtures?.fixtures || [];
    const finishedFixtures = fixtures.filter((f: any) => f.status?.finished);

    // Try to match by date
    for (const match of matches) {
      const matchDate = new Date(match.date).toISOString().split('T')[0];
      const fotmobMatch = finishedFixtures.find((f: any) => {
        const fDate = new Date(f.status?.utcTime || '').toISOString().split('T')[0];
        return fDate === matchDate;
      });

      if (fotmobMatch) {
        await enrichMatch(match.id, String(fotmobMatch.id));
        await delay(3000);
      } else {
        console.log(`  No FotMob match found for ${match.date} (${match.home_team} vs ${match.away_team})`);
      }
    }
  } catch (err: any) {
    console.error('Error fetching FotMob fixtures:', err.message);
  }

  console.log('\n═══ FotMob enrichment complete ═══');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
