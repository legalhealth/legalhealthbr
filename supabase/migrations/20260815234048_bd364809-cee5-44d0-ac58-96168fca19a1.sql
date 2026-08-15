ALTER TABLE public.generated_docs
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS contexto jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_generated_docs_updated_at ON public.generated_docs;
CREATE TRIGGER update_generated_docs_updated_at
BEFORE UPDATE ON public.generated_docs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();