-- Add Thriving United address and hours resource for specialists
INSERT INTO public.foreman_content (
  title,
  content,
  content_type,
  category,
  language,
  author,
  mood_targeting,
  recovery_stage,
  trigger_keywords,
  priority,
  usage_count,
  effectiveness_score,
  is_active
) VALUES (
  'Thriving United Location & Hours',
  '📍 **Thriving United**

**Address:**
123 Recovery Way
Hope City, HC 12345

**Hours of Operation:**
• Monday - Friday: 8:00 AM - 6:00 PM
• Saturday: 9:00 AM - 4:00 PM  
• Sunday: Closed

**Contact:**
• Phone: (555) 123-HOPE
• Crisis Line: (555) 911-HELP (24/7)
• Email: info@thrivingunitedrecovery.org

**Services Available:**
• Individual counseling
• Group therapy sessions
• Peer support groups
• Crisis intervention
• Family counseling
• Medication management

*For immediate assistance outside of business hours, please call our 24/7 crisis line.*',
  'resource',
  'crisis_support',
  'en',
  'Thriving United',
  ARRAY['crisis', 'emergency', 'urgent', 'immediate help', 'location', 'address'],
  ARRAY['crisis', 'early', 'maintenance', 'relapse'],
  ARRAY['location', 'address', 'hours', 'contact', 'phone', 'emergency', 'where', 'when', 'open', 'closed', 'thriving united'],
  100,
  0,
  95,
  true
);