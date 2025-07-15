-- Create AI-generated journeys table
CREATE TABLE public.ai_generated_journeys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_name text NOT NULL,
  focus_area text NOT NULL,
  days jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1
);

-- Create AI phase modifiers table  
CREATE TABLE public.ai_phase_modifiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_name text NOT NULL,
  journey_stage text NOT NULL,
  tone text NOT NULL,
  pacing text NOT NULL,
  extras jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Create user journey assignments table
CREATE TABLE public.user_journey_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  journey_id uuid NOT NULL REFERENCES public.ai_generated_journeys(id),
  phase_modifier_id uuid REFERENCES public.ai_phase_modifiers(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Create Week 1 universal data collection table
CREATE TABLE public.week1_universal_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  triggers jsonb,
  support_triangle jsonb,
  core_why text,
  identity_words text[],
  safe_space text,
  reflection text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user recovery plans table
CREATE TABLE public.user_recovery_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_content jsonb NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true
);

-- Enable RLS on all tables
ALTER TABLE public.ai_generated_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_phase_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.week1_universal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recovery_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_generated_journeys
CREATE POLICY "Anyone can view active journeys" 
ON public.ai_generated_journeys 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage journeys" 
ON public.ai_generated_journeys 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- RLS policies for ai_phase_modifiers
CREATE POLICY "Anyone can view active modifiers" 
ON public.ai_phase_modifiers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage modifiers" 
ON public.ai_phase_modifiers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- RLS policies for user_journey_assignments
CREATE POLICY "Users can view their own assignments" 
ON public.user_journey_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments" 
ON public.user_journey_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" 
ON public.user_journey_assignments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for week1_universal_data
CREATE POLICY "Users can view their own Week 1 data" 
ON public.week1_universal_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Week 1 data" 
ON public.week1_universal_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Week 1 data" 
ON public.week1_universal_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for user_recovery_plans
CREATE POLICY "Users can view their own recovery plans" 
ON public.user_recovery_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recovery plans" 
ON public.user_recovery_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery plans" 
ON public.user_recovery_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_ai_generated_journeys_focus_area ON public.ai_generated_journeys(focus_area);
CREATE INDEX idx_ai_generated_journeys_active ON public.ai_generated_journeys(is_active);
CREATE INDEX idx_ai_phase_modifiers_stage ON public.ai_phase_modifiers(journey_stage);
CREATE INDEX idx_ai_phase_modifiers_active ON public.ai_phase_modifiers(is_active);
CREATE INDEX idx_user_journey_assignments_user ON public.user_journey_assignments(user_id);
CREATE INDEX idx_user_journey_assignments_journey ON public.user_journey_assignments(journey_id);
CREATE INDEX idx_user_journey_assignments_active ON public.user_journey_assignments(is_active);
CREATE INDEX idx_week1_universal_data_user ON public.week1_universal_data(user_id);
CREATE INDEX idx_user_recovery_plans_user ON public.user_recovery_plans(user_id);
CREATE INDEX idx_user_recovery_plans_current ON public.user_recovery_plans(is_current);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_ai_generated_journeys_updated_at
  BEFORE UPDATE ON public.ai_generated_journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_phase_modifiers_updated_at
  BEFORE UPDATE ON public.ai_phase_modifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_journey_assignments_updated_at
  BEFORE UPDATE ON public.user_journey_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_week1_universal_data_updated_at
  BEFORE UPDATE ON public.week1_universal_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_recovery_plans_updated_at
  BEFORE UPDATE ON public.user_recovery_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();