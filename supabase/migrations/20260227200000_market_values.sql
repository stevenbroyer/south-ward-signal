-- ═══════════════════════════════════════════════════════════════════
-- South Ward Signal — Market Values & Transfers
-- ═══════════════════════════════════════════════════════════════════

-- ─── Player Market Values ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_market_values (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name     TEXT NOT NULL,
    team            TEXT,
    date            DATE NOT NULL,
    value_eur       BIGINT NOT NULL DEFAULT 0,
    transfermarkt_id INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_name, date)
);

CREATE INDEX IF NOT EXISTS idx_player_market_values_name ON player_market_values (player_name);
CREATE INDEX IF NOT EXISTS idx_player_market_values_date ON player_market_values (date DESC);

-- ─── Player Transfers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_transfers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name     TEXT NOT NULL,
    from_club       TEXT,
    to_club         TEXT,
    transfer_date   DATE,
    fee_eur         BIGINT,
    fee_text        TEXT,
    season          TEXT,
    transfermarkt_id INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_name, transfer_date, to_club)
);

CREATE INDEX IF NOT EXISTS idx_player_transfers_name ON player_transfers (player_name);

-- ─── Row Level Security ─────────────────────────────────────────
ALTER TABLE player_market_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read player_market_values" ON player_market_values FOR SELECT USING (true);
CREATE POLICY "Public read player_transfers" ON player_transfers FOR SELECT USING (true);
CREATE POLICY "Service write player_market_values" ON player_market_values FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write player_transfers" ON player_transfers FOR ALL USING (auth.role() = 'service_role');
