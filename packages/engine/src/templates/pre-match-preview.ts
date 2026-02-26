/**
 * Pre-Match Preview Prompt Template
 *
 * Builds the user prompt for pre-match preview articles. Accepts fixture
 * details and optionally standings data and recent form (as MatchData[])
 * to provide statistical context for the tactical preview.
 *
 * Target length: 600-900 words.
 *
 * @module templates/pre-match-preview
 */

import type { MatchData, Standing } from '@sws/shared';

/** Fixture input for preview articles. */
export interface PreviewFixture {
  home_team: string;
  away_team: string;
  date: string;
  venue?: string;
  competition: string;
}

/**
 * Extracts a compact form summary from recent MatchData for a given team.
 */
function summarizeTeamForm(team: string, matches: MatchData[]): string {
  if (matches.length === 0) return `No recent match data available for ${team}.`;

  const results = matches.map((m) => {
    const isHome = m.home_team === team;
    const teamScore = isHome ? m.home_score : m.away_score;
    const oppScore = isHome ? m.away_score : m.home_score;
    const opponent = isHome ? m.away_team : m.home_team;
    const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
    const xg = isHome ? m.home_xg : m.away_xg;
    const oppXg = isHome ? m.away_xg : m.home_xg;
    return `  ${result} ${teamScore}-${oppScore} vs ${opponent} (xG: ${xg.toFixed(2)} - ${oppXg.toFixed(2)})`;
  });

  const record = matches.reduce(
    (acc, m) => {
      const isHome = m.home_team === team;
      const teamScore = isHome ? m.home_score : m.away_score;
      const oppScore = isHome ? m.away_score : m.home_score;
      if (teamScore > oppScore) acc.w++;
      else if (teamScore < oppScore) acc.l++;
      else acc.d++;
      return acc;
    },
    { w: 0, d: 0, l: 0 },
  );

  return `${team} recent form (last ${matches.length} matches): ${record.w}W-${record.d}D-${record.l}L\n${results.join('\n')}`;
}

/**
 * Formats a standings entry into a compact line.
 */
function formatStandingLine(s: Standing): string {
  const form = s.form.slice(-5).join('');
  return `  ${s.position}. ${s.team} -- ${s.points}pts (${s.wins}W-${s.draws}D-${s.losses}L) GD: ${s.goal_difference >= 0 ? '+' : ''}${s.goal_difference} | Form: ${form}`;
}

/**
 * Builds the user prompt for a pre-match preview article.
 *
 * @param fixture - The upcoming fixture details (teams, date, venue, competition).
 * @param standings - Optional full conference standings for league context.
 * @param recentForm - Optional array of recent MatchData for both teams to
 *   provide statistical form context.
 * @returns The fully assembled user prompt string to pair with the system prompt.
 *
 * @example
 * ```ts
 * const prompt = buildPreMatchPreviewPrompt(
 *   { home_team: 'New York Red Bulls', away_team: 'NYCFC', date: '2026-03-15', competition: 'MLS' },
 *   standings,
 *   recentMatches,
 * );
 * ```
 */
