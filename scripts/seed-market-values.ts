/**
 * South Ward Signal — Transfermarkt Market Values & Transfers
 *
 * Fetches player market value history and transfer records
 * from the Transfermarkt community API for the NYRB squad,
 * then stores them in Supabase.
 *
 * Usage: npx tsx scripts/seed-market-values.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TM_BASE = "https://transfermarkt-api.fly.dev";
const NYRB_TM_ID = 1536; // NYRB Transfermarkt club ID

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function upsertSupabase(table: string, records: any[], conflictColumn = "id") {
  if (!records.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
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

// ---------------------------------------------------------------------------
// Date & fee formatting
// ---------------------------------------------------------------------------

function parseTMDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function formatFee(fee: any): string {
  if (!fee || !fee.value) return "Free";
  if (fee.value === 0) return "Free";
  const m = fee.value / 1000000;
  if (m >= 1) return `€${m.toFixed(1)}m`;
  const k = fee.value / 1000;
  return `€${k.toFixed(0)}k`;
}

// ---------------------------------------------------------------------------
// Per-player processing
// ---------------------------------------------------------------------------

interface PlayerRef {
  id: number;
  name: string;
}

async function processPlayerMarketValues(player: PlayerRef): Promise<any[]> {
  const data = await fetchJSON(`${TM_BASE}/players/${player.id}/market_value`);
  const history: any[] = data.marketValueHistory || [];

  const records: any[] = [];
  for (const entry of history) {
    const date = parseTMDate(entry.date);
    if (!date) continue;

    records.push({
      player_name: player.name,
      team: entry.clubName || null,
      date,
      value_eur: entry.value || 0,
      transfermarkt_id: player.id,
    });
  }

  return records;
}

async function processPlayerTransfers(player: PlayerRef): Promise<any[]> {
  const data = await fetchJSON(`${TM_BASE}/players/${player.id}/transfers`);
  const transfers: any[] = data.transfers || [];

  const records: any[] = [];
  for (const t of transfers) {
    const transferDate = parseTMDate(t.date);

    records.push({
      player_name: player.name,
      from_club: t.from?.clubName || null,
      to_club: t.to?.clubName || null,
      transfer_date: transferDate,
      fee_eur: t.fee?.value ?? null,
      fee_text: formatFee(t.fee),
      season: t.season || null,
      transfermarkt_id: player.id,
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("═══ South Ward Signal — Transfermarkt Market Values & Transfers ═══\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase not configured.");
    process.exit(1);
  }

  // 1. Fetch NYRB squad
  console.log(`Fetching NYRB squad (TM ID: ${NYRB_TM_ID})...`);
  const squadData = await fetchJSON(`${TM_BASE}/clubs/${NYRB_TM_ID}/players`);
  const players: any[] = squadData.players || [];
  console.log(`Found ${players.length} players in squad.\n`);

  if (!players.length) {
    console.error("No players found. Check the club ID or API availability.");
    process.exit(1);
  }

  let totalMarketValues = 0;
  let totalTransfers = 0;
  let processedCount = 0;
  let errorCount = 0;

  // 2. Process each player
  for (const p of players) {
    const player: PlayerRef = { id: p.id, name: p.name };
    console.log(`[${processedCount + 1}/${players.length}] ${player.name} (ID: ${player.id})`);

    try {
      // a. Market value history
      const mvRecords = await processPlayerMarketValues(player);
      if (mvRecords.length) {
        await upsertSupabase("player_market_values", mvRecords);
        totalMarketValues += mvRecords.length;
        console.log(`  Market values: ${mvRecords.length} entries`);
      } else {
        console.log("  Market values: none");
      }

      await delay(2000);

      // b. Transfer history
      const trRecords = await processPlayerTransfers(player);
      if (trRecords.length) {
        await upsertSupabase("player_transfers", trRecords);
        totalTransfers += trRecords.length;
        console.log(`  Transfers: ${trRecords.length} entries`);
      } else {
        console.log("  Transfers: none");
      }

      processedCount++;
    } catch (err: any) {
      errorCount++;
      console.error(`  Error: ${err.message}`);
    }

    // Rate limiting — 2s between players
    await delay(2000);
  }

  // 3. Summary
  console.log("\n═══ Summary ═══");
  console.log(`Players processed: ${processedCount}/${players.length}`);
  console.log(`Market value entries: ${totalMarketValues}`);
  console.log(`Transfer entries: ${totalTransfers}`);
  if (errorCount) console.log(`Errors: ${errorCount}`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
