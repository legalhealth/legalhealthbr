CREATE TABLE public.revisoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  doc_id uuid NOT NULL REFERENCES public.generated_docs(id) ON DELETE CASCADE,
  advogado_nome text NOT NULL,
  advogado_email text NOT NULL,
  advogado_oab text,
  mensagem text,
  status text NOT NULL DEFAULT 'enviada',
  document_ids uuid[] NOT NULL DEFAULT '{}',
  enviado_em timestamp with time zone NOT NULL DEFAULT now(),
  concluido_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revisoes TO authenticated;
GRANT ALL ON public.revisoes TO service_role;
ALTER TABLE public.revisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own revisoes" ON public.revisoes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_revisoes_updated_at BEFORE UPDATE ON public.revisoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.revisao_comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  revisao_id uuid NOT NULL REFERENCES public.revisoes(id) ON DELETE CASCADE,
  autor text NOT NULL,
  papel text NOT NULL DEFAULT 'medico',
  conteudo text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revisao_comentarios TO authenticated;
GRANT ALL ON public.revisao_comentarios TO service_role;
ALTER TABLE public.revisao_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own revisao_comentarios through revisoes" ON public.revisao_comentarios FOR ALL TO authenticated
USING (revisao_id IN (SELECT id FROM public.revisoes WHERE user_id = auth.uid()))
WITH CHECK (revisao_id IN (SELECT id FROM public.revisoes WHERE user_id = auth.uid()));

CREATE INDEX revisoes_user_idx ON public.revisoes(user_id, enviado_em DESC);
CREATE INDEX revisao_comentarios_revisao_idx ON public.revisao_comentarios(revisao_id, created_at);