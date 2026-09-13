CREATE TABLE public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  nome text,
  cnpj text,
  telefone text,
  email text,
  responsavel_tecnico text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  horarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conta le clinica" ON public.clinics FOR SELECT TO authenticated USING (public.pode_acessar_conta(user_id));
CREATE POLICY "Dono insere clinica" ON public.clinics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono edita clinica" ON public.clinics FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono exclui clinica" ON public.clinics FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Convites vencidos mudam sozinhos para "expirado" quando a tabela é tocada
CREATE OR REPLACE FUNCTION public.clinic_invites_expirar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clinic_invites
  SET status = 'expirado', updated_at = now()
  WHERE status = 'pendente' AND expires_at < now();
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.clinic_invites_expirar() FROM PUBLIC, anon;
CREATE TRIGGER clinic_invites_expirar_trigger
AFTER INSERT OR UPDATE ON public.clinic_invites
FOR EACH STATEMENT EXECUTE FUNCTION public.clinic_invites_expirar();