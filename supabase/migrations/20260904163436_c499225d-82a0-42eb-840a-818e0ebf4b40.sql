CREATE OR REPLACE FUNCTION public.funil_landing(_desde timestamptz, _rota text DEFAULT NULL)
RETURNS TABLE (
  etapa text,
  sessoes bigint,
  eventos bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT e.event AS etapa,
         count(DISTINCT e.session_key) AS sessoes,
         count(*) AS eventos
  FROM public.landing_events e
  WHERE e.created_at >= _desde
    AND (_rota IS NULL OR e.rota = _rota)
  GROUP BY e.event
$$;