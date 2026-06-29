/** Shared article-type options used across the admin editor and AI prompts. */
export const ARTICLE_TYPES = [
  { value: 'match-recap', label: 'Match Recap' },
  { value: 'pre-match-preview', label: 'Pre-Match Preview' },
  { value: 'player-spotlight', label: 'Player Spotlight' },
  { value: 'tactical-analysis', label: 'Tactical Analysis' },
  { value: 'transfer-intel', label: 'Transfer Intel' },
  { value: 'stat-of-week', label: 'Stat of the Week' },
  { value: 'weekly-roundup', label: 'Weekly Roundup' },
  { value: 'opinion', label: 'Opinion' },
] as const;

export type ArticleTypeValue = (typeof ARTICLE_TYPES)[number]['value'];

export function articleTypeLabel(value: string): string {
  return ARTICLE_TYPES.find((t) => t.value === value)?.label ?? value;
}
