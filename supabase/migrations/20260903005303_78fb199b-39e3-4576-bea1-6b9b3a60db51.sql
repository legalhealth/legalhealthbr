REVOKE EXECUTE ON FUNCTION public.match_legal_qa(text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_uso_legal_qa(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_lacuna_legal_qa(text, text) FROM anon, authenticated;

ALTER TABLE public.revisoes
  ADD COLUMN IF NOT EXISTS parecer text,
  ADD COLUMN IF NOT EXISTS parecer_em timestamptz;

CREATE TABLE IF NOT EXISTS public.revisao_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revisao_id uuid NOT NULL REFERENCES public.revisoes(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  revoked_at timestamptz,
  first_opened_at timestamptz,
  opens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.revisao_tokens TO authenticated;
GRANT ALL ON public.revisao_tokens TO service_role;
ALTER TABLE public.revisao_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médico vê tokens das próprias revisões"
ON public.revisao_tokens FOR SELECT TO authenticated
USING (revisao_id IN (SELECT id FROM public.revisoes WHERE user_id = auth.uid()));

CREATE POLICY "Médico revoga tokens das próprias revisões"
ON public.revisao_tokens FOR UPDATE TO authenticated
USING (revisao_id IN (SELECT id FROM public.revisoes WHERE user_id = auth.uid()))
WITH CHECK (revisao_id IN (SELECT id FROM public.revisoes WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS revisao_tokens_revisao_idx ON public.revisao_tokens (revisao_id);

-- E-mail do usuário autenticado, para casar a revisão com o advogado destinatário.
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;

CREATE POLICY "Advogado vê revisões enviadas a ele"
ON public.revisoes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'advogado')
  AND lower(advogado_email) = public.current_user_email()
);

CREATE POLICY "Advogado atualiza revisões enviadas a ele"
ON public.revisoes FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'advogado')
  AND lower(advogado_email) = public.current_user_email()
)
WITH CHECK (
  public.has_role(auth.uid(), 'advogado')
  AND lower(advogado_email) = public.current_user_email()
);

CREATE POLICY "Advogado vê comentários das revisões dele"
ON public.revisao_comentarios FOR SELECT TO authenticated
USING (
  revisao_id IN (
    SELECT id FROM public.revisoes
    WHERE public.has_role(auth.uid(), 'advogado')
      AND lower(advogado_email) = public.current_user_email()
  )
);

CREATE POLICY "Advogado comenta nas revisões dele"
ON public.revisao_comentarios FOR INSERT TO authenticated
WITH CHECK (
  revisao_id IN (
    SELECT id FROM public.revisoes
    WHERE public.has_role(auth.uid(), 'advogado')
      AND lower(advogado_email) = public.current_user_email()
  )
);