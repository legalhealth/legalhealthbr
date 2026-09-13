ALTER TABLE public.library_templates ADD COLUMN IF NOT EXISTS clinic_owner_id uuid;
ALTER TABLE public.library_categories ADD COLUMN IF NOT EXISTS clinic_owner_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS library_templates_clinica_slug
  ON public.library_templates (clinic_owner_id, slug)
  WHERE escopo = 'clinica';
CREATE UNIQUE INDEX IF NOT EXISTS library_categories_clinica_slug
  ON public.library_categories (clinic_owner_id, slug)
  WHERE escopo = 'clinica';

DROP POLICY IF EXISTS "Conta le modelos da clinica" ON public.library_templates;
CREATE POLICY "Conta le modelos da clinica" ON public.library_templates
  FOR SELECT TO authenticated
  USING (escopo = 'clinica' AND clinic_owner_id IS NOT NULL AND public.pode_acessar_conta(clinic_owner_id));

DROP POLICY IF EXISTS "Dono gerencia modelos da clinica" ON public.library_templates;
CREATE POLICY "Dono gerencia modelos da clinica" ON public.library_templates
  FOR ALL TO authenticated
  USING (escopo = 'clinica' AND clinic_owner_id = auth.uid())
  WITH CHECK (escopo = 'clinica' AND clinic_owner_id = auth.uid());

DROP POLICY IF EXISTS "Conta le categorias da clinica" ON public.library_categories;
CREATE POLICY "Conta le categorias da clinica" ON public.library_categories
  FOR SELECT TO authenticated
  USING (escopo = 'clinica' AND clinic_owner_id IS NOT NULL AND public.pode_acessar_conta(clinic_owner_id));

DROP POLICY IF EXISTS "Dono gerencia categorias da clinica" ON public.library_categories;
CREATE POLICY "Dono gerencia categorias da clinica" ON public.library_categories
  FOR ALL TO authenticated
  USING (escopo = 'clinica' AND clinic_owner_id = auth.uid())
  WITH CHECK (escopo = 'clinica' AND clinic_owner_id = auth.uid());

-- Categorias oficiais do catálogo
INSERT INTO public.library_categories (slug, label, escopo, user_id, ordem, status)
SELECT v.slug, v.label, 'oficial', NULL, v.ordem, 'publicado'
FROM (VALUES
  ('minutas', 'Minutas', 1),
  ('protocolos', 'Protocolos', 2),
  ('checklists', 'Checklists', 3),
  ('clinica-minutas', 'Minutas da clínica', 4)
) AS v(slug, label, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.library_categories c WHERE c.escopo = 'oficial' AND c.slug = v.slug
);

-- Minutas oficiais da área médica
INSERT INTO public.library_templates
  (slug, label, categoria_slug, grupo, escopo, user_id, pede_procedimento, instrucoes, ordem, status)
