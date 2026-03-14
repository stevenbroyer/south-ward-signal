-- Fix lineup ID overflow (IDs > 2^31 from SportMonks)
ALTER TABLE sm_lineups ALTER COLUMN id TYPE BIGINT;

-- Fix lineup_stats to handle boolean-like values
-- No schema change needed — we'll filter in the sync script
