// ─── Team Identity ───────────────────────────────────────────

export const NYRB = {
  name: 'New York Red Bulls',
  short_name: 'NYRB',
  abbreviation: 'RBNY',
  league: 'MLS',
  conference: 'Eastern',
  venue: 'Red Bull Arena',
  city: 'Harrison, NJ',
} as const;

// ─── API Configuration ──────────────────────────────────────

export const API_FOOTBALL = {
  BASE_URL: 'https://v3.football.api-sports.io',
  MLS_LEAGUE_ID: 253,
  CURRENT_SEASON: 2026,
  RATE_LIMIT_PER_MINUTE: 30,
} as const;

export const ASA_API = {
  BASE_URL: 'https://app.americansocceranalysis.com/api/v1',
  LEAGUE: 'mls',
} as const;

export const FBREF = {
  BASE_URL: 'https://fbref.com/en',
  RATE_LIMIT_PER_MINUTE: 10,
} as const;

// ─── Content Categories ─────────────────────────────────────

export const ARTICLE_TAGS = {
  'match-recap': 'Match Recap',
  'pre-match-preview': 'Preview',
  'player-spotlight': 'Player Spotlight',
  'power-rankings': 'Power Rankings',
  'transfer-intel': 'Transfer Intel',
  'stat-of-week': 'Stat of the Week',
  'weekly-roundup': 'Weekly Roundup',
} as const;

export const TAG_COLORS: Record<string, string> = {
  'Match Recap': '#ED1A3D',
  'Preview': '#3B82F6',
  'Player Spotlight': '#D4A843',
  'Power Rankings': '#8B5CF6',
  'Transfer Intel': '#22C55E',
  'Stat of the Week': '#F59E0B',
  'Weekly Roundup': '#EC4899',
};

// ─── Content Rules ───────────────────────────────────────────

export const WORD_COUNT_TARGETS: Record<string, { min: number; max: number }> = {
  'match-recap': { min: 800, max: 1200 },
  'pre-match-preview': { min: 600, max: 900 },
  'player-spotlight': { min: 700, max: 1000 },
  'power-rankings': { min: 400, max: 600 },
  'transfer-intel': { min: 500, max: 800 },
  'stat-of-week': { min: 300, max: 500 },
  'weekly-roundup': { min: 600, max: 1000 },
};

export const BANNED_PHRASES = [
  'clinical finish',
  'they wanted it more',
  'gave 110%',
  'at the end of the day',
  'game of two halves',
  'park the bus',
  'world class',
  'the beautiful game',
  'footballing masterclass',
];

// ─── Social ─────────────────────────────────────────────────

export const SOCIAL_HANDLES = {
  twitter: '@SouthWardSignal',
  instagram: '@southwardsignal',
  tiktok: '@southwardsignal',
  bluesky: '@southwardsignal.bsky.social',
} as const;

export const SITE_URL = 'https://southwardsignal.com';

// ─── AI Disclosure ──────────────────────────────────────────

export const AI_DISCLOSURE = `<hr><p><em>This article was generated with AI assistance using match data from American Soccer Analysis, API-Football, and FBref. All statistics have been verified against source data. South Ward Signal uses AI to deliver faster, more comprehensive coverage — always backed by real numbers.</em></p>`;