SELECT v.slug, v.label, 'minutas', v.grupo, 'oficial', NULL, v.proc, v.instr, v.ordem, 'publicado'
FROM (VALUES
  ('regimento-interno-clinica', 'Regimento Interno da Clínica', 'Contratos e institucional', false, 'Estruture normas de funcionamento, deveres da equipe, fluxo de atendimento e regras de conduta, citando CFM e CLT quando aplicável.', 10),
  ('politica-cancelamento-noshow', 'Política de Cancelamento e Reagendamento', 'Contratos e institucional', false, 'Defina prazos de cancelamento, reagendamento, cobrança por ausência e comunicação ao paciente, respeitando o CDC.', 11),
  ('contrato-corpo-clinico', 'Contrato de Integração ao Corpo Clínico', 'Contratos e institucional', false, 'Regule a atuação de profissionais no corpo clínico: autonomia técnica, responsabilidade, repasses e sigilo.', 12),
  ('registro-tratamento-dados', 'Registro de Operações de Tratamento de Dados (ROPA)', 'LGPD e dados', false, 'Monte o registro exigido pela LGPD art. 37: finalidade, base legal, categorias de dados, prazo de guarda e compartilhamentos.', 20),
  ('resposta-titular-dados', 'Resposta a Pedido de Titular de Dados', 'LGPD e dados', false, 'Responda a pedido de acesso, correção ou eliminação nos termos da LGPD art. 18, indicando prazos e limites do prontuário.', 21),
  ('plano-resposta-incidente', 'Plano de Resposta a Incidente de Segurança', 'LGPD e dados', false, 'Descreva contenção, avaliação de risco, comunicação à ANPD e aos titulares e registro do incidente.', 22),
  ('relatorio-atendimento', 'Relatório Circunstanciado de Atendimento', 'Relacionamento e defesa', true, 'Relate o atendimento de forma técnica e cronológica, sem juízo de valor, para instruir defesa administrativa ou judicial.', 30),
  ('resposta-reclamacao-paciente', 'Resposta a Reclamação de Paciente', 'Relacionamento e defesa', false, 'Responda com empatia e base técnica, sem admitir culpa, indicando providências e canais de solução.', 31),
  ('defesa-previa-cfm', 'Defesa Prévia em Sindicância do CRM/CFM', 'Relacionamento e defesa', false, 'Estruture defesa prévia com qualificação, síntese dos fatos, fundamentação ética e pedidos, marcando [VERIFICAR] onde faltarem dados.', 32),
  ('comunicado-alta-encerramento', 'Comunicado de Alta e Encerramento do Acompanhamento', 'Relacionamento e defesa', false, 'Formalize alta ou encerramento do vínculo assistencial, com orientações, riscos de descontinuidade e encaminhamentos.', 33)
) AS v(slug, label, grupo, proc, instr, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.library_templates t WHERE t.escopo = 'oficial' AND t.slug = v.slug
);

-- Minutas iniciais da clínica (idempotente por dono)
CREATE OR REPLACE FUNCTION public.semear_modelos_clinica()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  dono uuid := auth.uid();
BEGIN
  IF dono IS NULL THEN RETURN; END IF;

  INSERT INTO public.library_categories (slug, label, escopo, user_id, clinic_owner_id, ordem, status)
  SELECT 'clinica-minutas', 'Minutas da clínica', 'clinica', dono, dono, 1, 'publicado'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.library_categories c
    WHERE c.escopo = 'clinica' AND c.clinic_owner_id = dono AND c.slug = 'clinica-minutas'
  );

  INSERT INTO public.library_templates
    (slug, label, categoria_slug, grupo, escopo, user_id, clinic_owner_id, pede_procedimento, instrucoes, ordem, status)
  SELECT v.slug, v.label, 'clinica-minutas', 'Minutas oficiais da clínica', 'clinica', dono, dono, v.proc, v.instr, v.ordem, 'publicado'
  FROM (VALUES
    ('clinica-tcle', 'Termo de Consentimento da Clínica', true, 'Use o cabeçalho e os dados da clínica, descreva o procedimento, riscos, alternativas e cuidados, conforme CFM e CDC.', 1),
    ('clinica-politica-cancelamento', 'Política de Cancelamento da Clínica', false, 'Traga prazos de cancelamento e reagendamento, cobrança por ausência e canais de contato da clínica.', 2),
    ('clinica-sigilo-equipe', 'Termo de Sigilo da Equipe da Clínica', false, 'Obrigações de confidencialidade da equipe sobre prontuários e dados pessoais, com base na LGPD e no sigilo profissional.', 3),
    ('clinica-anamnese', 'Ficha de Anamnese da Clínica', false, 'Estruture campos de identificação, queixa, histórico, medicações, alergias e exames, com espaço para assinatura.', 4),
    ('clinica-pos-procedimento', 'Orientações de Pós-Procedimento da Clínica', true, 'Liste cuidados, sinais de alerta, contatos de urgência da clínica e retorno recomendado.', 5)
  ) AS v(slug, label, proc, instr, ordem)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.library_templates t
    WHERE t.escopo = 'clinica' AND t.clinic_owner_id = dono AND t.slug = v.slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.semear_modelos_clinica() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.semear_modelos_clinica() TO authenticated;