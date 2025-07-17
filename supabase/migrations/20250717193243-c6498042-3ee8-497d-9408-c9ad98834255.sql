-- Phase 1: Enhanced Database Schema & Calendar Backend

-- Create appointment_types table first (referenced by other tables)
CREATE TABLE public.appointment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default appointment types
INSERT INTO public.appointment_types (name, description, default_duration, color) VALUES
('Quick Chat', 'Brief text/voice chat session', 15, '#10B981'),
('Phone Call', 'Scheduled phone conversation', 30, '#3B82F6'),
('Video Session', 'Video conference meeting', 60, '#8B5CF6'),
('In-Person Meeting', 'Face-to-face meeting', 90, '#F59E0B');

-- Enhance specialist_schedules table
ALTER TABLE public.specialist_schedules 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES public.appointment_types(id),
ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB DEFAULT '{"type": "weekly", "interval": 1}',
ADD COLUMN IF NOT EXISTS max_bookings_per_slot INTEGER DEFAULT 1;

-- Create specialist_appointments table
CREATE TABLE public.specialist_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appointment_type_id UUID NOT NULL REFERENCES public.appointment_types(id),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_type TEXT NOT NULL DEFAULT 'chat' CHECK (meeting_type IN ('chat', 'phone', 'video', 'in_person')),
  location TEXT, -- for in-person meetings
  meeting_url TEXT, -- for video meetings
  notes TEXT,
  cancellation_reason TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create specialist_availability_exceptions table
CREATE TABLE public.specialist_availability_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE,
  exception_type TEXT NOT NULL DEFAULT 'unavailable' CHECK (exception_type IN ('unavailable', 'available', 'busy')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create specialist_calendar_settings table
CREATE TABLE public.specialist_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES public.peer_specialists(id) ON DELETE CASCADE UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  default_appointment_duration INTEGER NOT NULL DEFAULT 30,
  buffer_time_minutes INTEGER NOT NULL DEFAULT 15,
  minimum_notice_hours INTEGER NOT NULL DEFAULT 2,
  maximum_booking_days INTEGER NOT NULL DEFAULT 30,
  auto_confirm_bookings BOOLEAN NOT NULL DEFAULT true,
  allow_back_to_back_bookings BOOLEAN NOT NULL DEFAULT false,
  working_hours JSONB NOT NULL DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
  notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "app": true}',
  external_calendar_sync JSONB DEFAULT '{"enabled": false, "provider": null, "calendar_id": null}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_types
CREATE POLICY "Anyone can view active appointment types"
  ON public.appointment_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage appointment types"
  ON public.appointment_types FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for specialist_appointments
CREATE POLICY "Specialists can view their own appointments"
  ON public.specialist_appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_appointments.specialist_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own appointments"
  ON public.specialist_appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments"
  ON public.specialist_appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Specialists can update their appointments"
  ON public.specialist_appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_appointments.specialist_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can cancel their appointments"
  ON public.specialist_appointments FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('scheduled', 'confirmed'));

-- RLS Policies for specialist_availability_exceptions
CREATE POLICY "Specialists can manage their own availability exceptions"
  ON public.specialist_availability_exceptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_availability_exceptions.specialist_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view availability exceptions"
  ON public.specialist_availability_exceptions FOR SELECT
  USING (true);

-- RLS Policies for specialist_calendar_settings
CREATE POLICY "Specialists can manage their own calendar settings"
  ON public.specialist_calendar_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.peer_specialists 
    WHERE id = specialist_calendar_settings.specialist_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view calendar settings"
  ON public.specialist_calendar_settings FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_specialist_appointments_specialist_id ON public.specialist_appointments(specialist_id);
