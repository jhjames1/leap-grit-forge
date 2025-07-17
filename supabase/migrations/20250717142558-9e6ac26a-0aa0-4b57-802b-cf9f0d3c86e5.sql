-- Fix day completion tracking: change completed_days to integer array and add completion_dates
ALTER TABLE user_journey_progress 
DROP COLUMN completed_days;

ALTER TABLE user_journey_progress 
ADD COLUMN completed_days integer[] DEFAULT '{}';

ALTER TABLE user_journey_progress 
ADD COLUMN completion_dates jsonb DEFAULT '{}';

-- Update existing records to convert old count-based data
UPDATE user_journey_progress 
SET completed_days = CASE 
  WHEN current_day > 1 THEN 
    (SELECT ARRAY(SELECT generate_series(1, current_day - 1)))
  ELSE 
    '{}'::integer[]
END;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_completed_days 
ON user_journey_progress USING GIN (completed_days);