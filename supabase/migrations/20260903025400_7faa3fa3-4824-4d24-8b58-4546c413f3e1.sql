CREATE TABLE public.legal_change_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL,
  title text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('alterada','revogada','falha')),
  version integer,
  mensagem text NOT NULL,
  official_url text,
  notified_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX legal_change_alerts_created_idx ON public.legal_change_alerts (created_at DESC);

GRANT SELECT, UPDATE ON public.legal_change_alerts TO authenticated;
GRANT ALL ON public.legal_change_alerts TO service_role;

ALTER TABLE public.legal_change_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem alertas da base"
  ON public.legal_change_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins marcam alertas como lidos"
  ON public.legal_change_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legal_change_alerts_updated_at
  BEFORE UPDATE ON public.legal_change_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();