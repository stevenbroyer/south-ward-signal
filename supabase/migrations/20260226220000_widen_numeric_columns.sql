-- Widen numeric columns that overflow with ASA data
ALTER TABLE team_season_stats ALTER COLUMN goals_added TYPE NUMERIC(8,3);
ALTER TABLE team_season_stats ALTER COLUMN xpass TYPE NUMERIC(8,3);
