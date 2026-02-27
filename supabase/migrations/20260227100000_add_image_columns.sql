-- ═══════════════════════════════════════════════════════════════════
-- South Ward Signal — Add Image & Bio Columns
-- Player photos, team logos, player biographical data
-- ═══════════════════════════════════════════════════════════════════

-- ─── Player Stats — image + bio ─────────────────────────────────
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS sofascore_id INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS preferred_foot TEXT;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS shirt_number INTEGER;

-- ─── Standings — team logos ─────────────────────────────────────
ALTER TABLE standings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE standings ADD COLUMN IF NOT EXISTS sofascore_team_id INTEGER;

-- ─── Player Season History — image ──────────────────────────────
ALTER TABLE player_season_history ADD COLUMN IF NOT EXISTS image_url TEXT;
