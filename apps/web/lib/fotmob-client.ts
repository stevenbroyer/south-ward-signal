/**
 * FotMob API Client — server-side with Supabase caching (24h TTL)
 * Unofficial API at fotmob.com/api
 * Provides match details, player ratings, momentum, lineups, team stats
 */

import { createClient } from '@supabase/supabase-js';

const FOTMOB_BASE = 'https://www.fotmob.com/api';
const CACHE_TTL_HOURS = 24;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchFotMob<T>(path: string): Promise<T> {
  const res = await fetch(`${FOTMOB_BASE}${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) throw new Error(`FotMob API ${res.status}: ${path}`);
  return res.json();
}

async function cachedFetch<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  const supabase = getAdminClient();

  if (supabase) {
    const { data: cached } = await supabase
      .from('fotmob_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return cached.data as T;
    }
  }

  const data = await fetcher();

  if (supabase) {
    await supabase.from('fotmob_cache').upsert({
      cache_key: cacheKey,
      data,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    });
  }

  return data;
}

// ── Types ────────────────────────────────────────────────────────

export interface FotMobMatchDetail {
  general: {
    matchId: string;
    matchTimeUTCDate: string;
    homeTeam: { name: string; id: number };
    awayTeam: { name: string; id: number };
    matchRound?: string;
  };
  header: {
    teams: Array<{
      name: string;
      id: number;
      score: number;
      imageUrl: string;
    }>;
    status: { finished: boolean; started: boolean };
  };
  content?: {
    matchFacts?: {
      events?: FotMobEvent[];
      momentum?: FotMobMomentum;
      playerOfTheMatch?: { name: string; rating: string };
      infoBox?: Record<string, unknown>;
    };
    stats?: {
      Ede: Array<{
        title: string;
        stats: Array<{
          title: string;
          stats: [string, string];
          type: string;
          highlighted: string;
        }>;
      }>;
    };
    lineup?: {
      homeTeam?: FotMobLineup;
      awayTeam?: FotMobLineup;
    };
  };
}

export interface FotMobEvent {
  type: string;
  time: number;
  overloadTime?: number;
  player?: { name: string; id: number };
  assistPlayer?: { name: string; id: number };
  team?: string;
  isHome?: boolean;
  card?: string;
  swap?: Array<{ name: string; id: number }>;
}

export interface FotMobMomentum {
  main: {
    data: Array<{ minute: number; value: number }>;
  };
}

export interface FotMobLineup {
  players: Array<Array<{
    name: string;
    id: number;
    shirt: number;
    positionStringShort: string;
    rating?: { num: string };
    stats?: Record<string, unknown>;
    timeSubbedOn?: number;
    timeSubbedOff?: number;
    events?: Record<string, unknown>;
  }>>;
  coach?: { name: string; id: number };
}

export interface FotMobTeamOverview {
  name: string;
  id: number;
  overview?: {
    table?: Array<{
      data: {
        table: {
          all: Array<{
            name: string;
            id: number;
            played: number;
            wins: number;
            draws: number;
            losses: number;
            scoresStr: string;
            goalConDiff: number;
            pts: number;
            idx: number;
          }>;
        };
      };
    }>;
  };
  squad?: Array<{
    title: string;
    members: Array<{
      id: number;
      name: string;
      role: string;
    }>;
  }>;
}

// ── API Functions ────────────────────────────────────────────────

const NYRB_FOTMOB_ID = 7293; // FotMob team ID for NYRB

export async function getMatchDetail(matchId: string): Promise<FotMobMatchDetail> {
  return cachedFetch(`match:${matchId}`, () =>
    fetchFotMob(`/matchDetails?matchId=${matchId}`)
  );
}

export async function getTeamOverview(teamId = NYRB_FOTMOB_ID): Promise<FotMobTeamOverview> {
  return cachedFetch(`team:${teamId}`, () =>
    fetchFotMob(`/teams?id=${teamId}`)
  );
}

export async function getTeamFixtures(teamId = NYRB_FOTMOB_ID, season: string): Promise<unknown> {
  return cachedFetch(`fixtures:${teamId}:${season}`, () =>
    fetchFotMob(`/teams?id=${teamId}&tab=fixtures&season=${season}`)
  );
}

export function extractPlayerRatings(detail: FotMobMatchDetail): Array<{
  name: string;
  rating: number;
  position: string;
  isHome: boolean;
  shirt: number;
}> {
  const ratings: Array<{
    name: string;
    rating: number;
    position: string;
    isHome: boolean;
    shirt: number;
  }> = [];

  const lineups = [
    { lineup: detail.content?.lineup?.homeTeam, isHome: true },
    { lineup: detail.content?.lineup?.awayTeam, isHome: false },
  ];

  for (const { lineup, isHome } of lineups) {
    if (!lineup?.players) continue;
    for (const row of lineup.players) {
      for (const player of row) {
        if (player.rating?.num) {
          ratings.push({
            name: player.name,
            rating: parseFloat(player.rating.num),
            position: player.positionStringShort,
            isHome,
            shirt: player.shirt,
          });
        }
      }
    }
  }

  return ratings;
}

export function extractMomentum(detail: FotMobMatchDetail): Array<{ minute: number; value: number }> {
  return detail.content?.matchFacts?.momentum?.main?.data || [];
}

export function extractEvents(detail: FotMobMatchDetail): FotMobEvent[] {
  return detail.content?.matchFacts?.events || [];
}

export { NYRB_FOTMOB_ID };
