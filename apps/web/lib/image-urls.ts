/**
 * Image URL helpers for player photos and team logos.
 * Primary source: SportMonks CDN (reliable, same as our data source)
 */

const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1';

export function getPlayerImageUrl(sofascoreId: number): string {
  return `${SOFASCORE_BASE}/player/${sofascoreId}/image`;
}

export function getESPNTeamLogoUrl(espnTeamId: string | number): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${espnTeamId}.png`;
}

/** SportMonks team IDs — maps team names (full + short) to SM IDs */
export const MLS_TEAM_IDS: Record<string, number> = {
  'Red Bull New York': 383,
  'New York Red Bulls': 383,
  'New York RB': 383,
  'RBNY': 383,
  'New York City FC': 3627,
  'New York City': 3627,
  'NYCFC': 3627,
  'Inter Miami CF': 239235,
  'Inter Miami': 239235,
  'FC Cincinnati': 3636,
  'Cincinnati': 3636,
  'Columbus Crew': 577,
  'Charlotte FC': 260119,
  'Charlotte': 260119,
  'Orlando City SC': 204,
  'Orlando City': 204,
  'Philadelphia Union': 275,
  'Atlanta United FC': 3645,
  'Atlanta United': 3645,
  'Nashville SC': 148048,
  'CF Montréal': 3736,
  'CF Montreal': 3736,
  'D.C. United': 182,
  'DC United': 182,
  'Toronto FC': 111,
  'Toronto': 111,
  'New England Revolution': 641,
  'New England': 641,
  'Chicago Fire FC': 75,
  'Chicago Fire': 75,
  'Los Angeles FC': 81832,
  'LAFC': 81832,
  'LA Galaxy': 413,
  'Los Angeles Galaxy': 413,
  'Seattle Sounders FC': 2649,
  'Seattle Sounders': 2649,
  'Portland Timbers': 607,
  'Real Salt Lake': 1062,
  'Minnesota United FC': 3639,
  'Minnesota United': 3639,
  'Colorado Rapids': 179,
  'FC Dallas': 583,
  'Dallas': 583,
  'Austin FC': 254172,
  'Austin': 254172,
  'Houston Dynamo FC': 478,
  'Houston Dynamo': 478,
  'San Jose Earthquakes': 287,
  'SJ Earthquakes': 287,
  'Sporting Kansas City': 323,
  'Sporting KC': 323,
  'Vancouver Whitecaps FC': 292,
  'Vancouver Whitecaps': 292,
  'St. Louis City SC': 267299,
  'St. Louis City': 267299,
  'San Diego FC': 275650,
  'San Diego': 275650,
};

/** Get SportMonks CDN logo URL from team ID */
export function smLogoUrl(teamId: number): string {
  return `https://cdn.sportmonks.com/images/soccer/teams/${teamId % 32}/${teamId}.png`;
}

/** Get team logo URL by name (SportMonks CDN) */
export function getTeamLogoUrl(teamName: string): string | null {
  const id = MLS_TEAM_IDS[teamName];
  return id ? smLogoUrl(id) : null;
}

/** Try to find two MLS team names in a string (e.g. article title).
 *  Returns [home, away] team names sorted by position in the string,
 *  or null if fewer than two teams are found. */
export function extractTeamsFromTitle(title: string): [string, string] | null {
  // Match against known team names, longest first to avoid partial matches
  const names = Object.keys(MLS_TEAM_IDS).sort((a, b) => b.length - a.length);
  const found: { name: string; index: number }[] = [];
  const titleLower = title.toLowerCase();

  for (const name of names) {
    const idx = titleLower.indexOf(name.toLowerCase());
    if (idx !== -1) {
      // Skip if we already have a match at or near this position (longer name already matched)
      const isDuplicate = found.some(
        (f) => Math.abs(f.index - idx) < 3 || MLS_TEAM_IDS[f.name] === MLS_TEAM_IDS[name]
      );
      if (!isDuplicate) {
        found.push({ name, index: idx });
      }
    }
    if (found.length >= 2) break;
  }

  if (found.length < 2) return null;
  found.sort((a, b) => a.index - b.index);
  return [found[0].name, found[1].name];
}
