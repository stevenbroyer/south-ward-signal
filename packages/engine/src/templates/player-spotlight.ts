/**
 * Player Spotlight Prompt Template
 *
 * Builds the user prompt for player spotlight / feature articles. Injects
 * the full PlayerStats payload, optional recent match context, and optional
 * league-average comparison data to support a deep-dive profile piece.
 *
 * Target length: 700-1000 words.
 *
 * @module templates/player-spotlight
 */

import type { PlayerStats, MatchData } from '@sws/shared';

/**
 * Formats the core statistical profile into a prompt-friendly block.
 */
function formatPlayerStats(player: PlayerStats): string {
  const lines: string[] = [
    `Name: ${player.name}`,
    `Team: ${player.team}`,
    `Position: ${player.position}`,
    `Games Played: ${player.games_played}`,
    `Minutes: ${player.minutes}`,
    `Goals: ${player.goals}`,
    `Assists: ${player.assists}`,
    `xG: ${player.xg.toFixed(2)}`,
    `xA: ${player.xa.toFixed(2)}`,
  ];

  if (player.goals_added !== undefined) lines.push(`Goals Added (g+): ${player.goals_added.toFixed(2)}`);
  if (player.key_passes !== undefined) lines.push(`Key Passes: ${player.key_passes}`);
  if (player.tackles_won !== undefined) lines.push(`Tackles Won: ${player.tackles_won}`);
  if (player.interceptions !== undefined) lines.push(`Interceptions: ${player.interceptions}`);
  if (player.aerial_duels_won !== undefined) lines.push(`Aerial Duels Won: ${player.aerial_duels_won}`);
  if (player.pass_completion !== undefined) lines.push(`Pass Completion: ${player.pass_completion}%`);

  return lines.map((l) => `  ${l}`).join('\n');
}

/**
 * Formats the league-average comparison into a prompt-friendly table.
 */
function formatComparison(player: PlayerStats, avg: Partial<PlayerStats>): string {
  const rows: string[] = [];

  const compare = (label: string, playerVal: number | undefined, avgVal: number | undefined, format: (n: number) => string = String) => {
    if (playerVal !== undefined && avgVal !== undefined) {
      const diff = playerVal - avgVal;
      const sign = diff >= 0 ? '+' : '';
      rows.push(`  ${label}: ${format(playerVal)} vs avg ${format(avgVal)} (${sign}${format(diff)})`);
    }
  };

  compare('Goals', player.goals, avg.goals);
  compare('Assists', player.assists, avg.assists);
  compare('xG', player.xg, avg.xg, (n) => n.toFixed(2));
  compare('xA', player.xa, avg.xa, (n) => n.toFixed(2));
  compare('Goals Added', player.goals_added, avg.goals_added, (n) => n.toFixed(2));
  compare('Key Passes', player.key_passes, avg.key_passes);
  compare('Tackles Won', player.tackles_won, avg.tackles_won);
  compare('Interceptions', player.interceptions, avg.interceptions);
  compare('Aerial Duels Won', player.aerial_duels_won, avg.aerial_duels_won);
  compare('Pass Completion', player.pass_completion, avg.pass_completion, (n) => `${n.toFixed(1)}%`);

  return rows.length > 0
    ? `Positional comparison (player vs ${player.position} league avg):\n${rows.join('\n')}`
    : 'No league average data available for comparison.';
}

/**
 * Summarizes recent match involvement for the player.
 */
function formatRecentMatches(player: PlayerStats, matches: MatchData[]): string {
  const entries = matches.map((m) => {
    const isHome = m.home_team === player.team;
    const opponent = isHome ? m.away_team : m.home_team;
    const teamScore = isHome ? m.home_score : m.away_score;
    const oppScore = isHome ? m.away_score : m.home_score;
    const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';

    // Find player's goals in this match
    const playerGoals = m.goals.filter((g) => g.player === player.name);
    const playerAssists = m.goals.filter((g) => g.assist === player.name);

    // Find player in lineup for rating/minutes
    const allPlayers = [...m.lineups.home, ...m.lineups.away];
    const lineupEntry = allPlayers.find((p) => p.name === player.name);

    let line = `  ${result} ${teamScore}-${oppScore} vs ${opponent} (${m.date})`;
    if (playerGoals.length > 0) line += ` | ${playerGoals.length} goal(s)`;
    if (playerAssists.length > 0) line += ` | ${playerAssists.length} assist(s)`;
    if (lineupEntry?.rating) line += ` | Rating: ${lineupEntry.rating}`;
    if (lineupEntry?.minutes_played) line += ` | ${lineupEntry.minutes_played} min`;

    return line;
  });

  return `Recent match involvement for ${player.name}:\n${entries.join('\n')}`;
}

/**
 * Builds the user prompt for a player spotlight article.
 *
 * @param player - The player's full statistical profile.
 * @param recentMatches - Optional array of recent MatchData to provide match-by-match
 *   context for the player's contributions.
 * @param leagueAvg - Optional partial PlayerStats representing the league average
 *   for the player's position, used for comparison.
 * @returns The fully assembled user prompt string to pair with the system prompt.
 *
 * @example
 * ```ts
 * const prompt = buildPlayerSpotlightPrompt(playerData, recentMatches, leagueAvgForPosition);
 * const response = await claude.send(systemPrompt, prompt);
 * ```
 */
