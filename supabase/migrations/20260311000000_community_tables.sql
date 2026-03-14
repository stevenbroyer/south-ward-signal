-- ═══════════════════════════════════════════════════════════════════
-- South Ward Signal — Community Tables
-- Match ratings, score predictions, polls, and leaderboard.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Match Ratings ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS match_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    match_id        TEXT NOT NULL /* FK to matches — will update when community features go live */,
    player_id       TEXT NOT NULL,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_ratings_match ON match_ratings (match_id);
CREATE INDEX IF NOT EXISTS idx_match_ratings_user ON match_ratings (user_id);

-- ─── Predictions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS predictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    match_id        TEXT NOT NULL /* FK to matches — will update when community features go live */,
    home_score      SMALLINT NOT NULL CHECK (home_score >= 0),
    away_score      SMALLINT NOT NULL CHECK (away_score >= 0),
    points          SMALLINT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions (match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions (user_id);

-- ─── Prediction Leaderboard (Materialized View) ───────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS prediction_leaderboard AS
SELECT
    user_id,
    COALESCE(SUM(points), 0)::INTEGER                          AS total_points,
    COUNT(*) FILTER (WHERE points = 3)::INTEGER                AS exact_scores,
    COUNT(*) FILTER (WHERE points = 1)::INTEGER                AS correct_results,
    COUNT(*)::INTEGER                                          AS total_predictions,
    RANK() OVER (ORDER BY COALESCE(SUM(points), 0) DESC)::INTEGER AS rank
FROM predictions
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prediction_leaderboard_user
    ON prediction_leaderboard (user_id);

-- ─── Polls ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS polls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question        TEXT NOT NULL,
    options         JSONB NOT NULL DEFAULT '[]',
    match_id        TEXT /* FK to matches — will update when community features go live */,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_expires ON polls (expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_match ON polls (match_id);

-- ─── Poll Votes ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS poll_votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id         UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    option_index    SMALLINT NOT NULL CHECK (option_index >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes (poll_id);

-- ─── Leaderboard Refresh Function & Trigger ────────────────────────

CREATE OR REPLACE FUNCTION refresh_prediction_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY prediction_leaderboard;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_predictions_refresh_leaderboard
    AFTER UPDATE OF points ON predictions
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_prediction_leaderboard();

-- ─── Row Level Security ────────────────────────────────────────────

ALTER TABLE match_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Public read access for all community data
CREATE POLICY "Public read match_ratings"
    ON match_ratings FOR SELECT
    USING (true);

CREATE POLICY "Public read predictions"
    ON predictions FOR SELECT
    USING (true);

CREATE POLICY "Public read polls"
    ON polls FOR SELECT
    USING (true);

CREATE POLICY "Public read poll_votes"
    ON poll_votes FOR SELECT
    USING (true);

-- Users can insert their own rows
CREATE POLICY "Users insert own match_ratings"
    ON match_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own predictions"
    ON predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own poll_votes"
    ON poll_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own rows
CREATE POLICY "Users update own match_ratings"
    ON match_ratings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own predictions"
    ON predictions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own poll_votes"
    ON poll_votes FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own rows
CREATE POLICY "Users delete own match_ratings"
    ON match_ratings FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own predictions"
    ON predictions FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own poll_votes"
    ON poll_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service write match_ratings"
    ON match_ratings FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write predictions"
    ON predictions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write polls"
    ON polls FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service write poll_votes"
    ON poll_votes FOR ALL
    USING (auth.role() = 'service_role');
