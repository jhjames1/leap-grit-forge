-- Create manual content management tables
CREATE TABLE public.manual_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  icon text,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.manual_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES public.manual_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'markdown', -- markdown, html, component
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.manual_change_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path text NOT NULL,
  change_type text NOT NULL, -- component_added, component_modified, component_removed, route_added, etc.
  affected_sections text[], -- array of section IDs that might be affected
  change_description text,
  auto_updated boolean DEFAULT false,
  requires_review boolean DEFAULT true,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_change_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_sections
CREATE POLICY "Anyone can view active manual sections"
ON public.manual_sections
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage manual sections"
ON public.manual_sections
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for manual_content  
CREATE POLICY "Anyone can view active manual content"
ON public.manual_content
FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM public.manual_sections 
  WHERE id = manual_content.section_id AND is_active = true
));

CREATE POLICY "Admins can manage manual content"
ON public.manual_content
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS Policies for manual_change_tracking
CREATE POLICY "Admins can view change tracking"
ON public.manual_change_tracking
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "System can create change tracking records"
ON public.manual_change_tracking
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update change tracking"
ON public.manual_change_tracking
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add triggers for updated_at
CREATE TRIGGER update_manual_sections_updated_at
  BEFORE UPDATE ON public.manual_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manual_content_updated_at
  BEFORE UPDATE ON public.manual_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial manual sections based on current structure
INSERT INTO public.manual_sections (title, description, icon, order_index) VALUES
('overview', 'Overview and introduction to the Specialist Portal', 'BookOpen', 1),
('authentication', 'Login and security procedures', 'LogIn', 2),
('dashboard', 'Dashboard navigation and features', 'Monitor', 3),
('chat-sessions', 'Managing chat sessions with users', 'MessageSquare', 4),
('calendar', 'Calendar management and scheduling', 'Calendar', 5),
('training', 'Training modules and development', 'GraduationCap', 6),
('performance', 'Performance metrics and analytics', 'BarChart3', 7),
('communication', 'Communication tools and phone features', 'Phone', 8),
('settings', 'Settings and preferences', 'Settings', 9),
('troubleshooting', 'Common issues and solutions', 'AlertCircle', 10),
('best-practices', 'Best practices and guidelines', 'Star', 11),
('faq', 'Frequently asked questions', 'HelpCircle', 12);