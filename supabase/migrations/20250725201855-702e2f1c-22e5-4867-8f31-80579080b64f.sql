-- Create a table to track specialist module progress with string-based module IDs
CREATE TABLE IF NOT EXISTS public.specialist_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  module_id TEXT NOT NULL, -- Using TEXT to allow string IDs like 'digital-ethical-literacy'
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  score INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, module_id)
);

-- Enable RLS
ALTER TABLE public.specialist_module_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Specialists can view their own module progress" 
ON public.specialist_module_progress 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM peer_specialists ps 
  WHERE ps.id = specialist_module_progress.specialist_id 
  AND ps.user_id = auth.uid()
));

CREATE POLICY "Specialists can insert their own module progress" 
ON public.specialist_module_progress 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM peer_specialists ps 
  WHERE ps.id = specialist_module_progress.specialist_id 
  AND ps.user_id = auth.uid()
));

CREATE POLICY "Specialists can update their own module progress" 
ON public.specialist_module_progress 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM peer_specialists ps 
  WHERE ps.id = specialist_module_progress.specialist_id 
  AND ps.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_specialist_module_progress_updated_at
BEFORE UPDATE ON public.specialist_module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_specialist_module_progress_specialist_id ON public.specialist_module_progress(specialist_id);
CREATE INDEX idx_specialist_module_progress_module_id ON public.specialist_module_progress(module_id);