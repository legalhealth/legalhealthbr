ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clinica text,
  ADD COLUMN IF NOT EXISTS email_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS weekly_digest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS new_jurisprudence boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS risk_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();