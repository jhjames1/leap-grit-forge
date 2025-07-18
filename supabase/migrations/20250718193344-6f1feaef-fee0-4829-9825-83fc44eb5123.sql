-- Enable real-time updates for chat sessions
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Enable real-time updates for chat messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable real-time updates for appointment proposals
ALTER TABLE public.appointment_proposals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_proposals;

-- Enable real-time updates for specialist appointments
ALTER TABLE public.specialist_appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.specialist_appointments;

-- Enable real-time updates for specialist status
ALTER TABLE public.specialist_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.specialist_status;