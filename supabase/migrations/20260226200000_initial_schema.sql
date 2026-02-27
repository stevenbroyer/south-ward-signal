-- ═══════════════════════════════════════════════════════════════════
-- South Ward Signal — Initial Database Schema
-- ═══════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Matches ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS matches (
    id              TEXT PRIMARY KEY,
    date            TIMESTAMPTZ NOT NULL,
    home_team       TEXT NOT NULL,
    away_team       TEXT NOT NULL,
    home_team_id    TEXT,
    away_team_id    TEXT,
    home_score      INTEGER,
    away_score      INTEGER,
    home_xg         NUMERIC(5,2) DEFAULT 0,
    away_xg         NUMERIC(5,2) DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'live', 'finished', 'postponed')),
    venue           TEXT,
    competition     TEXT NOT NULL DEFAULT 'MLS',
    season          INTEGER NOT NULL DEFAULT 2026,
    stats           JSONB DEFAULT '{}',
    lineups         JSONB DEFAULT '{}',
    shots           JSONB DEFAULT '[]',
    pass_pairs      JSONB DEFAULT '[]',
    goals_added     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches (season);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches (home_team, away_team);

-- ─── Articles ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS articles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id        TEXT REFERENCES matches(id) ON DELETE SET NULL,
    type            TEXT NOT NULL
                    CHECK (type IN (
                        'match-recap', 'pre-match-preview', 'player-spotlight',
                        'power-rankings', 'transfer-intel', 'stat-of-week',
                        'weekly-roundup'
                    )),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    excerpt         TEXT,
    body            TEXT,
    html_body       TEXT,
    ghost_url       TEXT,
    ghost_id        TEXT,
    seo_title       TEXT,
    seo_description TEXT,
    featured_image  TEXT,
    tags            TEXT[] DEFAULT '{}',
    word_count      INTEGER DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'failed', 'archived')),
    qa_passed       BOOLEAN,
    qa_result       JSONB DEFAULT '{}',
    social_content  JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_type ON articles (type);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_match ON articles (match_id);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles (created_at DESC);

-- ─── Social Queue ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id      TEXT,
    platform        TEXT NOT NULL
                    CHECK (platform IN ('twitter', 'tiktok', 'instagram', 'bluesky')),
    content         JSONB NOT NULL DEFAULT '{}',
    images          TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'posted', 'failed')),
    scheduled_for   TIMESTAMPTZ NOT NULL,
    posted_at       TIMESTAMPTZ,
    external_id     TEXT,
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_queue_status ON social_queue (status);
CREATE INDEX IF NOT EXISTS idx_social_queue_scheduled ON social_queue (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_queue_platform ON social_queue (platform);
CREATE INDEX IF NOT EXISTS idx_social_queue_due
    ON social_queue (scheduled_for)
    WHERE status = 'queued';

-- ─── Standings ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS standings (
    id              TEXT PRIMARY KEY,
    team            TEXT NOT NULL,
    team_id         TEXT,
    position        INTEGER NOT NULL,
    points          INTEGER NOT NULL DEFAULT 0,
    wins            INTEGER NOT NULL DEFAULT 0,
    draws           INTEGER NOT NULL DEFAULT 0,
    losses          INTEGER NOT NULL DEFAULT 0,
    goals_for       INTEGER NOT NULL DEFAULT 0,
    goals_against   INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    form            TEXT[] DEFAULT '{}',
    games_played    INTEGER NOT NULL DEFAULT 0,
    season          INTEGER NOT NULL DEFAULT 2026,
    conference      TEXT DEFAULT 'Eastern',
    ppg             NUMERIC(4,2) GENERATED ALWAYS AS (
                        CASE WHEN games_played > 0
                             THEN ROUND(points::NUMERIC / games_played, 2)
                             ELSE 0 END
                    ) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_standings_season ON standings (season);
CREATE INDEX IF NOT EXISTS idx_standings_conference ON standings (conference);
CREATE INDEX IF NOT EXISTS idx_standings_position ON standings (position);

-- ─── Standings History (for bump chart) ─────────────────────────────

CREATE TABLE IF NOT EXISTS standings_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week            INTEGER NOT NULL,
    season          INTEGER NOT NULL DEFAULT 2026,
    team            TEXT NOT NULL,
    team_id         TEXT,
    position        INTEGER NOT NULL,
    points          INTEGER NOT NULL DEFAULT 0,
    conference      TEXT DEFAULT 'Eastern',
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(season, week, team)
);

CREATE INDEX IF NOT EXISTS idx_standings_history_week ON standings_history (season, week);

-- ─── Player Stats ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_stats (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    team            TEXT NOT NULL,
    position        TEXT,
    season          INTEGER NOT NULL DEFAULT 2026,
    games_played    INTEGER DEFAULT 0,
    minutes         INTEGER DEFAULT 0,
    goals           INTEGER DEFAULT 0,
    assists         INTEGER DEFAULT 0,
    xg              NUMERIC(6,3) DEFAULT 0,
    xa              NUMERIC(6,3) DEFAULT 0,
    goals_added     NUMERIC(6,3),
    key_passes      INTEGER,
    tackles_won     INTEGER,
    interceptions   INTEGER,
    aerial_duels_won INTEGER,
    pass_completion NUMERIC(5,2),
    progressive_passes INTEGER,
    progressive_carries INTEGER,
    shot_creating_actions INTEGER,
    goal_creating_actions INTEGER,
    xg_per_90       NUMERIC(5,3) GENERATED ALWAYS AS (
                        CASE WHEN minutes > 0
                             THEN ROUND((xg / (minutes::NUMERIC / 90)), 3)
                             ELSE 0 END
                    ) STORED,
    xa_per_90       NUMERIC(5,3) GENERATED ALWAYS AS (
                        CASE WHEN minutes > 0
                             THEN ROUND((xa / (minutes::NUMERIC / 90)), 3)
                             ELSE 0 END
                    ) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_stats_team ON player_stats (team);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats (season);
CREATE INDEX IF NOT EXISTS idx_player_stats_position ON player_stats (position);
CREATE INDEX IF NOT EXISTS idx_player_stats_name ON player_stats USING gin (name gin_trgm_ops);

-- ─── Updated-at triggers ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_social_queue_updated_at
    BEFORE UPDATE ON social_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_standings_updated_at
    BEFORE UPDATE ON standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_player_stats_updated_at
    BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for published data
CREATE POLICY "Public read matches"
    ON matches FOR SELECT
    USING (true);

CREATE POLICY "Public read articles"
    ON articles FOR SELECT
    USING (status = 'published');

CREATE POLICY "Public read standings"
    ON standings FOR SELECT
    USING (true);

CREATE POLICY "Public read standings_history"
    ON standings_history FOR SELECT
    USING (true);

CREATE POLICY "Public read player_stats"
    ON player_stats FOR SELECT
    USING (true);

-- Service role has full access (via SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service write matches"
    ON matches FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write articles"
    ON articles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write social_queue"
    ON social_queue FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write standings"
    ON standings FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write standings_history"
    ON standings_history FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write player_stats"
    ON player_stats FOR ALL
    USING (auth.role() = 'service_role');
