CREATE TABLE public.device_login_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  verifier_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid,
  session_token_hash text,
  user_agent text,
  ip_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  approved_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.device_login_requests TO service_role;

ALTER TABLE public.device_login_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sem acesso direto aos pedidos de login"
  ON public.device_login_requests FOR SELECT TO authenticated
  USING (false);

CREATE INDEX device_login_requests_code_idx ON public.device_login_requests (code);
CREATE INDEX device_login_requests_expires_idx ON public.device_login_requests (expires_at);

CREATE TRIGGER update_device_login_requests_updated_at
  BEFORE UPDATE ON public.device_login_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();