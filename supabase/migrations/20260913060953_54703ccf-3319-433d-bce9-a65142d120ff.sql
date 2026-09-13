DROP TRIGGER clinic_invites_expirar_trigger ON public.clinic_invites;
CREATE OR REPLACE FUNCTION public.clinic_invites_expirar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.expires_at < now() THEN
    NEW.status := 'expirado';
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.clinic_invites_expirar() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER clinic_invites_expirar_row
BEFORE INSERT OR UPDATE ON public.clinic_invites
FOR EACH ROW EXECUTE FUNCTION public.clinic_invites_expirar();