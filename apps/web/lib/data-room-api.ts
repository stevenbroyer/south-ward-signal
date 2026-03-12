/**
 * Data Room — Client-side Fetch Functions
 * Used by TanStack Query for instant client-side filtering
 * without full page reloads.
 */

export interface MatchFilters {
  season?: number;
  result?: string;
  home?: string; // 'true' | 'false' | ''
}

export interface PlayerFilters {
  season?: number;
  position?: string;
  sort?: string;
}

export async function fetchMatches(params: MatchFilters) {
  const searchParams = new URLSearchParams();
  if (params.season) searchParams.set('season', String(params.season));
  if (params.result) searchParams.set('result', params.result);
  if (params.home) searchParams.set('home', params.home);

  const res = await fetch(`/api/data-room/matches?${searchParams.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPlayers(params: PlayerFilters) {
  const searchParams = new URLSearchParams();
  if (params.season) searchParams.set('season', String(params.season));
  if (params.position && params.position !== 'all') searchParams.set('position', params.position);
  if (params.sort) searchParams.set('sort', params.sort);

  const res = await fetch(`/api/data-room/players?${searchParams.toString()}`);
  if (!res.ok) return [];
  return res.json();
}
