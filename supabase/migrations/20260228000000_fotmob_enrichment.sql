-- FotMob Historical Data Enrichment
-- Adds columns for FotMob-specific match and player data

-- ── matches table additions ──────────────────────────────────────────────────

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS referee TEXT,
  ADD COLUMN IF NOT EXISTS attendance INTEGER,
  ADD COLUMN IF NOT EXISTS player_of_match TEXT,
  ADD COLUMN IF NOT EXISTS player_of_match_rating NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS home_formation TEXT,
  ADD COLUMN IF NOT EXISTS away_formation TEXT,
  ADD COLUMN IF NOT EXISTS home_coach TEXT,
  ADD COLUMN IF NOT EXISTS away_coach TEXT,
  ADD COLUMN IF NOT EXISTS match_round TEXT,
  ADD COLUMN IF NOT EXISTS weather JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'api-football';

-- ── player_match_stats table additions ───────────────────────────────────────

ALTER TABLE player_match_stats
  ADD COLUMN IF NOT EXISTS shots_on_target INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dribbles_attempted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dribbles_succeeded INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duels_won INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duels_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aerial_duels_won INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aerial_duels_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS touches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clearances INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crosses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS long_balls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS long_balls_accurate INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goals_prevented NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS shirt_number INTEGER,
  ADD COLUMN IF NOT EXISTS is_starter BOOLEAN,
  ADD COLUMN IF NOT EXISTS sub_on_minute INTEGER,
  ADD COLUMN IF NOT EXISTS sub_off_minute INTEGER,
  ADD COLUMN IF NOT EXISTS is_home BOOLEAN,
  ADD COLUMN IF NOT EXISTS fotmob_player_id INTEGER,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'api-football';

-- ── match_shots table additions ──────────────────────────────────────────────

ALTER TABLE match_shots
  ADD COLUMN IF NOT EXISTS expected_goals_on_target NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS situation TEXT,
  ADD COLUMN IF NOT EXISTS fotmob_player_id INTEGER,
  ADD COLUMN IF NOT EXISTS on_goal_shot JSONB;

-- ── Indices for new columns ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_matches_data_source ON matches (data_source);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_fotmob_player
  ON player_match_stats (fotmob_player_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_data_source
  ON player_match_stats (data_source);
CREATE INDEX IF NOT EXISTS idx_match_shots_fotmob_player
  ON match_shots (fotmob_player_id);
