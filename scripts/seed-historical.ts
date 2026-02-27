/**
 * South Ward Signal — Historical Data Backfill
 *
 * One-time script to backfill 2016-2025 data from ASA.
 * Populates: team_season_stats, player_season_history
 *
 * Usage: npx tsx scripts/seed-historical.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ASA_BASE = 'https://app.americansocceranalysis.com/api/v1';
const NYRB_ASA_ID = 'a2lqRX2Mr0';

const SEASONS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

async function fetchJSON(url: string) {
  const res = await fetch(url);
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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Team Season Stats ───────────────────────────────────────────

async function seedTeamSeasonStats() {
  console.log('\n═══ Seeding Team Season Stats ═══');

  for (const season of SEASONS) {
    console.log(`  [${season}] Fetching team xG...`);
    try {
      const xgData: any[] = await fetchJSON(
        `${ASA_BASE}/mls/teams/xgoals?season_name=${season}`
      );

      const nyrb = xgData.find((t: any) => t.team_id === NYRB_ASA_ID);
      if (!nyrb) {
        console.log(`  [${season}] NYRB not found in xG data, skipping.`);
        await delay(1000);
        continue;
      }

      // Try to get Goals Added data
      let gaTotal = null;
      try {
        const gaData: any[] = await fetchJSON(
          `${ASA_BASE}/mls/teams/goals-added?season_name=${season}&team_id=${NYRB_ASA_ID}`
        );
        if (gaData?.[0]?.data) {
          gaTotal = gaData[0].data.reduce(
            (sum: number, d: any) => sum + (d.goals_added_for || 0),
            0
          );
        }
      } catch {
        console.log(`  [${season}] Goals Added unavailable.`);
      }
      await delay(500);

      // Try to get xPass data
      let xpass = null;
      try {
        const xpassData: any[] = await fetchJSON(
          `${ASA_BASE}/mls/teams/xpass?season_name=${season}&team_id=${NYRB_ASA_ID}`
        );
        if (xpassData?.[0]) {
          xpass = xpassData[0].passes_completed_over_expected_for || null;
        }
      } catch {
        console.log(`  [${season}] xPass unavailable.`);
      }
      await delay(500);

      const record = {
        id: `${NYRB_ASA_ID}-${season}`,
        team: 'New York Red Bulls',
        team_id: NYRB_ASA_ID,
        season,
        games_played: nyrb.count_games || 0,
        goals_for: nyrb.goals_for || 0,
        goals_against: nyrb.goals_against || 0,
        xg_for: nyrb.xgoals_for || 0,
        xg_against: nyrb.xgoals_against || 0,
        goals_added: gaTotal,
        xpass,
        points: nyrb.points || 0,
        conference: 'Eastern',
        updated_at: new Date().toISOString(),
      };

      await upsertSupabase('team_season_stats', [record]);
      console.log(`  [${season}] ✓ Team stats saved (${nyrb.count_games} games)`);

      // Also seed all teams for league scatter data
      const allTeamRecords = xgData.map((t: any) => ({
        id: `${t.team_id}-${season}`,
        team: t.team_name || t.team_id,
        team_id: t.team_id,
        season,
        games_played: t.count_games || 0,
        goals_for: t.goals_for || 0,
        goals_against: t.goals_against || 0,
        xg_for: t.xgoals_for || 0,
        xg_against: t.xgoals_against || 0,
        points: t.points || 0,
        updated_at: new Date().toISOString(),
      }));

      await upsertSupabase('team_season_stats', allTeamRecords);
      console.log(`  [${season}] ✓ All ${allTeamRecords.length} teams saved`);
    } catch (err: any) {
      console.error(`  [${season}] Error: ${err.message}`);
    }

    await delay(1500);
  }
}

// ── Player Season History ───────────────────────────────────────

async function seedPlayerSeasonHistory() {
  console.log('\n═══ Seeding Player Season History ═══');

  for (const season of SEASONS) {
    console.log(`  [${season}] Fetching player xG...`);
    try {
      const players: any[] = await fetchJSON(
        `${ASA_BASE}/mls/players/xgoals?season_name=${season}&team_id=${NYRB_ASA_ID}`
      );
      await delay(1000);

      // Goals Added breakdown
      let gaMap = new Map<string, any>();
      try {
        const gaPlayers: any[] = await fetchJSON(
          `${ASA_BASE}/mls/players/goals-added?season_name=${season}&team_id=${NYRB_ASA_ID}`
        );
        for (const p of gaPlayers) {
          const breakdown: Record<string, number> = {};
          let total = 0;
          for (const d of p.data || []) {
            breakdown[d.action_type] = d.goals_added_above_avg || 0;
            total += d.goals_added_above_avg || 0;
          }
          gaMap.set(p.player_id, { ...breakdown, total });
        }
      } catch {
        console.log(`  [${season}] Goals Added breakdown unavailable.`);
      }
      await delay(1000);

      // Salaries
      let salaryMap = new Map<string, number>();
      try {
        const salaries: any[] = await fetchJSON(
          `${ASA_BASE}/mls/players/salaries?season_name=${season}&team_id=${NYRB_ASA_ID}`
        );
        for (const s of salaries) {
          salaryMap.set(s.player_id, s.guaranteed_compensation || s.base_salary || 0);
        }
      } catch {
        console.log(`  [${season}] Salaries unavailable.`);
      }
      await delay(500);

      const records = players.map((p: any) => {
        const ga = gaMap.get(p.player_id) || {};
        return {
          id: `${p.player_id}-${season}`,
          player_name: p.player_name || 'Unknown',
          team: 'New York Red Bulls',
          season,
          position: p.general_position || 'Unknown',
          games_played: p.count_games || 0,
          minutes: p.minutes_played || 0,
          goals: p.goals || 0,
          assists: p.assists || 0,
          xg: p.xgoals || 0,
          xa: p.xassists || 0,
          goals_added: ga.total ?? null,
          ga_dribbling: ga.Dribbling ?? null,
          ga_passing: ga.Passing ?? null,
          ga_receiving: ga.Receiving ?? null,
          ga_shooting: ga.Shooting ?? null,
          ga_defending: ga.Interrupting ?? ga.Defending ?? null,
          key_passes: p.key_passes ?? null,
          salary: salaryMap.get(p.player_id) ?? null,
          updated_at: new Date().toISOString(),
        };
      });

      await upsertSupabase('player_season_history', records);
      console.log(`  [${season}] ✓ ${records.length} players saved`);
    } catch (err: any) {
      console.error(`  [${season}] Error: ${err.message}`);
    }

    await delay(1500);
  }
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('═══ South Ward Signal — Historical Backfill ═══');
  console.log(`Seasons: ${SEASONS.join(', ')}\n`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  await seedTeamSeasonStats();
  await seedPlayerSeasonHistory();

  console.log('\n═══ Historical backfill complete ═══');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
