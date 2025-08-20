-- Create function to synchronize specialist appointments with scheduled appointments
CREATE OR REPLACE FUNCTION sync_specialist_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update corresponding scheduled_appointment when specialist_appointment changes
  IF TG_OP = 'UPDATE' THEN
    UPDATE scheduled_appointments 
    SET 
      scheduled_start = NEW.scheduled_start,
      scheduled_end = NEW.scheduled_end,
      status = CASE 
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'completed' THEN 'completed'
        WHEN NEW.status = 'confirmed' THEN 'confirmed'
        WHEN NEW.status = 'scheduled' THEN 'scheduled'
        ELSE scheduled_appointments.status
      END,
      updated_at = now()
    WHERE id = NEW.scheduled_appointment_id;
    
    -- Log the synchronization
    INSERT INTO user_activity_logs (user_id, action, type, details)
    VALUES (
      NEW.user_id,
      'appointment_synchronized',
      'calendar_sync',
      json_build_object(
        'specialist_appointment_id', NEW.id,
        'scheduled_appointment_id', NEW.scheduled_appointment_id,
        'old_start', OLD.scheduled_start,
        'new_start', NEW.scheduled_start,
        'old_end', OLD.scheduled_end,
        'new_end', NEW.scheduled_end
      )::text
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for specialist appointment synchronization
CREATE TRIGGER sync_specialist_appointments_trigger
  AFTER UPDATE ON specialist_appointments
  FOR EACH ROW
  EXECUTE FUNCTION sync_specialist_appointment_changes();

-- Add scheduled_appointment_id column to specialist_appointments if it doesn't exist
ALTER TABLE specialist_appointments 
ADD COLUMN IF NOT EXISTS scheduled_appointment_id UUID REFERENCES scheduled_appointments(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_specialist_appointments_scheduled_id 
ON specialist_appointments(scheduled_appointment_id);