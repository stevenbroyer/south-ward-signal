-- Add 'cancelled' as valid match status
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE matches ADD CONSTRAINT matches_status_check 
  CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled'));
