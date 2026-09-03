CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('medico', 'advogado', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Usuários veem seus próprios papéis"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam papéis"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.legal_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  variacoes text[] NOT NULL DEFAULT '{}',
  resposta text NOT NULL,
  fundamentacao text[] NOT NULL DEFAULT '{}',
  pilar text,
  categoria text NOT NULL DEFAULT 'juridico',
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'publicado',
  usos integer NOT NULL DEFAULT 0,
  busca tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_qa TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_qa TO authenticated;
GRANT ALL ON public.legal_qa TO service_role;
ALTER TABLE public.legal_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Base jurídica publicada é pública"
ON public.legal_qa FOR SELECT TO anon, authenticated
USING (status = 'publicado' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins gerenciam a base jurídica"
ON public.legal_qa FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.legal_qa_busca_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.busca := to_tsvector(
    'portuguese',
    coalesce(NEW.pergunta, '') || ' ' ||
    coalesce(array_to_string(NEW.variacoes, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER legal_qa_busca_sync_trigger
BEFORE INSERT OR UPDATE ON public.legal_qa
FOR EACH ROW EXECUTE FUNCTION public.legal_qa_busca_sync();

CREATE TRIGGER update_legal_qa_updated_at
BEFORE UPDATE ON public.legal_qa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS legal_qa_busca_idx ON public.legal_qa USING gin (busca);
CREATE INDEX IF NOT EXISTS legal_qa_pergunta_trgm_idx ON public.legal_qa USING gin (pergunta gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.legal_qa_lacunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  origem text NOT NULL DEFAULT 'chatbot',
  ocorrencias integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.legal_qa_lacunas TO authenticated;
GRANT ALL ON public.legal_qa_lacunas TO service_role;
ALTER TABLE public.legal_qa_lacunas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam lacunas"
ON public.legal_qa_lacunas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legal_qa_lacunas_updated_at
BEFORE UPDATE ON public.legal_qa_lacunas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.match_legal_qa(consulta text, limite integer DEFAULT 3)
RETURNS TABLE (
  id uuid,
  pergunta text,
  resposta text,
  fundamentacao text[],
  pilar text,
  categoria text,
  tags text[],
  score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (SELECT websearch_to_tsquery('portuguese', coalesce(consulta, '')) AS tsq)
  SELECT
    l.id,
    l.pergunta,
    l.resposta,
    l.fundamentacao,
    l.pilar,
    l.categoria,
    l.tags,
    GREATEST(
      CASE WHEN l.busca @@ q.tsq
        THEN 0.60 + LEAST(ts_rank(l.busca, q.tsq) * 3, 0.40)
        ELSE 0 END,
      word_similarity(coalesce(consulta, ''), l.pergunta || ' ' || coalesce(array_to_string(l.variacoes, ' '), ''))
    )::real AS score
  FROM public.legal_qa l, q
  WHERE l.status = 'publicado'
  ORDER BY score DESC, l.usos DESC
  LIMIT GREATEST(coalesce(limite, 3), 1);
$$;

GRANT EXECUTE ON FUNCTION public.match_legal_qa(text, integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_uso_legal_qa(qa_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.legal_qa SET usos = usos + 1 WHERE id = qa_id;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_uso_legal_qa(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_lacuna_legal_qa(texto text, origem_in text DEFAULT 'chatbot')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limpo text := btrim(coalesce(texto, ''));
  existente uuid;
BEGIN
  IF length(limpo) < 8 THEN RETURN; END IF;
  limpo := left(limpo, 500);

  SELECT id INTO existente
  FROM public.legal_qa_lacunas
  WHERE lower(pergunta) = lower(limpo)
  LIMIT 1;

  IF existente IS NULL THEN
    INSERT INTO public.legal_qa_lacunas (pergunta, origem)
    VALUES (limpo, left(coalesce(origem_in, 'chatbot'), 40));
  ELSE
    UPDATE public.legal_qa_lacunas
    SET ocorrencias = ocorrencias + 1, updated_at = now()
    WHERE id = existente;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_lacuna_legal_qa(text, text) TO anon, authenticated, service_role;