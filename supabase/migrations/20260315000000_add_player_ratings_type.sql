-- Add player-ratings to allowed article types
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_type_check
  CHECK (type IN (
    'match-recap', 'pre-match-preview', 'player-spotlight',
    'power-rankings', 'transfer-intel', 'stat-of-week',
    'weekly-roundup', 'player-ratings'
  ));
