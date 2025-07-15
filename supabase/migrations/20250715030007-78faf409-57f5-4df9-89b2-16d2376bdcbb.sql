-- Update existing foreman_content with content type keywords
UPDATE foreman_content 
SET trigger_keywords = CASE 
  WHEN content_type = 'video' THEN 
    COALESCE(trigger_keywords, '{}') || ARRAY['video', 'videos', 'watch', 'watching', 'see', 'viewing', 'play']
  WHEN content_type = 'image' THEN 
    COALESCE(trigger_keywords, '{}') || ARRAY['image', 'images', 'picture', 'pictures', 'photo', 'photos', 'visual']
  WHEN content_type = 'audio' THEN 
    COALESCE(trigger_keywords, '{}') || ARRAY['audio', 'listen', 'listening', 'hear', 'hearing', 'sound']
  WHEN content_type = 'quote' THEN 
    COALESCE(trigger_keywords, '{}') || ARRAY['quote', 'quotes', 'saying', 'sayings', 'words', 'phrase', 'inspiration']
  WHEN content_type = 'story' THEN 
    COALESCE(trigger_keywords, '{}') || ARRAY['story', 'stories', 'experience', 'experiences', 'share', 'tell']
  WHEN content_type = 'tip' THEN 
    COALESCE(trigger_keywords, '{}') || ARRAY['tip', 'tips', 'advice', 'guidance', 'help', 'how']
  ELSE trigger_keywords
END
WHERE is_active = true;