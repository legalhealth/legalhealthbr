CREATE TABLE public.ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  profissao text NOT NULL,
  estado text NOT NULL,
  cidade text NOT NULL,
  tipo_atuacao text NOT NULL,
  link_profissional text,
  comunidade_tamanho text,
  motivo text NOT NULL,
  aceite_regulamento boolean NOT NULL DEFAULT false,
  ciencia_nao_substitui_advogado boolean NOT NULL DEFAULT false,
  consentimento_contato boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'recebida',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.ambassador_applications TO anon;
GRANT INSERT ON public.ambassador_applications TO authenticated;
GRANT ALL ON public.ambassador_applications TO service_role;

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode enviar candidatura"
ON public.ambassador_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  aceite_regulamento = true
  AND ciencia_nao_substitui_advogado = true
  AND length(nome) BETWEEN 2 AND 120
  AND length(email) BETWEEN 5 AND 160
  AND length(motivo) BETWEEN 10 AND 2000
);

CREATE POLICY "Admins podem ver candidaturas"
ON public.ambassador_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.ambassador_applications TO authenticated;