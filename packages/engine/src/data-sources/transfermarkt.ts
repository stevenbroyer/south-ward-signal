/**
 * Transfermarkt Dataset Loader
 *
 * Loads transfer rumors, confirmed transfers, and market values for
 * NYRB and MLS from a structured dataset. Uses Supabase as the backing
 * store for cached Transfermarkt data, supplemented by CSV/JSON imports.
 *
 * NOTE: Transfermarkt does not offer a public API. This module loads data
 * from a curated dataset (manual import or community datasets like
 * transfermarkt-datasets on GitHub). The Supabase tables must be populated
 * by a separate ETL script (scripts/seed-data.ts).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────────────

export interface TransferRumor {
  id: string;
  player_name: string;
  player_age: number;
  player_position: string;
  player_nationality: string;
  current_club: string;
  current_league: string;
  linked_club: string;
  rumor_type: 'incoming' | 'outgoing';
  probability: 'low' | 'medium' | 'high' | 'confirmed';
  market_value_eur: number;
  fee_estimate_eur: number | null;
  source: string;
  source_tier: 1 | 2 | 3 | 4; // 1 = most reliable
  first_reported: string;
  last_updated: string;
  notes: string | null;
}

export interface ConfirmedTransfer {
  id: string;
  player_name: string;
  player_age: number;
  player_position: string;
  player_nationality: string;
  from_club: string;
  to_club: string;
  transfer_type: 'permanent' | 'loan' | 'free' | 'loan_return';
  fee_eur: number | null;
  contract_until: string | null;
  announced_date: string;
  official_date: string | null;
  season: string;
}

export interface PlayerMarketValue {
  player_name: string;
  player_id: string;
  team: string;
  position: string;
  age: number;
  nationality: string;
  market_value_eur: number;
  market_value_date: string;
  contract_expiry: string | null;
  value_trend: 'up' | 'down' | 'stable';
}

export interface TransferWindow {
  window: 'winter' | 'summer';
  year: number;
  transfers_in: ConfirmedTransfer[];
  transfers_out: ConfirmedTransfer[];
  net_spend_eur: number;
}

// ─── Supabase client ──────────────────────────────────────

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Transfermarkt data.',
    );
  }

  supabase = createClient(url, key);
  return supabase;
}

// ─── Public API ────────────────────────────────────────────

/**
 * Get all active transfer rumors linked to NYRB.
 */
export async function getNyrbRumors(): Promise<TransferRumor[]> {
  const sb = getSupabase();

  const { data: incoming, error: errIn } = await sb
    .from('transfer_rumors')
    .select('*')
    .eq('linked_club', 'New York Red Bulls')
    .eq('rumor_type', 'incoming')
    .neq('probability', 'confirmed')
    .order('last_updated', { ascending: false });

  if (errIn) throw new Error(`Supabase error fetching incoming rumors: ${errIn.message}`);

  const { data: outgoing, error: errOut } = await sb
    .from('transfer_rumors')
    .select('*')
    .or('current_club.eq.New York Red Bulls,current_club.eq.NY Red Bulls')
    .eq('rumor_type', 'outgoing')
    .neq('probability', 'confirmed')
    .order('last_updated', { ascending: false });

  if (errOut) throw new Error(`Supabase error fetching outgoing rumors: ${errOut.message}`);

  return [...(incoming || []), ...(outgoing || [])] as TransferRumor[];
}

/**
 * Get confirmed NYRB transfers for a given window/season.
 */
