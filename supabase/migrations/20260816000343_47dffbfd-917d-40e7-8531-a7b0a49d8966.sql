DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('legal-health-plan-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'legal-health-plan-reminders');

SELECT cron.schedule(
  'legal-health-plan-reminders',
  '0 9 * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://project--c7041bcd-fbf8-4677-8700-0575865b4aa6.lovable.app/api/public/hooks/plan-reminders',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_F7dhS0q4URh9LpPjqWD37A_yD2azYzd"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  ) as request_id;
  $$
);