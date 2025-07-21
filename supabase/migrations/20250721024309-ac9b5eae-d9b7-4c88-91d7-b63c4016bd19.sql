-- Fix the chat_messages constraint to allow 'system' sender_type
-- First drop the existing constraint
ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_sender_type_check;

-- Add the corrected constraint that includes 'system'
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_sender_type_check 
CHECK (sender_type = ANY (ARRAY['user'::text, 'specialist'::text, 'system'::text]));