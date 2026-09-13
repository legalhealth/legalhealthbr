CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  nascimento date,
  contato text,
  convenio text,
  observacoes text,
  responsavel_legal text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patients_user_idx ON public.patients (user_id, nome);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profissional gerencia seus pacientes" ON public.patients FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.patient_triages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  audio_path text,
  transcricao text NOT NULL DEFAULT '',
  resumo jsonb,
  resumo_original jsonb,
  urgencia text NOT NULL DEFAULT 'media',
  encaminhamento text,
  consentimento_atendimento_em timestamptz,
  consentimento_audio_em timestamptz,
  duracao_seg integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  revisado_por uuid,
  revisado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_triages_patient_idx ON public.patient_triages (patient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_triages TO authenticated;
GRANT ALL ON public.patient_triages TO service_role;
ALTER TABLE public.patient_triages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profissional gerencia suas triagens" ON public.patient_triages FOR ALL TO authenticated
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()));
CREATE TRIGGER update_patient_triages_updated_at BEFORE UPDATE ON public.patient_triages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.patient_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  ocorrido_em timestamptz NOT NULL DEFAULT now(),
  doc_id uuid REFERENCES public.generated_docs(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  triage_id uuid REFERENCES public.patient_triages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_events_patient_idx ON public.patient_events (patient_id, ocorrido_em DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_events TO authenticated;
GRANT ALL ON public.patient_events TO service_role;
ALTER TABLE public.patient_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profissional gerencia seus eventos" ON public.patient_events FOR ALL TO authenticated
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()));
CREATE TRIGGER update_patient_events_updated_at BEFORE UPDATE ON public.patient_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.patient_field_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  campo text NOT NULL,
  valor_anterior text,
  valor_novo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_field_history_patient_idx ON public.patient_field_history (patient_id, created_at DESC);
GRANT SELECT, INSERT ON public.patient_field_history TO authenticated;
GRANT ALL ON public.patient_field_history TO service_role;
ALTER TABLE public.patient_field_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profissional le seu historico de campos" ON public.patient_field_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Profissional registra historico de campos" ON public.patient_field_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.user_id = auth.uid()));

CREATE TABLE public.patient_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  detalhe text,
  ocorrido_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_audit_log_user_idx ON public.patient_audit_log (user_id, ocorrido_em DESC);
GRANT SELECT, INSERT ON public.patient_audit_log TO authenticated;
GRANT ALL ON public.patient_audit_log TO service_role;
ALTER TABLE public.patient_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profissional le sua auditoria" ON public.patient_audit_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Profissional registra auditoria" ON public.patient_audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.generated_docs ADD COLUMN patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
CREATE INDEX generated_docs_patient_idx ON public.generated_docs (patient_id);
CREATE INDEX documents_patient_idx ON public.documents (patient_id);