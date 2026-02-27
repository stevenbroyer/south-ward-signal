/**
 * Image URL helpers for player photos and team logos.
 * Sources: SofaScore (primary), ESPN (team logos fallback)
 */

const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1';

export function getPlayerImageUrl(sofascoreId: number): string {
  return `${SOFASCORE_BASE}/player/${sofascoreId}/image`;
}

export function getTeamImageUrl(sofascoreTeamId: number): string {
  return `${SOFASCORE_BASE}/team/${sofascoreTeamId}/image`;
}

export function getESPNTeamLogoUrl(espnTeamId: string | number): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${espnTeamId}.png`;
}

// Known SofaScore team IDs for common MLS teams
export const MLS_TEAM_SOFASCORE_IDS: Record<string, number> = {
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

export function getTeamLogoUrl(teamName: string): string | null {
  const id = MLS_TEAM_SOFASCORE_IDS[teamName];
  return id ? getTeamImageUrl(id) : null;
}
