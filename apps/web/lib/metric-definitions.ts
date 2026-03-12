export interface MetricDefinition {
  name: string;
  short: string;
  description: string;
  example?: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  xg: {
    name: 'Expected Goals (xG)',
    short: 'xG',
    description:
      'A measure of shot quality based on factors like distance, angle, and assist type. An xG of 0.3 means a shot from that position scores about 30% of the time.',
    example:
      "If a team generates 2.1 xG but scores 3, they're finishing above expectation.",
  },
  xga: {
    name: 'Expected Goals Against (xGA)',
    short: 'xGA',
    description:
      "The quality of chances a team concedes. Lower is better — it means opponents are getting lower-quality shots.",
  },
  xg_diff: {
    name: 'xG Difference',
    short: 'xG Diff',
    description:
      "The gap between xG created and xG conceded. Positive means the team is generating better chances than they're allowing.",
  },
  ppda: {
    name: 'Passes Per Defensive Action (PPDA)',
    short: 'PPDA',
    description:
      'How aggressively a team presses. Lower PPDA means more frequent defensive actions (tackles, interceptions) per opponent pass. Below 10 is considered a high press.',
    example:
      'A PPDA of 7.5 means the team makes a defensive action every 7-8 opponent passes.',
  },
  goals_added: {
    name: 'Goals Added (g+)',
    short: 'g+',
    description:
      "American Soccer Analysis metric measuring a player's contribution above league average across all on-ball actions. Positive values mean the player adds more goal value than the average MLS player in their position.",
    example:
      '+2.5 g+ means the player contributed roughly 2.5 goals more than an average replacement.',
  },
  ppg: {
    name: 'Points Per Game',
    short: 'PPG',
    description:
      'Average points earned per match. In MLS, 2.0+ PPG typically indicates a top team. The maximum possible is 3.0 (win every game).',
  },
  xg_per_match: {
    name: 'xG Per Match',
    short: 'xG/Match',
    description:
      'Average expected goals created per game. Higher is better — it means the team consistently creates quality chances.',
  },
  clean_sheets: {
    name: 'Clean Sheets',
    short: 'CS',
    description:
      'Matches where the team conceded zero goals. A measure of defensive solidity.',
  },
  form: {
    name: 'Form',
    short: 'Form',
    description:
      'Results from the last 5 matches. W = Win, D = Draw, L = Loss. Read left to right, most recent first.',
  },
  shots_per_90: {
    name: 'Shots Per 90',
    short: 'Sh/90',
    description:
      'Average shots taken per 90 minutes of play. Includes shots on target and off target.',
  },
  tackles_won: {
    name: 'Tackles Won',
    short: 'Tkl',
    description:
      'Successful tackles where the team won possession.',
  },
  interceptions: {
    name: 'Interceptions',
    short: 'Int',
    description:
      'Passes intercepted by the team, preventing the opposition from maintaining possession.',
  },
  xa: {
    name: 'Expected Assists (xA)',
    short: 'xA',
    description:
      'The likelihood that a given pass will become an assist based on the type of pass, its end location, and historical data.',
  },
  conference_rank: {
    name: 'Conference Rank',
    short: 'Rank',
    description:
      'Position in the Eastern Conference standings. Top 9 qualify for the MLS Cup Playoffs.',
  },
};

/**
 * Maps common metric label text (as displayed in the UI) to definition keys.
 * This lets MetricCard auto-resolve tooltips without every call site
 * passing an explicit metricKey prop.
 */
const LABEL_KEY_MAP: Record<string, string> = {
  xg: 'xg',
  'xg diff': 'xg_diff',
  'xg difference': 'xg_diff',
  ppg: 'ppg',
  'points per game': 'ppg',
  ppda: 'ppda',
  'avg ppda': 'ppda',
  'goals added': 'goals_added',
  'g+': 'goals_added',
  form: 'form',
  'conf. rank': 'conference_rank',
  'conference rank': 'conference_rank',
  'clean sheets': 'clean_sheets',
  'tackles won': 'tackles_won',
  interceptions: 'interceptions',
  xa: 'xa',
  xga: 'xga',
  'shots per 90': 'shots_per_90',
  'sh/90': 'shots_per_90',
  'xg/match': 'xg_per_match',
  'xg per match': 'xg_per_match',
};

/**
 * Look up a metric definition by key or by display label.
 * Tries exact key match first, then normalized label lookup.
 */
export function getMetricDefinition(
  keyOrLabel: string,
): MetricDefinition | undefined {
  const normalized = keyOrLabel.toLowerCase().trim();

  // Direct key match
  if (METRIC_DEFINITIONS[normalized]) {
    return METRIC_DEFINITIONS[normalized];
  }

  // Normalize key format (replace spaces/slashes with underscores)
  const asKey = normalized.replace(/[\s/]+/g, '_');
  if (METRIC_DEFINITIONS[asKey]) {
    return METRIC_DEFINITIONS[asKey];
  }

  // Label-to-key lookup
  const mappedKey = LABEL_KEY_MAP[normalized];
  if (mappedKey && METRIC_DEFINITIONS[mappedKey]) {
    return METRIC_DEFINITIONS[mappedKey];
  }

  return undefined;
}
