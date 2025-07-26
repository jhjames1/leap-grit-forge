-- Create app_screenshots table for storing application screenshots
CREATE TABLE public.app_screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  route TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  section TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_screenshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage app screenshots" 
ON public.app_screenshots 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Anyone can view active app screenshots" 
ON public.app_screenshots 
FOR SELECT 
USING (is_active = true);

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-screenshots', 'app-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Admins can upload app screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'app-screenshots' AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view app screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-screenshots');

-- Add trigger for updating timestamps
CREATE TRIGGER update_app_screenshots_updated_at
  BEFORE UPDATE ON public.app_screenshots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();