export function buildPlayerSpotlightPrompt(
  player: PlayerStats,
  recentMatches?: MatchData[],
  leagueAvg?: Partial<PlayerStats>,
): string {
  // Derive per-90 metrics for context
  const nineties = player.minutes / 90;
  const goalsPer90 = nineties > 0 ? (player.goals / nineties).toFixed(2) : '0.00';
  const assistsPer90 = nineties > 0 ? (player.assists / nineties).toFixed(2) : '0.00';
  const xgPer90 = nineties > 0 ? (player.xg / nineties).toFixed(2) : '0.00';
  const xaPer90 = nineties > 0 ? (player.xa / nineties).toFixed(2) : '0.00';
  const gaPer90 = player.goals_added !== undefined && nineties > 0
    ? (player.goals_added / nineties).toFixed(2)
    : null;

  let prompt = `## CONTENT REQUEST: PLAYER SPOTLIGHT

Write a player spotlight feature article on **${player.name}**. Target length: **700-1000 words**.

---

### PLAYER STATISTICAL PROFILE

${formatPlayerStats(player)}

### PER-90 METRICS

  Goals/90: ${goalsPer90}
  Assists/90: ${assistsPer90}
  xG/90: ${xgPer90}
  xA/90: ${xaPer90}`;

  if (gaPer90) {
    prompt += `\n  Goals Added/90: ${gaPer90}`;
  }

  prompt += '\n';

  // Over/underperformance signals
  const xgDiff = player.goals - player.xg;
  const xaDiff = player.assists - player.xa;
  prompt += `\n### PERFORMANCE vs EXPECTED\n\n`;
  prompt += `  Goals vs xG: ${player.goals} goals on ${player.xg.toFixed(2)} xG (${xgDiff >= 0 ? '+' : ''}${xgDiff.toFixed(2)} overperformance)\n`;
  prompt += `  Assists vs xA: ${player.assists} assists on ${player.xa.toFixed(2)} xA (${xaDiff >= 0 ? '+' : ''}${xaDiff.toFixed(2)} overperformance)\n`;

  // League average comparison
  if (leagueAvg) {
    prompt += `\n### POSITIONAL COMPARISON (vs LEAGUE AVERAGE ${player.position.toUpperCase()})\n\n`;
    prompt += formatComparison(player, leagueAvg);
    prompt += '\n';
  }

  // Recent match context
  if (recentMatches && recentMatches.length > 0) {
    prompt += `\n### RECENT MATCH CONTEXT\n\n`;
    prompt += formatRecentMatches(player, recentMatches);
    prompt += '\n';
  }

  prompt += `
---

### ARTICLE STRUCTURE

Write the article with the following sections in order:

1. **Opening (Why This Player Matters Now)** -- Open with a specific moment, stat, or trend that makes this player worth writing about *right now*. This is not a generic bio. Ground it in current form, a recent performance, or a statistical inflection point.

2. **Statistical Profile** -- Deep-dive into the numbers. Break down goals, assists, xG, xA, and any advanced metrics available (goals added, key passes, tackles, interceptions, aerial duels, pass completion). Use per-90 figures to normalize for playing time. Highlight the most impressive or concerning trends.

3. **Tactical Role Breakdown** -- Explain what this player actually *does* on the pitch. How does their role fit the team's system? What are their responsibilities in and out of possession? Reference specific positional and statistical indicators.

4. **Comparison to Positional Average** -- ${leagueAvg ? 'Use the league average data provided to contextualize where this player ranks among peers at their position. Where do they significantly exceed or fall below the mean?' : 'Without league average data, provide qualitative context about how this player compares to typical expectations for their position in MLS based on the raw numbers provided.'}

5. **Outlook** -- What comes next? Is their current form sustainable (reference xG/xA over/underperformance)? What should fans watch for in upcoming matches? Is there a contract, transfer, or team-selection angle?

### SOCIAL CONTENT

After the article body, generate:
- **Twitter/X thread:** 4-5 tweets. Lead with the most eye-catching stat or claim. Include a "did you know" or comparison tweet.
- **TikTok caption:** Under 150 characters. Stat-hook format.
- **Instagram caption:** Storytelling format, 3-5 hashtags.
- **Bluesky thread:** 2-3 posts, 300 char limit each.

### REMINDERS

- Use the EXACT output format specified in the system prompt (TITLE, SLUG, EXCERPT, etc.).
- Every stat must come from the data above. Do not invent or estimate.
- Per-90 figures are pre-calculated above. Use them directly.
- xG/xA over/underperformance is a key narrative tool. If the player is significantly outperforming xG, flag it as potentially unsustainable. If underperforming, frame it as upside.
- If goals_added data is available, it is the single best holistic metric -- weight it appropriately.`;

  return prompt;
}
