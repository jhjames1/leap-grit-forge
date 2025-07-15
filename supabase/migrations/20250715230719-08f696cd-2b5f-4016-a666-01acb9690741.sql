-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio-content', 'audio-content', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']);

-- Create policies for audio content bucket
CREATE POLICY "Anyone can view audio content" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-content');

CREATE POLICY "Admins can upload audio content" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-content' AND (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
)));

CREATE POLICY "Admins can update audio content" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'audio-content' AND (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
)));

CREATE POLICY "Admins can delete audio content" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-content' AND (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
)));