/**
 * Match Recap Prompt Template
 *
 * Builds the user prompt for post-match recap articles. Injects the full
 * match data payload -- score, goals, lineups, xG, goals-added, PPDA, and
 * press conference quotes (when available) -- then requests a structured
 * 800-1200 word recap with tactical analysis and social content.
 *
 * The system prompt (prompts/system.ts) handles voice, tone, banned phrases,
 * AI disclosure, and the output format contract. This template only builds
 * the specific content request.
 *
 * @module templates/match-recap
 */

import type { MatchData } from '@sws/shared';

/**
 * Serializes the goals array into a human-readable list for the prompt.
 */
function formatGoals(goals: MatchData['goals']): string {
  if (goals.length === 0) return 'No goals scored.';

  return goals
    .map((g) => {
      const type = g.type === 'penalty' ? ' (PEN)' : g.type === 'own_goal' ? ' (OG)' : '';
      const assist = g.assist ? ` (assist: ${g.assist})` : '';
      const xg = g.xg_value !== undefined ? ` [xG: ${g.xg_value.toFixed(2)}]` : '';
      return `  ${g.minute}' - ${g.player} (${g.team})${type}${assist}${xg}`;
    })
    .join('\n');
}

/**
 * Serializes a lineup into a prompt-friendly list.
 */
function formatLineup(
  lineup: MatchData['lineups']['home'],
  teamName: string,
): string {
  const starters = lineup.filter((p) => !p.substituted_in);
  const subs = lineup.filter((p) => p.substituted_in !== undefined);

  let out = `${teamName} Starting XI:\n`;
  out += starters
    .map((p) => {
      const num = p.number ? `#${p.number} ` : '';
      const rating = p.rating ? ` (rating: ${p.rating})` : '';
      const subOut = p.substituted_out ? ` [off ${p.substituted_out}']` : '';
      return `  ${num}${p.name} - ${p.position}${rating}${subOut}`;
    })
    .join('\n');

  if (subs.length > 0) {
    out += `\n${teamName} Substitutes Used:\n`;
    out += subs
      .map((p) => {
        const num = p.number ? `#${p.number} ` : '';
        const rating = p.rating ? ` (rating: ${p.rating})` : '';
        return `  ${num}${p.name} - ${p.position} [on ${p.substituted_in}']${rating}`;
      })
      .join('\n');
  }

  return out;
}

/**
 * Serializes the match stats block into a prompt-friendly table.
 */
function formatStats(stats: MatchData['stats'], home: string, away: string): string {
  const rows = [
    ['Possession', `${stats.possession.home}%`, `${stats.possession.away}%`],
    ['Shots', `${stats.shots.home}`, `${stats.shots.away}`],
    ['Shots on Target', `${stats.shots_on_target.home}`, `${stats.shots_on_target.away}`],
    ['Corners', `${stats.corners.home}`, `${stats.corners.away}`],
    ['Fouls', `${stats.fouls.home}`, `${stats.fouls.away}`],
    ['Passing Accuracy', `${stats.passing_accuracy.home}%`, `${stats.passing_accuracy.away}%`],
    ['PPDA', `${stats.ppda.home.toFixed(1)}`, `${stats.ppda.away.toFixed(1)}`],
  ];

  let table = `Stat | ${home} | ${away}\n`;
  table += '--- | --- | ---\n';
  table += rows.map((r) => r.join(' | ')).join('\n');
  return table;
}

/**
 * Serializes goals-added data into a prompt-friendly block.
 */
function formatGoalsAdded(ga: NonNullable<MatchData['goals_added']>, home: string, away: string): string {
  let out = `Goals Added (g+):\n`;
  out += `  ${home} total: ${ga.home_total >= 0 ? '+' : ''}${ga.home_total.toFixed(2)}\n`;
  out += `  ${away} total: ${ga.away_total >= 0 ? '+' : ''}${ga.away_total.toFixed(2)}\n`;
  if (ga.top_performers.length > 0) {
    out += `  Top Performers:\n`;
    out += ga.top_performers
      .map((p) => `    ${p.player} (${p.team}): ${p.g_plus >= 0 ? '+' : ''}${p.g_plus.toFixed(2)} g+`)
      .join('\n');
  }
  return out;
}

/**
 * Serializes press conference quotes into a prompt-friendly block.
 */