CREATE INDEX idx_specialist_appointments_user_id ON public.specialist_appointments(user_id);
CREATE INDEX idx_specialist_appointments_scheduled_start ON public.specialist_appointments(scheduled_start);
CREATE INDEX idx_specialist_appointments_status ON public.specialist_appointments(status);
CREATE INDEX idx_specialist_availability_exceptions_specialist_id ON public.specialist_availability_exceptions(specialist_id);
CREATE INDEX idx_specialist_availability_exceptions_time_range ON public.specialist_availability_exceptions(start_time, end_time);
CREATE INDEX idx_specialist_schedules_specialist_id ON public.specialist_schedules(specialist_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_appointment_types_updated_at
  BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialist_appointments_updated_at
  BEFORE UPDATE ON public.specialist_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialist_availability_exceptions_updated_at
  BEFORE UPDATE ON public.specialist_availability_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialist_calendar_settings_updated_at
  BEFORE UPDATE ON public.specialist_calendar_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if a specialist is available at a given time
CREATE OR REPLACE FUNCTION public.check_specialist_availability(
  p_specialist_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  settings_record RECORD;
  day_name TEXT;
  working_hours JSONB;
BEGIN
  -- Get specialist calendar settings
  SELECT * INTO settings_record 
  FROM public.specialist_calendar_settings 
  WHERE specialist_id = p_specialist_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if within working hours
  day_name := lower(to_char(p_start_time, 'Day'));
  day_name := trim(day_name);
  
  working_hours := settings_record.working_hours -> day_name;
  
  IF working_hours IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for conflicting appointments
  IF EXISTS (
    SELECT 1 FROM public.specialist_appointments 
    WHERE specialist_id = p_specialist_id
    AND status IN ('scheduled', 'confirmed', 'in_progress')
    AND (
      (scheduled_start <= p_start_time AND scheduled_end > p_start_time) OR
      (scheduled_start < p_end_time AND scheduled_end >= p_end_time) OR
      (scheduled_start >= p_start_time AND scheduled_end <= p_end_time)
    )
  ) THEN
    RETURN false;
  END IF;
  
  -- Check for availability exceptions
  IF EXISTS (
    SELECT 1 FROM public.specialist_availability_exceptions 
    WHERE specialist_id = p_specialist_id
    AND exception_type = 'unavailable'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update specialist status based on calendar
CREATE OR REPLACE FUNCTION public.update_specialist_status_from_calendar()
RETURNS TRIGGER AS $$
DECLARE
  current_appointment RECORD;
  specialist_user_id UUID;
BEGIN
  -- Get specialist user_id
  SELECT user_id INTO specialist_user_id 
  FROM public.peer_specialists 
  WHERE id = NEW.specialist_id;
  
  -- Check if specialist has an active appointment right now
  SELECT * INTO current_appointment
  FROM public.specialist_appointments
  WHERE specialist_id = NEW.specialist_id
  AND status IN ('confirmed', 'in_progress')
  AND scheduled_start <= now()
  AND scheduled_end > now();
  
  -- Update specialist status
  IF current_appointment.id IS NOT NULL THEN
    INSERT INTO public.specialist_status (specialist_id, status, status_message)
    VALUES (NEW.specialist_id, 'busy', 'In appointment')
    ON CONFLICT (specialist_id) 
    DO UPDATE SET 
      status = 'busy',
      status_message = 'In appointment',
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update status when appointments change
CREATE TRIGGER update_status_on_appointment_change
  AFTER INSERT OR UPDATE ON public.specialist_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_specialist_status_from_calendar();

-- Create default calendar settings for existing specialists
INSERT INTO public.specialist_calendar_settings (specialist_id)
SELECT id FROM public.peer_specialists
WHERE id NOT IN (SELECT specialist_id FROM public.specialist_calendar_settings);

-- Enable realtime for new tables
ALTER TABLE public.specialist_appointments REPLICA IDENTITY FULL;
ALTER TABLE public.specialist_availability_exceptions REPLICA IDENTITY FULL;
ALTER TABLE public.specialist_calendar_settings REPLICA IDENTITY FULL;
ALTER TABLE public.appointment_types REPLICA IDENTITY FULL;