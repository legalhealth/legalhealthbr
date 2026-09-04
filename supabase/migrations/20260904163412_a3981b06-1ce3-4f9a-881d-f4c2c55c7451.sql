CREATE TABLE public.landing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key text NOT NULL CHECK (char_length(session_key) BETWEEN 8 AND 64),
  event text NOT NULL CHECK (event IN (
    'landing_view','hero_cta_click','platform_cta_click','benefits_view',
    'ambassador_section_view','application_form_view','application_start',
    'application_field_error','application_submit','faq_open','login_click',
    'diagnostic_cta_click','diagnostic_start'
  )),
  rota text CHECK (rota IS NULL OR char_length(rota) <= 80),
  secao text CHECK (secao IS NULL OR char_length(secao) <= 40),
  origem text CHECK (origem IS NULL OR char_length(origem) <= 40),
  posicao text CHECK (posicao IS NULL OR char_length(posicao) <= 40),
  id_ref text CHECK (id_ref IS NULL OR char_length(id_ref) <= 40),
  variante text CHECK (variante IS NULL OR char_length(variante) <= 40),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.landing_events TO anon, authenticated;
GRANT SELECT ON public.landing_events TO authenticated;
GRANT ALL ON public.landing_events TO service_role;

ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_events_insert_public"
  ON public.landing_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "landing_events_select_admin"
  ON public.landing_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX landing_events_created_at_idx ON public.landing_events (created_at DESC);
CREATE INDEX landing_events_event_created_idx ON public.landing_events (event, created_at DESC);

CREATE OR REPLACE FUNCTION public.funil_landing(_desde timestamptz, _rota text DEFAULT NULL)
RETURNS TABLE (
  etapa text,
  sessoes bigint,
  eventos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.event AS etapa,
         count(DISTINCT e.session_key) AS sessoes,
         count(*) AS eventos
  FROM public.landing_events e
  WHERE e.created_at >= _desde
    AND (_rota IS NULL OR e.rota = _rota)
    AND public.has_role(auth.uid(), 'admin')
  GROUP BY e.event
$$;

REVOKE ALL ON FUNCTION public.funil_landing(timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.funil_landing(timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.funil_landing(timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.funil_landing(timestamptz, text) TO service_role;