function formatQuotes(quotes: NonNullable<MatchData['press_conference_quotes']>): string {
  return quotes
    .map((q) => {
      const src = q.source ? ` (via ${q.source})` : '';
      return `  "${q.text}" -- ${q.speaker}, ${q.role}${src}`;
    })
    .join('\n');
}

/**
 * Builds the user prompt for a post-match recap article.
 *
 * @param data - Complete match data payload including score, goals, lineups,
 *   xG, match stats, goals-added, and optional press conference quotes.
 * @returns The fully assembled user prompt string to pair with the system prompt.
 *
 * @example
 * ```ts
 * const prompt = buildMatchRecapPrompt(matchData);
 * const response = await claude.send(systemPrompt, prompt);
 * ```
 */
export function buildMatchRecapPrompt(data: MatchData): string {
  const { home_team, away_team, home_score, away_score } = data;
  const result = home_score > away_score
    ? `${home_team} win`
    : away_score > home_score
      ? `${away_team} win`
      : 'Draw';

  let prompt = `## CONTENT REQUEST: MATCH RECAP

Write a match recap article for the following match. Target length: **800-1200 words**.

---

### MATCH DETAILS

- **Date:** ${data.date}
- **Home:** ${home_team}
- **Away:** ${away_team}
- **Final Score:** ${home_team} ${home_score} - ${away_score} ${away_team}
- **Result:** ${result}
- **Status:** ${data.status}
- **xG:** ${home_team} ${data.home_xg.toFixed(2)} - ${data.away_xg.toFixed(2)} ${away_team}

### GOALS

${formatGoals(data.goals)}

### MATCH STATS

${formatStats(data.stats, home_team, away_team)}

### LINEUPS

${formatLineup(data.lineups.home, home_team)}

${formatLineup(data.lineups.away, away_team)}
`;

  if (data.goals_added) {
    prompt += `\n### GOALS ADDED (American Soccer Analysis)\n\n${formatGoalsAdded(data.goals_added, home_team, away_team)}\n`;
  }

  if (data.press_conference_quotes && data.press_conference_quotes.length > 0) {
    prompt += `\n### PRESS CONFERENCE QUOTES\n\nThe following quotes are REAL and verified. You MUST use them with proper attribution using blockquote format:\n\n${formatQuotes(data.press_conference_quotes)}\n`;
  } else {
    prompt += `\n### QUOTES\n\nNo press conference quotes are available for this match. DO NOT include any quotes, fabricated or otherwise. Do not paraphrase anyone as if quoting them. Do not use blockquote formatting.\n`;
  }

  prompt += `
---

### ARTICLE STRUCTURE

Write the article with the following sections in order:

1. **Opening paragraph** -- Lead with the score and the key narrative of the match. What was the story? Set the scene in 2-3 sentences.

2. **Tactical Analysis** -- Break down the tactical battle. Reference possession, PPDA, passing accuracy, and formation dynamics. Explain *why* the match unfolded the way it did.

3. **Key Moments** -- Walk through the decisive moments chronologically. Each goal should get context: who created it, how it developed, what the xG value tells us about the chance quality.

4. **Standout Performers** -- Highlight 2-3 players who shaped the match. Use lineup ratings, goals-added data (if available), and specific actions from the stats.

5. **"By the Numbers" stat block** -- A bullet-point section with 5-7 key statistical takeaways. Mix headline stats (goals, xG) with deeper metrics (PPDA, goals added, passing accuracy).

### SOCIAL CONTENT

After the article body, generate:
- **Twitter/X thread:** 5-6 tweets. First tweet is the hook (score + key storyline). Include key stats in tweets 2-4. Final tweet links back to the article.
- **TikTok caption:** Under 150 characters. Hook-first, punchy.
- **Instagram caption:** Storytelling format, 3-5 hashtags.
- **Bluesky thread:** 2-4 posts, 300 char limit each.

### REMINDERS

- Use the EXACT output format specified in the system prompt (TITLE, SLUG, EXCERPT, etc.).
- Every stat must come from the data above. Do not invent or estimate.
- The xG comparison (${data.home_xg.toFixed(2)} vs ${data.away_xg.toFixed(2)}) tells a story -- use it.
- PPDA values indicate pressing intensity. Lower PPDA = more aggressive press.`;

  return prompt;
}
