/**
 * Power Rankings Prompt Template
 *
 * Builds the user prompt for weekly Eastern Conference power rankings.
 * Accepts the full standings array, the week number, and optionally
 * the previous week's rankings to compute movement indicators.
 *
 * Target length: 400-600 words. Covers all 14 Eastern Conference teams
 * with 1-2 sentences each; NYRB gets 3-4 sentences.
 *
 * @module templates/power-rankings
 */

import type { Standing } from '@sws/shared';

/**
 * Formats a single standing entry with full context.
 */
function formatStandingRow(s: Standing): string {
  const form = s.form.slice(-5).join('');
  const ppg = s.games_played > 0 ? (s.points / s.games_played).toFixed(2) : '0.00';
  return `  ${s.position}. ${s.team} | ${s.points}pts | ${s.wins}W-${s.draws}D-${s.losses}L | GF: ${s.goals_for} GA: ${s.goals_against} GD: ${s.goal_difference >= 0 ? '+' : ''}${s.goal_difference} | PPG: ${ppg} | Form: ${form} | GP: ${s.games_played}`;
}

/**
 * Computes movement indicators for each team compared to previous rankings.
 */
function computeMovement(
  standings: Standing[],
  previousRankings: Array<{ team: string; rank: number }>,
): Map<string, { direction: 'up' | 'down' | 'same' | 'new'; change: number }> {
  const prevMap = new Map(previousRankings.map((r) => [r.team, r.rank]));
  const movements = new Map<string, { direction: 'up' | 'down' | 'same' | 'new'; change: number }>();

  standings.forEach((s, index) => {
    const currentRank = index + 1;
    const prevRank = prevMap.get(s.team);

    if (prevRank === undefined) {
      movements.set(s.team, { direction: 'new', change: 0 });
    } else if (prevRank > currentRank) {
      movements.set(s.team, { direction: 'up', change: prevRank - currentRank });
    } else if (prevRank < currentRank) {
      movements.set(s.team, { direction: 'down', change: currentRank - prevRank });
    } else {
      movements.set(s.team, { direction: 'same', change: 0 });
    }
  });

  return movements;
}

/**
 * Formats the movement legend for the prompt.
 */
function formatMovementBlock(
  standings: Standing[],
  movements: Map<string, { direction: 'up' | 'down' | 'same' | 'new'; change: number }>,
): string {
  return standings
    .map((s, index) => {
      const rank = index + 1;
      const mov = movements.get(s.team);
      let indicator = '';
      if (mov) {
        switch (mov.direction) {
          case 'up':
            indicator = ` [UP ${mov.change}]`;
            break;
          case 'down':
            indicator = ` [DOWN ${mov.change}]`;
            break;
          case 'new':
            indicator = ` [NEW]`;
            break;
          case 'same':
            indicator = ` [--]`;
            break;
        }
      }
      return `  ${rank}. ${s.team}${indicator}`;
    })
    .join('\n');
}

/**
 * Builds the user prompt for a weekly power rankings article.
 *
 * @param standings - Full Eastern Conference standings sorted by position.
 * @param week - The MLS week number for this edition.
 * @param previousRankings - Optional previous week's rankings for computing
 *   movement indicators (up/down/new).
 * @returns The fully assembled user prompt string to pair with the system prompt.
 *
 * @example
 * ```ts
 * const prompt = buildPowerRankingsPrompt(standings, 8, lastWeekRankings);
 * const response = await claude.send(systemPrompt, prompt);
 * ```
 */
export function buildPowerRankingsPrompt(
  standings: Standing[],
  week: number,
  previousRankings?: Array<{ team: string; rank: number }>,
): string {
  // Sort by position for display, but the AI will rank independently
  const sorted = [...standings].sort((a, b) => a.position - b.position);

  let prompt = `## CONTENT REQUEST: EASTERN CONFERENCE POWER RANKINGS -- WEEK ${week}

Write the Week ${week} Eastern Conference Power Rankings. Target length: **400-600 words**.

This is an opinionated ranking -- you are not required to follow the league standings order exactly. Use the data to inform your own assessment of team quality, trajectory, and form.

---

### EASTERN CONFERENCE STANDINGS (Week ${week})

${sorted.map(formatStandingRow).join('\n')}
`;

  if (previousRankings && previousRankings.length > 0) {
    const movements = computeMovement(sorted, previousRankings);
    prompt += `\n### PREVIOUS RANKINGS & MOVEMENT\n\n`;
    prompt += `Last week's rankings are provided below. Use the movement indicators (UP/DOWN/NEW/--) in your writeup to show rank changes. Include the movement direction next to each team's entry.\n\n`;
    prompt += formatMovementBlock(sorted, movements);
    prompt += '\n';
  } else {
    prompt += `\n### MOVEMENT\n\nNo previous rankings are available (this may be the first edition of the season). Do not include movement indicators.\n`;
  }

  // Identify NYRB in standings for emphasis
  const nyrb = sorted.find(
    (s) => s.team.includes('Red Bull') || s.team.includes('NYRB') || s.team === 'New York Red Bulls',
  );

  if (nyrb) {
    prompt += `\n### NYRB DETAIL (for expanded entry)\n\n`;
    prompt += `The New York Red Bulls entry should be the LONGEST in the rankings (3-4 sentences). Here is their detailed data for reference:\n`;
    prompt += `${formatStandingRow(nyrb)}\n`;
  }

  prompt += `
---

### ARTICLE STRUCTURE

1. **Brief intro (2-3 sentences)** -- Set the scene for Week ${week}. What was the biggest story of the week across the conference? What moved the needle?

2. **Rankings (1 through ${sorted.length})** -- Rank every Eastern Conference team from 1 to ${sorted.length}. For each team:
   - Include the team name, current record, and points.${previousRankings ? '\n   - Include movement indicator (e.g., "UP 2", "DOWN 1", "NEW", "--").' : ''}
   - Write **1-2 sentences** explaining their current form, trajectory, or key storyline.
   - **EXCEPTION: The New York Red Bulls entry must be 3-4 sentences.** Go deeper on NYRB -- reference specific stats, upcoming fixtures, tactical trends, or player form.

3. **No conclusion needed** -- The rankings speak for themselves. End after the last team.

### SOCIAL CONTENT

After the article body, generate:
- **Twitter/X thread:** 4-5 tweets. Open with "Week ${week} Eastern Conference Power Rankings are out." Highlight top 3, biggest riser, biggest faller, and NYRB placement.
- **TikTok caption:** Under 150 characters. Rankings hook.
- **Instagram caption:** Top 5 teams listed, 3-5 hashtags.
- **Bluesky thread:** 2-3 posts, 300 char limit each.

### REMINDERS

- Use the EXACT output format specified in the system prompt (TITLE, SLUG, EXCERPT, etc.).
- There are exactly ${sorted.length} teams in the Eastern Conference. Rank ALL of them.
- Every stat must come from the data above. Do not invent or estimate.
- PPG (points per game) and form strings are the best indicators of trajectory.
- These are POWER rankings, not a standings copy-paste. A team on a 5-match winning streak might rank above a team with more total points. Justify your ordering with data.
- NYRB gets 3-4 sentences. Everyone else gets 1-2 sentences.`;

  return prompt;
}
