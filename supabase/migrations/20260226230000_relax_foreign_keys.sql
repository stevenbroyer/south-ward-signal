-- Drop FK from team_match_advanced to matches so advanced stats 
-- can be seeded from ASA independently of API-Football matches
ALTER TABLE team_match_advanced DROP CONSTRAINT IF EXISTS team_match_advanced_match_id_fkey;
ALTER TABLE team_match_advanced ALTER COLUMN match_id TYPE TEXT;
