-- ═══════════════════════════════════════════════════════════════════
-- South Ward Signal — Data Room Expansion
-- New tables for match shots, xG flow, player/team advanced stats,
-- FotMob cache, and multi-season historical data.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Add columns to matches ───────────────────────────────────────

ALTER TABLE matches ADD COLUMN IF NOT EXISTS fotmob_id TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS momentum JSONB DEFAULT '[]';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_matches_fotmob_id ON matches (fotmob_id);

-- ─── Match Shots ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_shots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team            TEXT NOT NULL,
    player          TEXT NOT NULL,
    minute          INTEGER NOT NULL,
    x               NUMERIC(5,2) NOT NULL,
    y               NUMERIC(5,2) NOT NULL,
    xg              NUMERIC(5,4) DEFAULT 0,
    outcome         TEXT NOT NULL CHECK (outcome IN ('goal', 'saved', 'blocked', 'off_target', 'post')),
    body_part       TEXT,
    shot_type       TEXT,
    assist_player   TEXT,
    home_team_side  BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_shots_match ON match_shots (match_id);
CREATE INDEX IF NOT EXISTS idx_match_shots_team ON match_shots (team);
CREATE INDEX IF NOT EXISTS idx_match_shots_player ON match_shots (player);

-- ─── Match xG Flow ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_xg_flow (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    minute          INTEGER NOT NULL,
    home_xg         NUMERIC(5,3) DEFAULT 0,
    away_xg         NUMERIC(5,3) DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, minute)
);

CREATE INDEX IF NOT EXISTS idx_match_xg_flow_match ON match_xg_flow (match_id);

-- ─── Player Match Stats ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_match_stats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_name     TEXT NOT NULL,
    team            TEXT NOT NULL,
    position        TEXT,
    minutes_played  INTEGER DEFAULT 0,
    goals           INTEGER DEFAULT 0,
    assists         INTEGER DEFAULT 0,
    xg              NUMERIC(5,3) DEFAULT 0,
    xa              NUMERIC(5,3) DEFAULT 0,
    shots           INTEGER DEFAULT 0,
    key_passes      INTEGER DEFAULT 0,
    passes          INTEGER DEFAULT 0,
    pass_accuracy   NUMERIC(5,2),
    tackles         INTEGER DEFAULT 0,
    interceptions   INTEGER DEFAULT 0,
    fouls           INTEGER DEFAULT 0,
    yellows         INTEGER DEFAULT 0,
    reds            INTEGER DEFAULT 0,
    fotmob_rating   NUMERIC(3,1),
    goals_added     NUMERIC(6,3),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, player_name)
);

CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats (match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats (player_name);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_team ON player_match_stats (team);

-- ─── Team Season Stats ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_season_stats (
    id              TEXT PRIMARY KEY,
    team            TEXT NOT NULL,
    team_id         TEXT,
    season          INTEGER NOT NULL,
    games_played    INTEGER DEFAULT 0,
    wins            INTEGER DEFAULT 0,
    draws           INTEGER DEFAULT 0,
    losses          INTEGER DEFAULT 0,
    goals_for       INTEGER DEFAULT 0,
    goals_against   INTEGER DEFAULT 0,
    xg_for          NUMERIC(6,2) DEFAULT 0,
    xg_against      NUMERIC(6,2) DEFAULT 0,
    xg_diff         NUMERIC(6,2) GENERATED ALWAYS AS (xg_for - xg_against) STORED,
    goals_added     NUMERIC(6,3),
    xpass           NUMERIC(5,3),
    points          INTEGER DEFAULT 0,
    ppg             NUMERIC(4,2) GENERATED ALWAYS AS (
                        CASE WHEN games_played > 0
                             THEN ROUND(points::NUMERIC / games_played, 2)
                             ELSE 0 END
                    ) STORED,
    salary_budget   NUMERIC(12,2),
    conference      TEXT DEFAULT 'Eastern',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team, season)
);

CREATE INDEX IF NOT EXISTS idx_team_season_stats_team ON team_season_stats (team);
CREATE INDEX IF NOT EXISTS idx_team_season_stats_season ON team_season_stats (season);

