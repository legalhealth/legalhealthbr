CREATE POLICY "Audio de triagem: leitura do proprio dono" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Audio de triagem: envio do proprio dono" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Audio de triagem: atualizacao do proprio dono" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-audio' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'patient-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Audio de triagem: exclusao do proprio dono" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'patient-audio' AND (storage.foldername(name))[1] = auth.uid()::text);