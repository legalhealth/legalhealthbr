CREATE TABLE public.plan_limits (
  slug text PRIMARY KEY,
  nome text NOT NULL,
  limite_ia_dia integer,
  juriscore_mes integer,
  max_pacientes integer,
  max_assistentes integer,
  triagem_voz boolean NOT NULL DEFAULT false,
  revisoes_mes integer NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_limits TO authenticated;
GRANT ALL ON public.plan_limits TO service_role;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios leem limites dos planos" ON public.plan_limits FOR SELECT TO authenticated USING (true);

INSERT INTO public.plan_limits (slug, nome, limite_ia_dia, juriscore_mes, max_pacientes, max_assistentes, triagem_voz, revisoes_mes, ordem) VALUES
  ('free', 'Gratuito', 5, 1, 1, 0, false, 0, 0),
  ('essential', 'Essential', 40, NULL, NULL, 0, true, 0, 1),
  ('professional', 'Professional', 150, NULL, NULL, 3, true, 2, 2),
  ('enterprise', 'Enterprise', NULL, NULL, NULL, NULL, true, 0, 3);

ALTER TABLE public.profiles ALTER COLUMN plano SET DEFAULT 'free';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, nome, plano)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome', 'free');
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.profiles_protect_plano()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  papel text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
BEGIN
  IF NEW.plano IS DISTINCT FROM OLD.plano AND papel IS DISTINCT FROM 'service_role' THEN
    NEW.plano := OLD.plano;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER profiles_protect_plano_row
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_plano();