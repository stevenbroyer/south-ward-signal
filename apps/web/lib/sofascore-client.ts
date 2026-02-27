/**
 * SofaScore API Client — server-side with Supabase caching (24h TTL)
 * Replaces FotMob client (FotMob locked down their API behind Cloudflare Turnstile)
 *
 * Provides: match details, player ratings, events/incidents, match statistics
 * NYRB SofaScore ID: 2506 | MLS Tournament: 242
 *
 * Note: SofaScore blocks curl but works fine from Node.js fetch
 */

import { createClient } from '@supabase/supabase-js';

const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1';
const CACHE_TTL_HOURS = 24;

const NYRB_SOFASCORE_ID = 2506;
const MLS_TOURNAMENT_ID = 242;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchSofaScore<T>(path: string): Promise<T> {
  const res = await fetch(`${SOFASCORE_BASE}${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`SofaScore API ${res.status}: ${path}`);
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

export interface SofaScoreEvent {
  id: number;
  homeTeam: { name: string; id: number; slug: string };
  awayTeam: { name: string; id: number; slug: string };
  homeScore: { current: number; period1: number; period2: number };
  awayScore: { current: number; period1: number; period2: number };
  startTimestamp: number;
  status: { type: string; description: string };
  tournament: { name: string; uniqueTournament: { id: number } };
  roundInfo?: { round: number };
}

export interface SofaScoreIncident {
  incidentType: string; // 'goal' | 'card' | 'substitution' | 'period' | 'injuryTime'
  time: number;
  addedTime?: number;
  player?: { name: string; id: number; shortName: string };
  playerIn?: { name: string; id: number };
  playerOut?: { name: string; id: number };
  isHome: boolean;
  incidentClass?: string; // 'regular' | 'penalty' | 'ownGoal' | 'yellow' | 'yellowRed' | 'red'
  description?: string;
  assist1?: { name: string; id: number };
}

export interface SofaScorePlayerStats {
  player: { name: string; id: number; shortName: string; position: string; shirtNumber: number };
  shirtNumber: number;
  position: string;
  substitute: boolean;
  statistics: {
    rating?: number;
    minutesPlayed?: number;
    goals?: number;
    assists?: number;
    totalPass?: number;
    accuratePass?: number;
    totalShots?: number;
    shotsOnTarget?: number;
    keyPass?: number;
    totalTackle?: number;
    interceptionWon?: number;
    totalClearance?: number;
    duelWon?: number;
    duelLost?: number;
    saves?: number;
    goalsPrevented?: number;
    touches?: number;
    expectedGoals?: number;
    expectedAssists?: number;
    [key: string]: unknown;
  };
}

export interface SofaScoreLineup {
  confirmed: boolean;
  home: {
    players: SofaScorePlayerStats[];
    formation: string;
    playerColor: { primary: string; number: string; outline: string };
  };
  away: {
    players: SofaScorePlayerStats[];
    formation: string;
    playerColor: { primary: string; number: string; outline: string };
  };
}

export interface SofaScoreStatGroup {
  groupName: string;
  statisticsItems: Array<{
    name: string;
    home: string;
    away: string;
    compareCode: number;
    statisticsType: string;
    valueType: string;
  }>;
}

export interface SofaScoreMatchStatistics {
  statistics: Array<{
    period: string;
    groups: SofaScoreStatGroup[];
  }>;
}

// ── API Functions ────────────────────────────────────────────────

export async function getMatchDetail(eventId: string | number) {
  return cachedFetch(`sofascore:event:${eventId}`, () =>
    fetchSofaScore<SofaScoreEvent>(`/event/${eventId}`)
  );
}

export async function getMatchLineups(eventId: string | number) {
  return cachedFetch(`sofascore:lineups:${eventId}`, () =>
    fetchSofaScore<SofaScoreLineup>(`/event/${eventId}/lineups`)
  );
}

export async function getMatchIncidents(eventId: string | number) {
  return cachedFetch(`sofascore:incidents:${eventId}`, () =>
    fetchSofaScore<{ incidents: SofaScoreIncident[] }>(`/event/${eventId}/incidents`)
  );
}

export async function getMatchStatistics(eventId: string | number) {
  return cachedFetch(`sofascore:statistics:${eventId}`, () =>
    fetchSofaScore<SofaScoreMatchStatistics>(`/event/${eventId}/statistics`)
  );
}

export async function getBestPlayers(eventId: string | number) {
  return cachedFetch(`sofascore:best-players:${eventId}`, () =>
    fetchSofaScore<{ bestHomeTeamPlayer: any; bestAwayTeamPlayer: any }>(`/event/${eventId}/best-players`)
  );
}

export async function getTeamRecentMatches(teamId = NYRB_SOFASCORE_ID, page = 0) {
  return cachedFetch(`sofascore:team-last:${teamId}:${page}`, () =>
    fetchSofaScore<{ events: SofaScoreEvent[] }>(`/team/${teamId}/events/last/${page}`)
  );
}

export async function getTeamNextMatches(teamId = NYRB_SOFASCORE_ID, page = 0) {
  return cachedFetch(`sofascore:team-next:${teamId}:${page}`, () =>
    fetchSofaScore<{ events: SofaScoreEvent[] }>(`/team/${teamId}/events/next/${page}`)
  );
}

export async function getTeamPlayers(teamId = NYRB_SOFASCORE_ID) {
  return cachedFetch(`sofascore:squad:${teamId}`, () =>
    fetchSofaScore<{ players: Array<{ player: any }> }>(`/team/${teamId}/players`)
  );
}

export async function getMLSStandings(seasonId: number) {
  return fetchSofaScore<{ standings: any[] }>(`/unique-tournament/${MLS_TOURNAMENT_ID}/season/${seasonId}/standings/total`);
}

export async function getMLSSeasons() {
  return fetchSofaScore<{ seasons: Array<{ id: number; name: string; year: string }> }>(`/unique-tournament/${MLS_TOURNAMENT_ID}/seasons`);
}

// ── Helper extractors ────────────────────────────────────────────

export function extractPlayerRatings(lineups: SofaScoreLineup): Array<{
  name: string;
  rating: number;
  position: string;
  isHome: boolean;
  shirt: number;
  minutesPlayed: number;
}> {
  const ratings: Array<{
    name: string;
    rating: number;
    position: string;
    isHome: boolean;
    shirt: number;
    minutesPlayed: number;
  }> = [];

  for (const side of [
    { players: lineups.home.players, isHome: true },
    { players: lineups.away.players, isHome: false },
  ]) {
    for (const p of side.players) {
      if (p.statistics?.rating) {
        ratings.push({
          name: p.player.name,
          rating: p.statistics.rating,
          position: p.position || p.player.position,
          isHome: side.isHome,
          shirt: p.shirtNumber,
          minutesPlayed: p.statistics.minutesPlayed || 0,
        });
      }
    }
  }

  return ratings;
}

export function extractEvents(data: { incidents: SofaScoreIncident[] }): SofaScoreIncident[] {
  return (data.incidents || []).filter(
    (i) => i.incidentType === 'goal' || i.incidentType === 'card' || i.incidentType === 'substitution'
  );
}

// ── New API Functions ───────────────────────────────────────────

export interface SofaScoreShotmapShot {
  player: { name: string; id: number };
  isHome: boolean;
  shotType: string;
  bodyPart: string;
  goalMouthLocation?: string;
  xg?: number;
  playerCoordinates: { x: number; y: number; z?: number };
  draw?: { start: { x: number; y: number }; end: { x: number; y: number } };
  time: number;
  addedTime?: number;
  situation?: string;
  reversedPeriodTime?: number;
}

export interface SofaScoreGraphPoint {
  minute: number;
  value: number;
}

export interface SofaScoreAveragePosition {
  player: { name: string; id: number; shirtNumber: number };
  averageX: number;
  averageY: number;
  pointsCount: number;
}

export interface SofaScorePlayerInfo {
  player: {
    name: string;
    id: number;
    dateOfBirthTimestamp?: number;
    country?: { name: string; alpha2: string };
    preferredFoot?: string;
    height?: number;
    shirtNumber?: number;
    position?: string;
    team?: { name: string; id: number };
  };
}

export interface SofaScoreH2H {
  teamDuel: {
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  managerDuel?: {
    homeManagerName: string;
    awayManagerName: string;
  };
  events: SofaScoreEvent[];
}

export async function getMatchShotmap(eventId: string | number) {
  return cachedFetch(`sofascore:shotmap:${eventId}`, () =>
    fetchSofaScore<{ shotmap: SofaScoreShotmapShot[] }>(`/event/${eventId}/shotmap`)
  );
}

export async function getMatchGraph(eventId: string | number) {
  return cachedFetch(`sofascore:graph:${eventId}`, () =>
    fetchSofaScore<{ graphPoints: SofaScoreGraphPoint[] }>(`/event/${eventId}/graph`)
  );
}

export async function getMatchAveragePositions(eventId: string | number) {
  return cachedFetch(`sofascore:avg-positions:${eventId}`, () =>
    fetchSofaScore<{ home: SofaScoreAveragePosition[]; away: SofaScoreAveragePosition[] }>(
      `/event/${eventId}/average-positions`
    )
  );
}

export async function getPlayerInfo(playerId: string | number) {
  return cachedFetch(`sofascore:player:${playerId}`, () =>
    fetchSofaScore<SofaScorePlayerInfo>(`/player/${playerId}`)
  );
}

export async function getH2H(eventId: string | number) {
  return cachedFetch(`sofascore:h2h:${eventId}`, () =>
    fetchSofaScore<SofaScoreH2H>(`/event/${eventId}/h2h`)
  );
}

export async function getMLSTopPlayers(seasonId: number, position?: string) {
  const posParam = position ? `&position=${position}` : '';
  return fetchSofaScore<{ results: Array<{ player: any; statistics: any }> }>(
    `/unique-tournament/${MLS_TOURNAMENT_ID}/season/${seasonId}/top-players/overall${posParam}`
  );
}

export { NYRB_SOFASCORE_ID, MLS_TOURNAMENT_ID };