export function buildPreMatchPreviewPrompt(
  fixture: PreviewFixture,
  standings?: Standing[],
  recentForm?: MatchData[],
): string {
  const { home_team, away_team, date, venue, competition } = fixture;

  let prompt = `## CONTENT REQUEST: PRE-MATCH PREVIEW

Write a pre-match preview article for the following fixture. Target length: **600-900 words**.

---

### FIXTURE DETAILS

- **Competition:** ${competition}
- **Date:** ${date}
- **Home:** ${home_team}
- **Away:** ${away_team}`;

  if (venue) {
    prompt += `\n- **Venue:** ${venue}`;
  }

  prompt += '\n';

  // League context from standings
  if (standings && standings.length > 0) {
    const homeStanding = standings.find((s) => s.team === home_team);
    const awayStanding = standings.find((s) => s.team === away_team);

    prompt += `\n### LEAGUE STANDINGS CONTEXT\n\n`;

    if (homeStanding) {
      prompt += `${home_team}:\n${formatStandingLine(homeStanding)}\n\n`;
    }
    if (awayStanding) {
      prompt += `${away_team}:\n${formatStandingLine(awayStanding)}\n\n`;
    }

    // Include top of table for context
    const topTeams = [...standings].sort((a, b) => a.position - b.position).slice(0, 5);
    prompt += `Top of the ${standings[0]?.team ? 'Conference' : 'Table'}:\n`;
    prompt += topTeams.map(formatStandingLine).join('\n');
    prompt += '\n';
  }

  // Recent form from match data
  if (recentForm && recentForm.length > 0) {
    const homeMatches = recentForm.filter(
      (m) => m.home_team === home_team || m.away_team === home_team,
    );
    const awayMatches = recentForm.filter(
      (m) => m.home_team === away_team || m.away_team === away_team,
    );

    prompt += `\n### RECENT FORM (STATISTICAL CONTEXT)\n\n`;

    if (homeMatches.length > 0) {
      prompt += `${summarizeTeamForm(home_team, homeMatches)}\n\n`;
    }
    if (awayMatches.length > 0) {
      prompt += `${summarizeTeamForm(away_team, awayMatches)}\n\n`;
    }

    // Aggregate xG data for both teams
    const calcAvgXg = (team: string, matches: MatchData[]) => {
      if (matches.length === 0) return null;
      const totalXgFor = matches.reduce((sum, m) => {
        return sum + (m.home_team === team ? m.home_xg : m.away_xg);
      }, 0);
      const totalXgAgainst = matches.reduce((sum, m) => {
        return sum + (m.home_team === team ? m.away_xg : m.home_xg);
      }, 0);
      return {
        xgFor: (totalXgFor / matches.length).toFixed(2),
        xgAgainst: (totalXgAgainst / matches.length).toFixed(2),
      };
    };

    const homeXg = calcAvgXg(home_team, homeMatches);
    const awayXg = calcAvgXg(away_team, awayMatches);

    if (homeXg || awayXg) {
      prompt += `Average xG per match:\n`;
      if (homeXg) {
        prompt += `  ${home_team}: ${homeXg.xgFor} xG for / ${homeXg.xgAgainst} xG against\n`;
      }
      if (awayXg) {
        prompt += `  ${away_team}: ${awayXg.xgFor} xG for / ${awayXg.xgAgainst} xG against\n`;
      }
      prompt += '\n';
    }
  }

  prompt += `
---

### ARTICLE STRUCTURE

Write the article with the following sections in order:

1. **Form Guide** -- Analyze both teams' recent form. What trends define each side heading into this match? Reference specific results, xG data, and win/loss streaks where the data supports it. If standings data is provided, frame the match in league context (playoff race, shield contention, relegation, etc.).

2. **Tactical Preview** -- How do these two teams set up? What systems and styles will likely collide? Identify the tactical battle that will decide the match. Reference PPDA, possession tendencies, and pressing styles if form data is available.

3. **Key Matchups (3)** -- Identify exactly three individual or unit-vs-unit matchups that will shape the result. For each, explain why this matchup matters and who has the edge. Be specific about player roles and tendencies.

4. **Prediction with Reasoning** -- Make a specific score prediction. Justify it with the data provided -- form, xG trends, home/away records, tactical matchup advantages. Be confident in the pick but acknowledge the key variable that could flip the result.

### SOCIAL CONTENT

After the article body, generate:
- **Twitter/X thread:** 4-5 tweets. Open with the fixture hook and key storyline. Include a prediction tweet.
- **TikTok caption:** Under 150 characters. Build anticipation.
- **Instagram caption:** Storytelling format, 3-5 hashtags.
- **Bluesky thread:** 2-3 posts, 300 char limit each.

### REMINDERS

- Use the EXACT output format specified in the system prompt (TITLE, SLUG, EXCERPT, etc.).
- Every stat must come from the data above. Do not invent or estimate.
- If no standings or form data is provided, focus on the narrative angle and general tactical analysis. Do not fabricate statistical context.
- The prediction should be bold but defensible.`;

  return prompt;
}
