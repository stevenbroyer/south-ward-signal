/**
 * South Ward Signal — Player Images, Bios & Team Logos
 *
 * Populates player images, biographical data, and team logos into Supabase
 * using SofaScore as the data source.
 *
 * Step 1: Seed NYRB player images & bios (image_url, nationality, age, etc.)
 * Step 2: Seed MLS team logos into standings table
 *
 * Usage: npx tsx scripts/seed-images.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";
const NYRB_SOFASCORE_ID = 2506;

// ── Helpers ──────────────────────────────────────────────────

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

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Name matching ────────────────────────────────────────────

function normalize(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function fuzzyMatch(sofaName: string, dbName: string): boolean {
  const a = normalize(sofaName);
  const b = normalize(dbName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aLast = a.split(' ').pop() || '';
  const bLast = b.split(' ').pop() || '';
  return aLast.length > 2 && aLast === bLast;
}

// ── MLS Team IDs ─────────────────────────────────────────────

const MLS_TEAM_IDS: Record<string, number> = {
  'New York Red Bulls': 2506,
  'New York City FC': 11066,
  'Inter Miami CF': 334812,
  'FC Cincinnati': 103764,
  'Columbus Crew': 2516,
  'Charlotte FC': 366244,
  'Orlando City SC': 14317,
  'Philadelphia Union': 2503,
  'Atlanta United FC': 44564,
  'Nashville SC': 325427,
  'CF Montréal': 2515,
  'CF Montreal': 2515,
  'D.C. United': 2509,
  'DC United': 2509,
  'Toronto FC': 2505,
  'New England Revolution': 2511,
  'Chicago Fire FC': 2498,
  'Los Angeles FC': 81832,
  'LA Galaxy': 2499,
  'Los Angeles Galaxy': 2499,
  'Seattle Sounders FC': 2514,
  'Portland Timbers': 2510,
  'Real Salt Lake': 2512,
  'Minnesota United FC': 38917,
  'Colorado Rapids': 2507,
  'FC Dallas': 2497,
  'Austin FC': 342104,
  'Houston Dynamo FC': 2496,
  'San Jose Earthquakes': 2513,
  'Sporting Kansas City': 2508,
  'Vancouver Whitecaps FC': 2504,
  'St. Louis City SC': 366245,
  'San Diego FC': 1231411,
};

// ── Step 1: Seed NYRB Player Images & Bios ───────────────────

async function seedPlayerImages(): Promise<number> {
  console.log('── Step 1: Seed NYRB Player Images & Bios ──\n');

  // Fetch NYRB squad from SofaScore
  console.log('Fetching NYRB squad from SofaScore...');
  const squadData = await fetchSofaScore(`/team/${NYRB_SOFASCORE_ID}/players`);
  const sofaPlayers = (squadData.players || []).map((entry: any) => entry.player);
  console.log(`Found ${sofaPlayers.length} players in SofaScore squad.\n`);

  // Fetch our player_stats from Supabase for current season
  const dbPlayers = await querySupabase(
    'player_stats',
    'team=eq.New York Red Bulls&season=eq.2025&select=id,name'
  );
  console.log(`Found ${dbPlayers.length} NYRB players in player_stats (2025 season).\n`);

  let matched = 0;
  let skipped = 0;

  for (const sofaPlayer of sofaPlayers) {
    const sofaName = sofaPlayer.name || '';
    const sofaId = sofaPlayer.id;

    // Find matching player in our database
    const dbMatch = dbPlayers.find((db: any) => fuzzyMatch(sofaName, db.name));

    if (!dbMatch) {
      console.log(`  Skip: no DB match for "${sofaName}"`);
      skipped++;
      continue;
    }

    console.log(`  Match: "${sofaName}" -> "${dbMatch.name}" (id: ${dbMatch.id})`);

    // Construct image URL
    const imageUrl = `${SOFASCORE_BASE}/player/${sofaId}/image`;

    // Fetch detailed player info for bio data
    let playerDetails: any = {};
    try {
      const detailData = await fetchSofaScore(`/player/${sofaId}`);
      playerDetails = detailData.player || {};
    } catch (err: any) {
      console.warn(`    Warning: could not fetch details for ${sofaName}: ${err.message}`);
    }

    // Calculate age from dateOfBirthTimestamp
    let age: number | null = null;
    const dob = sofaPlayer.dateOfBirthTimestamp || playerDetails.dateOfBirthTimestamp;
    if (dob) {
      const birthDate = new Date(dob * 1000);
      const now = new Date();
      age = now.getFullYear() - birthDate.getFullYear();
      const monthDiff = now.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Build patch payload
    const patchData: any = {
      image_url: imageUrl,
      sofascore_id: sofaId,
    };

    const nationality = sofaPlayer.country?.name || playerDetails.country?.name;
    if (nationality) patchData.nationality = nationality;

    if (age !== null) patchData.age = age;

    const preferredFoot = sofaPlayer.preferredFoot || playerDetails.preferredFoot;
    if (preferredFoot) patchData.preferred_foot = preferredFoot;

    const heightCm = sofaPlayer.height || playerDetails.height;
    if (heightCm) patchData.height_cm = heightCm;

    const shirtNumber = sofaPlayer.shirtNumber ?? playerDetails.shirtNumber;
    if (shirtNumber !== undefined && shirtNumber !== null) patchData.shirt_number = shirtNumber;

    // Patch player_stats row
    await patchSupabase('player_stats', `id=eq.${dbMatch.id}`, patchData);
    matched++;

    console.log(`    Patched: image, sofascore_id=${sofaId}${nationality ? `, nationality=${nationality}` : ''}${age !== null ? `, age=${age}` : ''}`);

    // Rate limit: 1.5 seconds between player info fetches
    await delay(1500);
  }

  console.log(`\nStep 1 complete: ${matched} players updated, ${skipped} skipped.\n`);
  return matched;
}

// ── Step 2: Seed Team Logos ──────────────────────────────────

async function seedTeamLogos(): Promise<number> {
  console.log('── Step 2: Seed Team Logos ──\n');

  // Fetch all standings from Supabase
  const standings = await querySupabase(
    'standings',
    'select=id,team&order=season.desc'
  );
  console.log(`Found ${standings.length} standings rows.\n`);

  let patched = 0;
  let skipped = 0;

  for (const row of standings) {
    const teamName: string = row.team || '';
    let sofascoreTeamId: number | null = null;

    // Try exact match first
    if (MLS_TEAM_IDS[teamName]) {
      sofascoreTeamId = MLS_TEAM_IDS[teamName];
    } else {
      // Try substring match
      for (const [mlsName, mlsId] of Object.entries(MLS_TEAM_IDS)) {
        if (teamName.includes(mlsName) || mlsName.includes(teamName)) {
          sofascoreTeamId = mlsId;
          break;
        }
      }
    }

    if (!sofascoreTeamId) {
      console.log(`  Skip: no SofaScore ID for "${teamName}"`);
      skipped++;
      continue;
    }

    const logoUrl = `${SOFASCORE_BASE}/team/${sofascoreTeamId}/image`;

    await patchSupabase('standings', `id=eq.${row.id}`, {
      logo_url: logoUrl,
      sofascore_team_id: sofascoreTeamId,
    });

    console.log(`  Patched: "${teamName}" -> logo (team_id=${sofascoreTeamId})`);
    patched++;
  }

  console.log(`\nStep 2 complete: ${patched} standings updated, ${skipped} skipped.\n`);
  return patched;
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('═══ South Ward Signal — Seed Images & Logos ═══\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const playersUpdated = await seedPlayerImages();
  const logosUpdated = await seedTeamLogos();

  console.log('═══ Summary ═══');
  console.log(`Players updated: ${playersUpdated}`);
  console.log(`Team logos updated: ${logosUpdated}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
