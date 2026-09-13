-- 1. WhatsApp do profissional
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. Vínculo de assistentes da clínica
CREATE TABLE public.clinic_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_user_id uuid NOT NULL,
  assistente_user_id uuid NOT NULL,
  nome text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (medico_user_id, assistente_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_members TO authenticated;
GRANT ALL ON public.clinic_members TO service_role;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clinic_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_user_id uuid NOT NULL,
  email text NOT NULL,
  nome text,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pendente',
  expires_at timestamp with time zone NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamp with time zone,
  accepted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_invites TO authenticated;
GRANT ALL ON public.clinic_invites TO service_role;
ALTER TABLE public.clinic_invites ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_clinic_members_updated_at BEFORE UPDATE ON public.clinic_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_invites_updated_at BEFORE UPDATE ON public.clinic_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- função de acesso: o próprio dono ou um assistente ativo dele
CREATE OR REPLACE FUNCTION public.pode_acessar_conta(_dono uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _dono = auth.uid() OR EXISTS (
    SELECT 1 FROM public.clinic_members m
    WHERE m.medico_user_id = _dono
      AND m.assistente_user_id = auth.uid()
      AND m.status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.eh_assistente_de(_dono uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members m
    WHERE m.medico_user_id = _dono
      AND m.assistente_user_id = auth.uid()
      AND m.status = 'ativo'
  );
$$;

CREATE POLICY "Medico gerencia seus assistentes" ON public.clinic_members
  FOR ALL TO authenticated
  USING (medico_user_id = auth.uid())
  WITH CHECK (medico_user_id = auth.uid());
CREATE POLICY "Assistente le seus vinculos" ON public.clinic_members
  FOR SELECT TO authenticated
  USING (assistente_user_id = auth.uid());
CREATE POLICY "Medico gerencia seus convites" ON public.clinic_invites
  FOR ALL TO authenticated
  USING (medico_user_id = auth.uid())
  WITH CHECK (medico_user_id = auth.uid());
CREATE POLICY "Convidado le e aceita convite" ON public.clinic_invites
  FOR SELECT TO authenticated
  USING (lower(email) = public.current_user_email());
CREATE POLICY "Convidado aceita convite" ON public.clinic_invites
  FOR UPDATE TO authenticated
  USING (lower(email) = public.current_user_email() AND status = 'pendente' AND expires_at > now())
  WITH CHECK (lower(email) = public.current_user_email());

-- 3. Triagem por formulário
CREATE TABLE public.patient_screenings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  autor_user_id uuid,
  queixa text NOT NULL,
  sintomas text,
  historico text,
  medicacoes text,
  exames text,
  sinais_alerta text[] NOT NULL DEFAULT '{}',
  fatores_risco text[] NOT NULL DEFAULT '{}',
  risco text NOT NULL DEFAULT 'baixo',
  risco_justificativa text,
  encaminhamento text,
  documentos jsonb,
  doc_id uuid REFERENCES public.generated_docs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'rascunho',
  confirmado_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_screenings TO authenticated;
GRANT ALL ON public.patient_screenings TO service_role;
ALTER TABLE public.patient_screenings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_patient_screenings_updated_at BEFORE UPDATE ON public.patient_screenings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Conta acessa triagens estruturadas" ON public.patient_screenings
  FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta cria triagens estruturadas" ON public.patient_screenings
  FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta edita triagens estruturadas" ON public.patient_screenings
  FOR UPDATE TO authenticated USING (public.pode_acessar_conta(user_id))
  WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Dono apaga triagens estruturadas" ON public.patient_screenings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 4. Auditoria com autor real
ALTER TABLE public.patient_audit_log ADD COLUMN IF NOT EXISTS autor_user_id uuid;

DROP POLICY IF EXISTS "Profissional le sua auditoria" ON public.patient_audit_log;
DROP POLICY IF EXISTS "Profissional registra auditoria" ON public.patient_audit_log;
CREATE POLICY "Conta le auditoria" ON public.patient_audit_log
  FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta registra auditoria" ON public.patient_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_conta(user_id));

-- 5. Acesso compartilhado às fichas
DROP POLICY IF EXISTS "Profissional gerencia seus pacientes" ON public.patients;
CREATE POLICY "Conta le pacientes" ON public.patients
  FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta cria pacientes" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta edita pacientes" ON public.patients
  FOR UPDATE TO authenticated USING (public.pode_acessar_conta(user_id))
  WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Dono apaga pacientes" ON public.patients
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profissional gerencia seus eventos" ON public.patient_events;
CREATE POLICY "Conta le eventos" ON public.patient_events
  FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta cria eventos" ON public.patient_events
  FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta edita eventos" ON public.patient_events
  FOR UPDATE TO authenticated USING (public.pode_acessar_conta(user_id))
  WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Dono apaga eventos" ON public.patient_events
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profissional gerencia suas triagens" ON public.patient_triages;
CREATE POLICY "Conta le triagens" ON public.patient_triages
  FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta cria triagens" ON public.patient_triages
  FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta edita triagens" ON public.patient_triages
  FOR UPDATE TO authenticated USING (public.pode_acessar_conta(user_id))
  WITH CHECK (public.pode_acessar_conta(user_id));
CREATE POLICY "Dono apaga triagens" ON public.patient_triages
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Profissional le seu historico de campos" ON public.patient_field_history;
DROP POLICY IF EXISTS "Profissional registra historico de campos" ON public.patient_field_history;
CREATE POLICY "Conta le historico de campos" ON public.patient_field_history
  FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Conta registra historico de campos" ON public.patient_field_history
  FOR INSERT TO authenticated WITH CHECK (public.pode_acessar_conta(user_id));

CREATE POLICY "Assistente le documentos de pacientes" ON public.generated_docs
  FOR SELECT TO authenticated
  USING (patient_id IS NOT NULL AND public.eh_assistente_de(user_id));
CREATE POLICY "Assistente le anexos de pacientes" ON public.documents
  FOR SELECT TO authenticated
  USING (patient_id IS NOT NULL AND public.eh_assistente_de(user_id));

-- 6. Catálogo administrável de minutas
CREATE TABLE public.library_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  label text NOT NULL,
  escopo text NOT NULL DEFAULT 'oficial',
  user_id uuid,
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'publicado',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_categories TO authenticated;
GRANT ALL ON public.library_categories TO service_role;
ALTER TABLE public.library_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.library_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  label text NOT NULL,
  categoria_slug text NOT NULL,
  grupo text,
  escopo text NOT NULL DEFAULT 'oficial',
  user_id uuid,
  pede_procedimento boolean NOT NULL DEFAULT false,
  instrucoes text,
  ordem integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_templates TO authenticated;
GRANT ALL ON public.library_templates TO service_role;
ALTER TABLE public.library_templates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_library_categories_updated_at BEFORE UPDATE ON public.library_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_library_templates_updated_at BEFORE UPDATE ON public.library_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX library_categories_oficial_slug ON public.library_categories (slug)
  WHERE escopo = 'oficial';
CREATE UNIQUE INDEX library_categories_proprio_slug ON public.library_categories (user_id, slug)
  WHERE escopo = 'proprio';
CREATE UNIQUE INDEX library_templates_oficial_slug ON public.library_templates (slug)
  WHERE escopo = 'oficial';
CREATE UNIQUE INDEX library_templates_proprio_slug ON public.library_templates (user_id, slug)
  WHERE escopo = 'proprio';

CREATE POLICY "Todos leem catalogo publicado" ON public.library_categories
  FOR SELECT TO authenticated
  USING ((escopo = 'oficial' AND status = 'publicado') OR user_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia categorias oficiais" ON public.library_categories
  FOR ALL TO authenticated
  USING (escopo = 'oficial' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (escopo = 'oficial' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profissional gerencia categorias proprias" ON public.library_categories
  FOR ALL TO authenticated
  USING (escopo = 'proprio' AND user_id = auth.uid())
  WITH CHECK (escopo = 'proprio' AND user_id = auth.uid());

CREATE POLICY "Todos leem minutas publicadas" ON public.library_templates
  FOR SELECT TO authenticated
  USING ((escopo = 'oficial' AND status = 'publicado') OR user_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin gerencia minutas oficiais" ON public.library_templates
  FOR ALL TO authenticated
  USING (escopo = 'oficial' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (escopo = 'oficial' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profissional gerencia minutas proprias" ON public.library_templates
  FOR ALL TO authenticated
  USING (escopo = 'proprio' AND user_id = auth.uid())
  WITH CHECK (escopo = 'proprio' AND user_id = auth.uid());