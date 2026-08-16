-- 1) Histórico de versões do plano
ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS versao integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

CREATE INDEX IF NOT EXISTS action_plans_user_status_idx
  ON public.action_plans (user_id, status, created_at DESC);

-- 2) Lembretes de prazo
CREATE TABLE IF NOT EXISTS public.plan_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  priority_index integer NOT NULL,
  titulo text NOT NULL,
  pilar text,
  risco text NOT NULL DEFAULT 'medio',
  due_date date NOT NULL,
  offset_days integer NOT NULL,
  channel text NOT NULL DEFAULT 'app',
  sent_at timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (plan_id, priority_index, offset_days)
);

CREATE INDEX IF NOT EXISTS plan_reminders_due_idx
  ON public.plan_reminders (due_date, offset_days) WHERE sent_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_reminders TO authenticated;
GRANT ALL ON public.plan_reminders TO service_role;

ALTER TABLE public.plan_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own plan_reminders"
  ON public.plan_reminders FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_plan_reminders_updated_at
  BEFORE UPDATE ON public.plan_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Rotina diária de lembretes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('legal-health-plan-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'legal-health-plan-reminders');

SELECT cron.schedule(
  'legal-health-plan-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--c7041bcd-fbf8-4677-8700-0575865b4aa6.lovable.app/api/public/hooks/plan-reminders',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_F7dhS0q4URh9LpPjqWD37A_yD2azYzd"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  ) as request_id;
  $$
);