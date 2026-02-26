/**
 * Stat of the Week Prompt Template
 *
 * Builds the user prompt for a short-form article highlighting one
 * compelling statistical finding about the New York Red Bulls.
 *
 * Target length: 300-500 words. Focused on a single stat with context.
 *
 * @module templates/stat-of-week
 */

import type { Standing, PlayerStats } from '@sws/shared';

/**
 * Build a "Stat of the Week" prompt.
 *
 * @param standings - Current Eastern Conference standings for context.
 * @param playerStats - Optional NYRB player stats for individual insights.
 * @param focusStat - Optional specific stat to highlight (e.g., "PPDA", "xG differential").
 */
export function buildStatOfWeekPrompt(
  standings: Standing[],
  playerStats?: PlayerStats[],
  focusStat?: string,
): string {
  const sections: string[] = [];

  sections.push('## CONTENT TYPE: STAT OF THE WEEK');
  sections.push('');
  sections.push('Write a short-form article (300-500 words) highlighting one compelling statistical finding about the New York Red Bulls this MLS season.');
  sections.push('');

  // Standings context
  sections.push('## CURRENT STANDINGS');
  const nyrb = standings.find(
    (s) => s.team.includes('Red Bull') || s.team.includes('NYRB'),
  );
  if (nyrb) {
    const ppg = nyrb.games_played > 0
      ? (nyrb.points / nyrb.games_played).toFixed(2)
      : '0.00';
    sections.push(`NYRB Position: ${nyrb.position}th | ${nyrb.points}pts | ${nyrb.wins}W-${nyrb.draws}D-${nyrb.losses}L | GD: ${nyrb.goal_difference >= 0 ? '+' : ''}${nyrb.goal_difference} | PPG: ${ppg}`);
    sections.push(`Form (last 5): ${nyrb.form.slice(-5).join('')}`);
  }
  sections.push('');
  sections.push('Top 5 in conference:');
  for (const s of standings.slice(0, 5)) {
    sections.push(`  ${s.position}. ${s.team} — ${s.points}pts (${s.wins}W-${s.draws}D-${s.losses}L, GD: ${s.goal_difference >= 0 ? '+' : ''}${s.goal_difference})`);
  }
  sections.push('');

  // Player stats if available
  if (playerStats && playerStats.length > 0) {
    sections.push('## NYRB PLAYER STATS');
    const topByXG = [...playerStats].sort((a, b) => b.xg - a.xg).slice(0, 5);
    const topByGA = [...playerStats]
      .filter((p) => p.goals_added !== undefined)
      .sort((a, b) => (b.goals_added ?? 0) - (a.goals_added ?? 0))
      .slice(0, 5);

    sections.push('Top 5 by xG:');
    for (const p of topByXG) {
      const per90 = p.minutes > 0 ? ((p.xg / p.minutes) * 90).toFixed(2) : '0.00';
      sections.push(`  ${p.name} — ${p.xg.toFixed(2)} xG (${per90}/90) | ${p.goals}G ${p.assists}A | ${p.minutes}min`);
    }

    if (topByGA.length > 0) {
      sections.push('Top 5 by Goals Added (g+):');
      for (const p of topByGA) {
        sections.push(`  ${p.name} — ${p.goals_added?.toFixed(2)} g+ | ${p.position}`);
      }
    }
    sections.push('');
  }

  // Focus stat hint
  if (focusStat) {
    sections.push(`## SUGGESTED FOCUS: ${focusStat}`);
    sections.push(`The editor has flagged "${focusStat}" as a potential angle. Use this as your primary stat if the data supports an interesting narrative. If not, choose a different compelling stat.`);
    sections.push('');
  }

  sections.push('## REQUIREMENTS');
  sections.push('- 300-500 words');
  sections.push('- Focus on ONE compelling stat — not a stats dump');
  sections.push('- Provide league-wide context (where does NYRB rank? how unusual is this number?)');
  sections.push('- Explain why this stat matters tactically or for the season outlook');
  sections.push('- Use a punchy, interesting headline that features the stat');
  sections.push('- Include 2-3 supporting data points that reinforce the main finding');
  sections.push('- End with a "so what" — what does this mean going forward?');
  sections.push('');
  sections.push('Follow the exact output format specified in the system prompt.');

  return sections.join('\n');
}
