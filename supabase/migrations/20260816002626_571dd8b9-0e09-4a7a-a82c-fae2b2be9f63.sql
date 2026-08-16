ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS analise jsonb,
  ADD COLUMN IF NOT EXISTS analisado_em timestamptz;

CREATE POLICY "documents_bucket_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "documents_bucket_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_bucket_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid())
WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "documents_bucket_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());