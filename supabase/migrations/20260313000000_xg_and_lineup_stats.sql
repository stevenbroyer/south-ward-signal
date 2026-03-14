-- ═══════════════════════════════════════════════════════════════════
-- xG & Player-Level Match Stats
-- Adds lineup_stats table for per-player per-match statistics
-- xG fixture-level data uses existing sm_fixture_stats table
-- ═══════════════════════════════════════════════════════════════════

-- ─── Lineup Stats (per-player per-match) ────────────────────────

CREATE TABLE IF NOT EXISTS sm_lineup_stats (
    id              BIGSERIAL PRIMARY KEY,
    fixture_id      INTEGER NOT NULL REFERENCES sm_fixtures(id) ON DELETE CASCADE,
    player_id       INTEGER NOT NULL,
    team_id         INTEGER NOT NULL,
    stat_type_id    INTEGER NOT NULL,
    stat_code       TEXT NOT NULL,
    value           NUMERIC,
    UNIQUE(fixture_id, player_id, stat_type_id)
);

CREATE INDEX IF NOT EXISTS idx_sm_lineup_stats_fixture ON sm_lineup_stats (fixture_id);
CREATE INDEX IF NOT EXISTS idx_sm_lineup_stats_player ON sm_lineup_stats (player_id);
CREATE INDEX IF NOT EXISTS idx_sm_lineup_stats_code ON sm_lineup_stats (stat_code);
CREATE INDEX IF NOT EXISTS idx_sm_lineup_stats_team ON sm_lineup_stats (team_id);

-- ─── Add formation_position to lineups ─────────────────────────

ALTER TABLE sm_lineups ADD COLUMN IF NOT EXISTS formation_position INTEGER;

-- ─── RLS ────────────────────────────────────────────────────────

ALTER TABLE sm_lineup_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sm_lineup_stats" ON sm_lineup_stats FOR SELECT USING (true);
CREATE POLICY "Service write sm_lineup_stats" ON sm_lineup_stats FOR ALL USING (auth.role() = 'service_role');
