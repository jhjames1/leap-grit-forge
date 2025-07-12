-- Create table for specialist motivational content
CREATE TABLE public.specialist_motivational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('quote', 'video', 'audio', 'image')),
  category TEXT NOT NULL CHECK (category IN ('daily_inspiration', 'success_stories', 'professional_tips', 'self_care')),
  media_url TEXT,
  author TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track which content specialists have seen
CREATE TABLE public.specialist_content_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.specialist_motivational_content(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  UNIQUE(specialist_id, content_id)
);

-- Enable RLS
ALTER TABLE public.specialist_motivational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_content_views ENABLE ROW LEVEL SECURITY;

-- Create policies for motivational content
CREATE POLICY "Anyone can view active motivational content" 
ON public.specialist_motivational_content 
FOR SELECT 
USING (is_active = true);

-- Create policies for content views
CREATE POLICY "Specialists can view their own content views" 
ON public.specialist_content_views 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM peer_specialists 
  WHERE id = specialist_content_views.specialist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Specialists can insert their own content views" 
ON public.specialist_content_views 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM peer_specialists 
  WHERE id = specialist_content_views.specialist_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Specialists can update their own content views" 
ON public.specialist_content_views 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM peer_specialists 
  WHERE id = specialist_content_views.specialist_id 
  AND user_id = auth.uid()
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_specialist_motivational_content_updated_at
BEFORE UPDATE ON public.specialist_motivational_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample motivational content
INSERT INTO public.specialist_motivational_content (title, content, content_type, category, author) VALUES
('Daily Inspiration', 'Every person you help today is a life touched by hope. Your compassion creates ripples of healing that extend far beyond what you can see.', 'quote', 'daily_inspiration', 'Recovery Community'),
('Your Impact Matters', 'Recovery is not a destination, but a journey of courage. As a peer specialist, you are both a guide and a living testament to the power of transformation.', 'quote', 'daily_inspiration', 'Peer Support Network'),
('Strength in Vulnerability', 'Sharing your story takes incredible courage. Every time you open up about your journey, you give someone else permission to hope.', 'quote', 'professional_tips', 'Mental Health Alliance'),
('Self-Care Reminder', 'You cannot pour from an empty cup. Taking care of yourself is not selfish—it''s essential for being able to help others effectively.', 'quote', 'self_care', 'Wellness Team'),
('Success Story', 'Today marks another day of someone choosing recovery over addiction, hope over despair. Your support made that choice possible.', 'quote', 'success_stories', 'Recovery Stories'),
('Professional Growth', 'Every challenge you face as a peer specialist teaches you something new about resilience, both yours and others''.', 'quote', 'professional_tips', 'Peer Excellence Program');