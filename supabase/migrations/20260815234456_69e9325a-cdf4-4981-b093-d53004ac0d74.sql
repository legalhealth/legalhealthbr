CREATE POLICY "Users read own documentos files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own documentos files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own documentos files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own documentos files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);