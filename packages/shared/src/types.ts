// ─── Match Data ──────────────────────────────────────────────

export interface MatchData {
  match_id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_xg: number;
  away_xg: number;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  stats: MatchStats;
  goals: Goal[];
  lineups: {
    home: PlayerLineup[];
    away: PlayerLineup[];
  };
  goals_added?: GoalsAdded;
  press_conference_quotes?: PressQuote[];
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shots_on_target: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  passing_accuracy: { home: number; away: number };
  ppda: { home: number; away: number };
}

export interface Goal {
  player: string;
  minute: number;
  team: string;
  assist?: string;
  xg_value?: number;
  type?: 'goal' | 'penalty' | 'own_goal';
}

export interface PlayerLineup {
  name: string;
  number?: number;
  position: string;
  rating?: number;
  minutes_played?: number;
  substituted_in?: number;
  substituted_out?: number;
}

export interface GoalsAdded {
  home_total: number;
  away_total: number;
  top_performers: Array<{
    player: string;
    g_plus: number;
    team: string;
  }>;
}

export interface PressQuote {
  speaker: string;
  role: string;
  text: string;
  source?: string;
}

// ─── Articles ────────────────────────────────────────────────

export type ArticleType =
  | 'match-recap'
  | 'pre-match-preview'
  | 'player-spotlight'
  | 'power-rankings'
  | 'transfer-intel'
  | 'stat-of-week'
  | 'weekly-roundup';

export interface Article {
  title: string;
  slug: string;
  type: ArticleType;
  excerpt: string;
  body: string;
  htmlBody: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  featuredImage?: string;
  matchId?: string;
  socialContent: SocialContent;
  wordCount: number;
  generatedAt: string;
}

export interface SocialContent {
  twitter: string[];
  tiktok?: {
    caption: string;
    slides: TikTokSlide[];
  };
  instagram?: {
    caption: string;
    hashtags: string[];
  };
  bluesky?: string[];
}

export interface TikTokSlide {
  text: string;
  image?: string;
  duration: number;
}

// ─── QA ──────────────────────────────────────────────────────

export interface QAResult {
  passed: boolean;
  failures: CheckResult[];
  confidence: number;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

// ─── Standings ───────────────────────────────────────────────

export interface Standing {
  team: string;
  team_id?: string;
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form: ('W' | 'D' | 'L')[];
  games_played: number;
}

// ─── Player Stats ────────────────────────────────────────────

export interface PlayerStats {
  name: string;
  team: string;
  position: string;
  games_played: number;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  goals_added?: number;
  key_passes?: number;
  tackles_won?: number;
  interceptions?: number;
  aerial_duels_won?: number;
  pass_completion?: number;
}

// ─── Social Queue ────────────────────────────────────────────

export type SocialPlatform = 'twitter' | 'tiktok' | 'instagram' | 'bluesky';

export interface SocialQueueItem {
  id: string;
  article_id: string;
  platform: SocialPlatform;
  content: Record<string, unknown>;
  images: string[];
  status: 'queued' | 'posted' | 'failed';
  scheduled_for: string;
  posted_at?: string;
  external_id?: string;
}

// ─── Ghost ───────────────────────────────────────────────────

export interface GhostPost {
  id: string;
  title: string;
  slug: string;
  url: string;
  html: string;
  feature_image?: string;
  published_at: string;
  reading_time: number;
  excerpt?: string;
  custom_excerpt?: string;
  primary_tag?: { name: string; slug: string };
  tags?: Array<{ name: string; slug: string }>;
}

// ─── Fixture ─────────────────────────────────────────────────

export interface Fixture {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  venue?: string;
  competition: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  home_score?: number;
  away_score?: number;
}
