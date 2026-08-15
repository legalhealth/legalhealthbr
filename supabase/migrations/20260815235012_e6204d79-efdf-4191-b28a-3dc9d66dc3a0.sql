CREATE TABLE public.ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL DEFAULT 'ai-chat',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai_usage" ON public.ai_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own ai_usage" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX ai_usage_user_created_idx ON public.ai_usage (user_id, created_at DESC);