export async function getNyrbTransfers(
  season?: string,
): Promise<ConfirmedTransfer[]> {
  const sb = getSupabase();
  const targetSeason = season || String(new Date().getFullYear());

  const { data: transfersIn, error: errIn } = await sb
    .from('confirmed_transfers')
    .select('*')
    .eq('to_club', 'New York Red Bulls')
    .eq('season', targetSeason)
    .order('announced_date', { ascending: false });

  if (errIn) throw new Error(`Supabase error: ${errIn.message}`);

  const { data: transfersOut, error: errOut } = await sb
    .from('confirmed_transfers')
    .select('*')
    .eq('from_club', 'New York Red Bulls')
    .eq('season', targetSeason)
    .order('announced_date', { ascending: false });

  if (errOut) throw new Error(`Supabase error: ${errOut.message}`);

  return [
    ...(transfersIn || []),
    ...(transfersOut || []),
  ] as ConfirmedTransfer[];
}

/**
 * Get NYRB squad market values.
 */
export async function getSquadMarketValues(): Promise<PlayerMarketValue[]> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('player_market_values')
    .select('*')
    .or('team.eq.New York Red Bulls,team.eq.NY Red Bulls')
    .order('market_value_eur', { ascending: false });

  if (error) throw new Error(`Supabase error: ${error.message}`);

  return (data || []) as PlayerMarketValue[];
}

/**
 * Get a specific player's market value history.
 */
export async function getPlayerMarketValueHistory(
  playerName: string,
): Promise<PlayerMarketValue[]> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('player_market_values')
    .select('*')
    .ilike('player_name', `%${playerName}%`)
    .order('market_value_date', { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);

  return (data || []) as PlayerMarketValue[];
}

/**
 * Get MLS-wide transfer rumors for league context.
 */
export async function getMlsRumors(limit: number = 20): Promise<TransferRumor[]> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from('transfer_rumors')
    .select('*')
    .or('current_league.eq.MLS,linked_club.ilike.%MLS%')
    .neq('probability', 'confirmed')
    .order('last_updated', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  return (data || []) as TransferRumor[];
}

/**
 * Build a transfer window summary for NYRB.
 */
export async function buildTransferWindow(
  window: 'winter' | 'summer',
  year: number,
): Promise<TransferWindow> {
  const sb = getSupabase();
  const season = String(year);

  // Determine date range
  const dateRange =
    window === 'winter'
      ? { start: `${year}-01-01`, end: `${year}-04-01` }
      : { start: `${year}-07-01`, end: `${year}-09-30` };

  const { data: inData, error: errIn } = await sb
    .from('confirmed_transfers')
    .select('*')
    .eq('to_club', 'New York Red Bulls')
    .eq('season', season)
    .gte('announced_date', dateRange.start)
    .lte('announced_date', dateRange.end)
    .order('announced_date', { ascending: false });

  if (errIn) throw new Error(`Supabase error: ${errIn.message}`);

  const { data: outData, error: errOut } = await sb
    .from('confirmed_transfers')
    .select('*')
    .eq('from_club', 'New York Red Bulls')
    .eq('season', season)
    .gte('announced_date', dateRange.start)
    .lte('announced_date', dateRange.end)
    .order('announced_date', { ascending: false });

  if (errOut) throw new Error(`Supabase error: ${errOut.message}`);

  const transfersIn = (inData || []) as ConfirmedTransfer[];
  const transfersOut = (outData || []) as ConfirmedTransfer[];

  const spentTotal = transfersIn.reduce(
    (sum, t) => sum + (t.fee_eur || 0),
    0,
  );
  const receivedTotal = transfersOut.reduce(
    (sum, t) => sum + (t.fee_eur || 0),
    0,
  );

  return {
    window,
    year,
    transfers_in: transfersIn,
    transfers_out: transfersOut,
    net_spend_eur: spentTotal - receivedTotal,
  };
}

/**
 * Format a EUR value as a human-readable string.
 */
export function formatMarketValue(eurValue: number): string {
  if (eurValue >= 1_000_000) {
    return `\u20AC${(eurValue / 1_000_000).toFixed(1)}m`;
  }
  if (eurValue >= 1_000) {
    return `\u20AC${(eurValue / 1_000).toFixed(0)}k`;
  }
  return `\u20AC${eurValue}`;
}