-- ─── Player Season History ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_season_history (
    id              TEXT PRIMARY KEY,
    player_name     TEXT NOT NULL,
    team            TEXT NOT NULL,
    season          INTEGER NOT NULL,
    position        TEXT,
    games_played    INTEGER DEFAULT 0,
    minutes         INTEGER DEFAULT 0,
    goals           INTEGER DEFAULT 0,
    assists         INTEGER DEFAULT 0,
    xg              NUMERIC(6,3) DEFAULT 0,
    xa              NUMERIC(6,3) DEFAULT 0,
    goals_added     NUMERIC(6,3),
    ga_dribbling    NUMERIC(6,3),
    ga_passing      NUMERIC(6,3),
    ga_receiving    NUMERIC(6,3),
    ga_shooting     NUMERIC(6,3),
    ga_defending    NUMERIC(6,3),
    key_passes      INTEGER,
    tackles_won     INTEGER,
    interceptions   INTEGER,
    pass_completion NUMERIC(5,2),
    salary          NUMERIC(12,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_name, team, season)
);

CREATE INDEX IF NOT EXISTS idx_player_season_history_player ON player_season_history (player_name);
CREATE INDEX IF NOT EXISTS idx_player_season_history_team ON player_season_history (team);
CREATE INDEX IF NOT EXISTS idx_player_season_history_season ON player_season_history (season);

-- ─── Team Match Advanced ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_match_advanced (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team            TEXT NOT NULL,
    season          INTEGER NOT NULL DEFAULT 2026,
    match_date      DATE NOT NULL,
    opponent        TEXT NOT NULL,
    is_home         BOOLEAN NOT NULL,
    result          TEXT CHECK (result IN ('W', 'D', 'L')),
    goals_for       INTEGER DEFAULT 0,
    goals_against   INTEGER DEFAULT 0,
    xg_for          NUMERIC(5,3) DEFAULT 0,
    xg_against      NUMERIC(5,3) DEFAULT 0,
    possession      NUMERIC(4,1),
    shots           INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    ppda            NUMERIC(5,2),
    passes          INTEGER DEFAULT 0,
    pass_accuracy   NUMERIC(5,2),
    corners         INTEGER DEFAULT 0,
    fouls           INTEGER DEFAULT 0,
    goals_added     NUMERIC(6,3),
    clean_sheet     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(match_id, team)
);

CREATE INDEX IF NOT EXISTS idx_team_match_advanced_team ON team_match_advanced (team, season);
CREATE INDEX IF NOT EXISTS idx_team_match_advanced_date ON team_match_advanced (match_date DESC);

-- ─── FotMob Cache ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fotmob_cache (
    cache_key       TEXT PRIMARY KEY,
    data            JSONB NOT NULL,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_fotmob_cache_expires ON fotmob_cache (expires_at);

-- ─── Updated-at triggers for new tables ──────────────────────────

CREATE TRIGGER trg_player_match_stats_updated_at
    BEFORE UPDATE ON player_match_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_team_season_stats_updated_at
    BEFORE UPDATE ON team_season_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_player_season_history_updated_at
    BEFORE UPDATE ON player_season_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_team_match_advanced_updated_at
    BEFORE UPDATE ON team_match_advanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security for new tables ───────────────────────────

ALTER TABLE match_shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_xg_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_season_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_match_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotmob_cache ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read match_shots" ON match_shots FOR SELECT USING (true);
CREATE POLICY "Public read match_xg_flow" ON match_xg_flow FOR SELECT USING (true);
CREATE POLICY "Public read player_match_stats" ON player_match_stats FOR SELECT USING (true);
CREATE POLICY "Public read team_season_stats" ON team_season_stats FOR SELECT USING (true);
CREATE POLICY "Public read player_season_history" ON player_season_history FOR SELECT USING (true);
CREATE POLICY "Public read team_match_advanced" ON team_match_advanced FOR SELECT USING (true);
CREATE POLICY "Public read fotmob_cache" ON fotmob_cache FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service write match_shots" ON match_shots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write match_xg_flow" ON match_xg_flow FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write player_match_stats" ON player_match_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write team_season_stats" ON team_season_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write player_season_history" ON player_season_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write team_match_advanced" ON team_match_advanced FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write fotmob_cache" ON fotmob_cache FOR ALL USING (auth.role() = 'service_role');
