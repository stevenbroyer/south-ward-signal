/**
 * FBref HTML Scraper
 *
 * Scrapes match reports, player season stats, and team stats from fbref.com.
 * Rate limited to 10 requests/minute per FBref's acceptable use policy.
 */

import * as cheerio from 'cheerio';
import PQueue from 'p-queue';
import type { PlayerStats, MatchStats } from '@sws/shared';
import { FBREF } from '@sws/shared';

// ─── Rate limiter: 10 requests per minute ──────────────────

const queue = new PQueue({
  intervalCap: FBREF.RATE_LIMIT_PER_MINUTE,
  interval: 60_000,
  carryoverConcurrencyCount: true,
});

// ─── HTTP transport with retry ─────────────────────────────

const MAX_RETRIES = 3;

async function fbrefFetch(urlPath: string): Promise<cheerio.CheerioAPI> {
  const url = urlPath.startsWith('http')
    ? urlPath
    : `${FBREF.BASE_URL}${urlPath}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = 2000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff + Math.random() * 1000));
    }

    try {
      const html = await queue.add(async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'SouthWardSignal/1.0 (sports analytics; contact@southwardsignal.com)',
            Accept: 'text/html',
          },
        });

        if (res.status === 429) {
          throw new Error('FBref rate limited (429)');
        }

        if (!res.ok) {
          throw new Error(`FBref ${res.status}: ${res.statusText}`);
        }

        return res.text();
      });

      if (!html) throw new Error('Empty response from FBref');
      return cheerio.load(html);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message.includes('404')) break;
    }
  }

  throw lastError || new Error('FBref request failed');
}

// ─── Public API ────────────────────────────────────────────

/**
 * Scrape a match report page and extract stats.
 *
 * @param matchUrl - Full FBref match URL or path like
 *   /matches/abc12345/Home-Team-Away-Team-Month-Day-Year-Major-League-Soccer
 */
export async function getMatchReport(
  matchUrl: string,
): Promise<{
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  stats: Partial<MatchStats>;
  playerStats: Array<{
    name: string;
    team: string;
    minutes: number;
    goals: number;
    assists: number;
    shots: number;
    shotsOnTarget: number;
    xg: number;
    xa: number;
    keyPasses: number;
    tackles: number;
    interceptions: number;
    passCompletion: number;
  }>;
}> {
  const $ = await fbrefFetch(matchUrl);

  // Parse team names from scorebox
  const scorebox = $('.scorebox');
  const teamNames = scorebox.find('[itemprop="name"]');
  const homeTeam = teamNames.eq(0).text().trim();
  const awayTeam = teamNames.eq(1).text().trim();

  // Parse scores
  const scores = scorebox.find('.score');
  const homeScore = parseInt(scores.eq(0).text().trim(), 10) || 0;
  const awayScore = parseInt(scores.eq(1).text().trim(), 10) || 0;

  // Parse team stats table
  const stats = parseTeamStats($);

  // Parse player stats from summary tables
  const playerStats = parsePlayerStats($, homeTeam, awayTeam);

  return { homeTeam, awayTeam, homeScore, awayScore, stats, playerStats };
}

/**
 * Scrape a player's season stats page.
 *
 * @param playerUrl - FBref player page URL
 */
export async function getPlayerSeasonStats(
  playerUrl: string,
  season?: string,
): Promise<PlayerStats | null> {
  const $ = await fbrefFetch(playerUrl);

  const playerName = $('h1 span').first().text().trim();
  if (!playerName) return null;

  // Find the standard stats table for the target season
  const targetSeason = season || `${new Date().getFullYear()}`;

  const statsTable = $('#stats_standard_dom_lg, #stats_standard_combined');
  if (statsTable.length === 0) return null;

  let targetRow: cheerio.Cheerio<cheerio.Element> | null = null;
  statsTable.find('tbody tr').each((_i, el) => {
    const row = $(el);
    const yearCell = row.find('th[data-stat="year_id"]').text().trim();
    if (yearCell.includes(targetSeason)) {
      targetRow = row;
    }
  });

  if (!targetRow) return null;
  const row = targetRow as cheerio.Cheerio<cheerio.Element>;

  const getNum = (stat: string): number => {
    const val = row.find(`td[data-stat="${stat}"]`).text().trim();
    return parseFloat(val) || 0;
  };

  return {
    name: playerName,
    team: row.find('td[data-stat="team_id"]').text().trim() || 'NYRB',
    position: row.find('td[data-stat="position"]').text().trim() || 'Unknown',
    games_played: getNum('games'),
    minutes: getNum('minutes'),
    goals: getNum('goals'),
    assists: getNum('assists'),
    xg: getNum('xg'),
    xa: getNum('xg_assist'),
    key_passes: getNum('assisted_shots'),
    pass_completion: getNum('passes_pct'),
  };
}

/**
 * Scrape team-level season stats from FBref.
 *
 * @param teamUrl - FBref team page URL, e.g.
 *   /squads/abc12345/New-York-Red-Bulls-Stats
 */
export async function getTeamStats(
  teamUrl: string,
): Promise<{
  teamName: string;
  stats: {
    games: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    xg: number;
    xga: number;
    possession: number;
  };
  topScorers: Array<{
    name: string;
    goals: number;
    assists: number;
    xg: number;
    minutes: number;
  }>;
}> {
  const $ = await fbrefFetch(teamUrl);

  const teamName = $('h1 span').first().text().trim();

  // Parse the overall record from the stats table header
  const recordText = $('div[data-template="Partials/Teams/record"]').text();
  const recordMatch = recordText.match(/(\d+)-(\d+)-(\d+)/);
  const wins = recordMatch ? parseInt(recordMatch[1], 10) : 0;
  const draws = recordMatch ? parseInt(recordMatch[2], 10) : 0;
  const losses = recordMatch ? parseInt(recordMatch[3], 10) : 0;

  // Standard stats table
  const standardTable = $('#stats_standard_combined, #stats_standard_dom_lg');
  const topScorers: Array<{
    name: string;
    goals: number;
    assists: number;
    xg: number;
    minutes: number;
  }> = [];

  let totalGoals = 0;
  let totalXg = 0;
  let totalMinutes = 0;

  standardTable.find('tbody tr:not(.thead)').each((_i, el) => {
    const row = $(el);
    const name = row.find('th[data-stat="player"] a').text().trim();
    if (!name) return;

    const goals = parseFloat(row.find('td[data-stat="goals"]').text()) || 0;
    const assists =
      parseFloat(row.find('td[data-stat="assists"]').text()) || 0;
    const xg = parseFloat(row.find('td[data-stat="xg"]').text()) || 0;
    const minutes =
      parseFloat(
        row.find('td[data-stat="minutes"]').text().replace(/,/g, ''),
      ) || 0;

    totalGoals += goals;
    totalXg += xg;
    totalMinutes += minutes;

    if (goals > 0 || assists > 0) {
      topScorers.push({ name, goals, assists, xg, minutes });
    }
  });

  topScorers.sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  // Defensive / against stats from opponent table
  const oppTable = $('#stats_standard_against');
  let goalsAgainst = 0;
  let xga = 0;

  if (oppTable.length > 0) {
    const footerRow = oppTable.find('tfoot tr').first();
    goalsAgainst =
      parseFloat(footerRow.find('td[data-stat="goals"]').text()) || 0;
    xga = parseFloat(footerRow.find('td[data-stat="xg"]').text()) || 0;
  }

  // Possession from misc table
  const miscTable = $('#stats_misc_combined, #stats_misc_dom_lg');
  let possession = 0;
  if (miscTable.length > 0) {
    const footerRow = miscTable.find('tfoot tr').first();
    possession =
      parseFloat(footerRow.find('td[data-stat="ball_recoveries"]').text()) || 0;
    // FBref doesn't directly list team possession in the misc table.
    // We may get it from the match report instead.
  }

  return {
    teamName: teamName || 'New York Red Bulls',
    stats: {
      games: wins + draws + losses,
      wins,
      draws,
      losses,
      goalsFor: totalGoals,
      goalsAgainst,
      xg: Math.round(totalXg * 100) / 100,
      xga: Math.round(xga * 100) / 100,
      possession,
    },
    topScorers: topScorers.slice(0, 10),
  };
}

// ─── Internal parsers ──────────────────────────────────────

function parseTeamStats($: cheerio.CheerioAPI): Partial<MatchStats> {
  const stats: Partial<MatchStats> = {};

  // FBref stores team stats in the #team_stats or #team_stats_extra div
  const teamStatsDiv = $('#team_stats');
  if (teamStatsDiv.length === 0) return stats;

  const rows = teamStatsDiv.find('tr');
  rows.each((_i, el) => {
    const row = $(el);
    const cells = row.find('td');
    if (cells.length < 2) return;

    const label = row.find('th').text().trim().toLowerCase();
    const homeVal = parseInt(cells.eq(0).text().trim().replace('%', ''), 10);
    const awayVal = parseInt(cells.eq(1).text().trim().replace('%', ''), 10);

    if (isNaN(homeVal) || isNaN(awayVal)) return;

    if (label.includes('possession')) {
      stats.possession = { home: homeVal, away: awayVal };
    } else if (label.includes('shots on target')) {
      stats.shots_on_target = { home: homeVal, away: awayVal };
    } else if (label === 'shots') {
      stats.shots = { home: homeVal, away: awayVal };
    } else if (label.includes('corner')) {
      stats.corners = { home: homeVal, away: awayVal };
    } else if (label.includes('foul')) {
      stats.fouls = { home: homeVal, away: awayVal };
    }
  });

  return stats;
}

function parsePlayerStats(
  $: cheerio.CheerioAPI,
  homeTeam: string,
  awayTeam: string,
): Array<{
  name: string;
  team: string;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  xa: number;
  keyPasses: number;
  tackles: number;
  interceptions: number;
  passCompletion: number;
}> {
  const players: Array<{
    name: string;
    team: string;
    minutes: number;
    goals: number;
    assists: number;
    shots: number;
    shotsOnTarget: number;
    xg: number;
    xa: number;
    keyPasses: number;
    tackles: number;
    interceptions: number;
    passCompletion: number;
  }> = [];

  // FBref has two summary tables, one per team
  const summaryTables = $('table[id^="stats_"]').filter((_i, el) => {
    const id = $(el).attr('id') || '';
    return id.includes('summary');
  });

  summaryTables.each((tableIdx, tableEl) => {
    const table = $(tableEl);
    const team = tableIdx === 0 ? homeTeam : awayTeam;

    table.find('tbody tr:not(.thead)').each((_i, rowEl) => {
      const row = $(rowEl);
      const name = row.find('th[data-stat="player"] a').text().trim();
      if (!name || name === 'Squad Total') return;

      const getNum = (stat: string): number => {
        const val = row.find(`td[data-stat="${stat}"]`).text().trim();
        return parseFloat(val) || 0;
      };

      players.push({
        name,
        team,
        minutes: getNum('minutes'),
        goals: getNum('goals'),
        assists: getNum('assists'),
        shots: getNum('shots'),
        shotsOnTarget: getNum('shots_on_target'),
        xg: getNum('xg'),
        xa: getNum('xg_assist'),
        keyPasses: getNum('assisted_shots'),
        tackles: getNum('tackles'),
        interceptions: getNum('interceptions'),
        passCompletion: getNum('passes_pct'),
      });
    });
  });

  return players;
}

/**
 * Search for a match report URL by team names and date.
 * Useful when you have fixture data but not the FBref URL.
 */
export async function findMatchReportUrl(
  homeTeam: string,
  awayTeam: string,
  date: string,
): Promise<string | null> {
  // FBref has a schedule page per season
  const year = date.slice(0, 4);
  const $ = await fbrefFetch(
    `/comps/22/${year}/schedule/${year}-Major-League-Soccer-Scores-and-Fixtures`,
  );

  const dateFormatted = date.slice(0, 10); // YYYY-MM-DD
  let matchUrl: string | null = null;

  $('table#sched_all tbody tr').each((_i, el) => {
    const row = $(el);
    const rowDate = row.find('td[data-stat="date"]').text().trim();
    const home = row.find('td[data-stat="home_team"] a').text().trim();
    const away = row.find('td[data-stat="away_team"] a').text().trim();

    if (
      rowDate === dateFormatted &&
      (home.includes(homeTeam) || homeTeam.includes(home)) &&
      (away.includes(awayTeam) || awayTeam.includes(away))
    ) {
      const link = row.find('td[data-stat="match_report"] a');
      if (link.length > 0) {
        matchUrl = link.attr('href') || null;
      }
    }
  });

  return matchUrl;
}
