-- ═══════════════════════════════════════════════════════════════════
-- South Ward Signal — SportMonks Data Tables
-- Single source of truth for all football data
-- ═══════════════════════════════════════════════════════════════════

-- ─── Teams ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_teams (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    short_code      TEXT,
    founded         INTEGER,
    logo_path       TEXT,
    venue_id        INTEGER,
    country_id      INTEGER,
    is_focus        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seasons ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_seasons (
    id              INTEGER PRIMARY KEY,
    league_id       INTEGER NOT NULL,
    year            INTEGER NOT NULL,
    is_current      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_seasons_league ON sm_seasons (league_id);

-- ─── Fixtures ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_fixtures (
    id              INTEGER PRIMARY KEY,
    season_id       INTEGER REFERENCES sm_seasons(id),
    league_id       INTEGER NOT NULL DEFAULT 779,
    round_id        INTEGER,
    home_team_id    INTEGER REFERENCES sm_teams(id),
    away_team_id    INTEGER REFERENCES sm_teams(id),
    home_team_name  TEXT,
    away_team_name  TEXT,
    starting_at     TIMESTAMPTZ NOT NULL,
    state           TEXT NOT NULL DEFAULT 'NS',
    result_info     TEXT,
    venue_id        INTEGER,
    home_score      INTEGER,
    away_score      INTEGER,
    ht_home         INTEGER,
    ht_away         INTEGER,
    length          INTEGER DEFAULT 90,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_fixtures_season ON sm_fixtures (season_id);
CREATE INDEX IF NOT EXISTS idx_sm_fixtures_date ON sm_fixtures (starting_at DESC);
CREATE INDEX IF NOT EXISTS idx_sm_fixtures_home ON sm_fixtures (home_team_id);
CREATE INDEX IF NOT EXISTS idx_sm_fixtures_away ON sm_fixtures (away_team_id);
CREATE INDEX IF NOT EXISTS idx_sm_fixtures_state ON sm_fixtures (state);

-- ─── Fixture Statistics ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_fixture_stats (
    id              BIGSERIAL PRIMARY KEY,
    fixture_id      INTEGER NOT NULL REFERENCES sm_fixtures(id) ON DELETE CASCADE,
    team_id         INTEGER NOT NULL REFERENCES sm_teams(id),
    stat_type_id    INTEGER NOT NULL,
    stat_code       TEXT NOT NULL,
    value           NUMERIC,
    UNIQUE(fixture_id, team_id, stat_type_id)
);

CREATE INDEX IF NOT EXISTS idx_sm_stats_fixture ON sm_fixture_stats (fixture_id);
CREATE INDEX IF NOT EXISTS idx_sm_stats_team ON sm_fixture_stats (team_id);
CREATE INDEX IF NOT EXISTS idx_sm_stats_code ON sm_fixture_stats (stat_code);

-- ─── Events (goals, cards, subs) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_events (
    id              INTEGER PRIMARY KEY,
    fixture_id      INTEGER NOT NULL REFERENCES sm_fixtures(id) ON DELETE CASCADE,
    team_id         INTEGER,
    player_id       INTEGER,
    player_name     TEXT,
    related_player  TEXT,
    type_id         INTEGER NOT NULL,
    event_type      TEXT NOT NULL,
    minute          INTEGER,
    extra_minute    INTEGER,
    detail          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_events_fixture ON sm_events (fixture_id);
CREATE INDEX IF NOT EXISTS idx_sm_events_type ON sm_events (event_type);
CREATE INDEX IF NOT EXISTS idx_sm_events_player ON sm_events (player_id);

-- ─── Lineups ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_lineups (
    id              INTEGER PRIMARY KEY,
    fixture_id      INTEGER NOT NULL REFERENCES sm_fixtures(id) ON DELETE CASCADE,
    team_id         INTEGER NOT NULL REFERENCES sm_teams(id),
    player_id       INTEGER NOT NULL,
    player_name     TEXT NOT NULL,
    jersey_number   INTEGER,
    position        TEXT,
    is_starter      BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_lineups_fixture ON sm_lineups (fixture_id);
CREATE INDEX IF NOT EXISTS idx_sm_lineups_player ON sm_lineups (player_id);
CREATE INDEX IF NOT EXISTS idx_sm_lineups_team ON sm_lineups (team_id);

-- ─── Standings ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_standings (
    id              BIGSERIAL PRIMARY KEY,
    season_id       INTEGER NOT NULL REFERENCES sm_seasons(id),
    team_id         INTEGER NOT NULL REFERENCES sm_teams(id),
    team_name       TEXT,
    position        INTEGER NOT NULL,
    points          INTEGER NOT NULL DEFAULT 0,
    won             INTEGER NOT NULL DEFAULT 0,
    drawn           INTEGER NOT NULL DEFAULT 0,
    lost            INTEGER NOT NULL DEFAULT 0,
    goals_for       INTEGER NOT NULL DEFAULT 0,
    goals_against   INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    games_played    INTEGER NOT NULL DEFAULT 0,
    form            TEXT,
    conference      TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_sm_standings_season ON sm_standings (season_id);
CREATE INDEX IF NOT EXISTS idx_sm_standings_position ON sm_standings (position);

-- ─── Players ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sm_players (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    common_name     TEXT,
    position        TEXT,
    detailed_position TEXT,
    nationality     TEXT,
    date_of_birth   DATE,
    height          INTEGER,
    weight          INTEGER,
    jersey_number   INTEGER,
    team_id         INTEGER REFERENCES sm_teams(id),
    image_path      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_players_team ON sm_players (team_id);
CREATE INDEX IF NOT EXISTS idx_sm_players_name ON sm_players USING gin (name gin_trgm_ops);

-- ─── Materialized view: per-fixture team stats (flat) ─────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS sm_fixture_stats_flat AS
SELECT
    f.id AS fixture_id,
    f.season_id,
    f.starting_at,
    f.home_team_id,
    f.away_team_id,
    f.home_team_name,
    f.away_team_name,
    f.home_score,
    f.away_score,
    s.team_id,
    s.stat_code,
    s.value
FROM sm_fixtures f
JOIN sm_fixture_stats s ON s.fixture_id = f.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sm_stats_flat_pk
    ON sm_fixture_stats_flat (fixture_id, team_id, stat_code);

-- ─── Updated-at triggers ──────────────────────────────────────────

CREATE TRIGGER trg_sm_teams_updated
    BEFORE UPDATE ON sm_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sm_fixtures_updated
    BEFORE UPDATE ON sm_fixtures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sm_standings_updated
    BEFORE UPDATE ON sm_standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sm_players_updated
    BEFORE UPDATE ON sm_players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────

ALTER TABLE sm_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_fixture_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_players ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read sm_teams" ON sm_teams FOR SELECT USING (true);
CREATE POLICY "Public read sm_seasons" ON sm_seasons FOR SELECT USING (true);
CREATE POLICY "Public read sm_fixtures" ON sm_fixtures FOR SELECT USING (true);
CREATE POLICY "Public read sm_fixture_stats" ON sm_fixture_stats FOR SELECT USING (true);
CREATE POLICY "Public read sm_events" ON sm_events FOR SELECT USING (true);
CREATE POLICY "Public read sm_lineups" ON sm_lineups FOR SELECT USING (true);
CREATE POLICY "Public read sm_standings" ON sm_standings FOR SELECT USING (true);
CREATE POLICY "Public read sm_players" ON sm_players FOR SELECT USING (true);

-- Service role write
CREATE POLICY "Service write sm_teams" ON sm_teams FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_seasons" ON sm_seasons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_fixtures" ON sm_fixtures FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_fixture_stats" ON sm_fixture_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_events" ON sm_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_lineups" ON sm_lineups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_standings" ON sm_standings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sm_players" ON sm_players FOR ALL USING (auth.role() = 'service_role');
