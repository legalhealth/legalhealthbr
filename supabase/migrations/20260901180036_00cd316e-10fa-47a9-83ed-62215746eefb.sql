ALTER TABLE public.chat_threads ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'assistente';

CREATE TABLE IF NOT EXISTS public.chatbot_public_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chatbot_public_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chatbot_public_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chatbot_public_messages_session_idx
  ON public.chatbot_public_messages (session_id, created_at);

GRANT ALL ON public.chatbot_public_sessions TO service_role;
GRANT ALL ON public.chatbot_public_messages TO service_role;

ALTER TABLE public.chatbot_public_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_public_messages ENABLE ROW LEVEL SECURITY;