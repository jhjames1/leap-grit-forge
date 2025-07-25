-- Function to automatically update specialist status based on calendar
CREATE OR REPLACE FUNCTION public.update_specialist_status_from_calendar_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  specialist_record RECORD;
  current_time TIMESTAMPTZ;
  day_name TEXT;
  working_hours JSONB;
  current_appointment RECORD;
  exception_record RECORD;
  upcoming_appointment RECORD;
  new_status TEXT;
BEGIN
  current_time := now();
  
  -- Loop through all active specialists
  FOR specialist_record IN 
    SELECT ps.id, ps.user_id 
    FROM public.peer_specialists ps
    WHERE ps.is_active = true AND ps.is_verified = true
  LOOP
    new_status := 'offline'; -- Default status
    
    -- Check if specialist has an active appointment right now
    SELECT * INTO current_appointment
    FROM public.specialist_appointments
    WHERE specialist_id = specialist_record.id
    AND status IN ('confirmed', 'in_progress')
    AND scheduled_start <= current_time
    AND scheduled_end > current_time;
    
    -- Check for availability exceptions (blocked times)
    SELECT * INTO exception_record
    FROM public.specialist_availability_exceptions
    WHERE specialist_id = specialist_record.id
    AND exception_type = 'unavailable'
    AND start_time <= current_time
    AND end_time > current_time;
    
    -- Check for upcoming appointment in next 15 minutes
    SELECT * INTO upcoming_appointment
    FROM public.specialist_appointments
    WHERE specialist_id = specialist_record.id
    AND status IN ('scheduled', 'confirmed')
    AND scheduled_start > current_time
    AND scheduled_start <= current_time + interval '15 minutes';
    
    -- If has active appointment or blocked time, set to busy
    IF current_appointment.id IS NOT NULL OR exception_record.id IS NOT NULL THEN
      new_status := 'busy';
    ELSE
      -- Check if within working hours
      SELECT working_hours INTO working_hours
      FROM public.specialist_calendar_settings
      WHERE specialist_id = specialist_record.id;
      
      IF working_hours IS NOT NULL THEN
        -- Get current day name
        day_name := lower(to_char(current_time, 'Day'));
        day_name := trim(day_name);
        
        -- Check if day is enabled and within hours
        IF (working_hours -> day_name ->> 'enabled')::boolean = true THEN
          DECLARE
            start_time TIME;
            end_time TIME;
            current_time_only TIME;
          BEGIN
            start_time := (working_hours -> day_name ->> 'start')::TIME;
            end_time := (working_hours -> day_name ->> 'end')::TIME;
            current_time_only := current_time::TIME;
            
            IF current_time_only >= start_time AND current_time_only <= end_time THEN
              -- Within working hours
              IF upcoming_appointment.id IS NOT NULL THEN
                new_status := 'busy'; -- Upcoming appointment soon
              ELSE
                new_status := 'online'; -- Available
              END IF;
            END IF;
          END;
        END IF;
      END IF;
    END IF;
    
    -- Update specialist status (only if not manually overridden recently)
    INSERT INTO public.specialist_status (specialist_id, status, status_message, updated_at)
    VALUES (
      specialist_record.id, 
      new_status,
      CASE 
        WHEN new_status = 'busy' AND current_appointment.id IS NOT NULL THEN 'In appointment'
        WHEN new_status = 'busy' AND upcoming_appointment.id IS NOT NULL THEN 'Appointment starting soon'
        WHEN new_status = 'busy' AND exception_record.id IS NOT NULL THEN 'Unavailable'
        WHEN new_status = 'online' THEN 'Available'
        ELSE 'Offline'
      END,
      current_time
    )
    ON CONFLICT (specialist_id) 
    DO UPDATE SET 
      status = EXCLUDED.status,
      status_message = EXCLUDED.status_message,
      updated_at = EXCLUDED.updated_at
    -- Only update if not manually set in the last 30 minutes
    WHERE specialist_status.updated_at < current_time - interval '30 minutes'
       OR specialist_status.status != EXCLUDED.status;
    
  END LOOP;
END;
$$;

-- Create a trigger function that runs the status update when appointments change
CREATE OR REPLACE FUNCTION public.trigger_specialist_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update status for the affected specialist
  PERFORM public.update_specialist_status_from_calendar_schedule();
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for appointment changes
DROP TRIGGER IF EXISTS update_specialist_status_on_appointment_change ON public.specialist_appointments;
CREATE TRIGGER update_specialist_status_on_appointment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.specialist_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_specialist_status_update();

-- Add triggers for availability exception changes  
DROP TRIGGER IF EXISTS update_specialist_status_on_exception_change ON public.specialist_availability_exceptions;
CREATE TRIGGER update_specialist_status_on_exception_change
  AFTER INSERT OR UPDATE OR DELETE ON public.specialist_availability_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_specialist_status_update();

-- Add triggers for working hours changes
DROP TRIGGER IF EXISTS update_specialist_status_on_schedule_change ON public.specialist_calendar_settings;
CREATE TRIGGER update_specialist_status_on_schedule_change
  AFTER UPDATE ON public.specialist_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_specialist_status_update();