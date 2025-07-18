
-- Create a function to sync working hours to specialist schedules
CREATE OR REPLACE FUNCTION sync_working_hours_to_schedules(
  p_specialist_id UUID,
  p_working_hours JSONB
) RETURNS VOID AS $$
DECLARE
  day_record RECORD;
  day_num INTEGER;
  start_time TIME;
  end_time TIME;
  is_enabled BOOLEAN;
BEGIN
  -- Delete existing schedules for this specialist
  DELETE FROM specialist_schedules 
  WHERE specialist_id = p_specialist_id 
  AND is_recurring = true;

  -- Loop through each day of the week
  FOR day_record IN 
    SELECT * FROM jsonb_each(p_working_hours)
  LOOP
    -- Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
    CASE day_record.key
      WHEN 'sunday' THEN day_num := 0;
      WHEN 'monday' THEN day_num := 1;
      WHEN 'tuesday' THEN day_num := 2;
      WHEN 'wednesday' THEN day_num := 3;
      WHEN 'thursday' THEN day_num := 4;
      WHEN 'friday' THEN day_num := 5;
      WHEN 'saturday' THEN day_num := 6;
      ELSE CONTINUE;
    END CASE;

    -- Extract day settings
    is_enabled := COALESCE((day_record.value->>'enabled')::BOOLEAN, false);
    
    IF is_enabled THEN
      start_time := (day_record.value->>'start')::TIME;
      end_time := (day_record.value->>'end')::TIME;
      
      -- Get the default appointment type (first active one)
      INSERT INTO specialist_schedules (
        specialist_id,
        day_of_week,
        start_time,
        end_time,
        appointment_type_id,
        is_recurring,
        is_active
      )
      SELECT 
        p_specialist_id,
        day_num,
        start_time,
        end_time,
        at.id,
        true,
        true
      FROM appointment_types at
      WHERE at.is_active = true
      ORDER BY at.created_at
      LIMIT 1;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically sync working hours
CREATE OR REPLACE FUNCTION trigger_sync_working_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if working_hours changed
  IF OLD.working_hours IS DISTINCT FROM NEW.working_hours THEN
    PERFORM sync_working_hours_to_schedules(NEW.specialist_id, NEW.working_hours);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_working_hours_trigger ON specialist_calendar_settings;
CREATE TRIGGER sync_working_hours_trigger
  AFTER UPDATE ON specialist_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_working_hours();

-- Also create trigger for initial insert
DROP TRIGGER IF EXISTS sync_working_hours_insert_trigger ON specialist_calendar_settings;
CREATE TRIGGER sync_working_hours_insert_trigger
  AFTER INSERT ON specialist_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_working_hours();
