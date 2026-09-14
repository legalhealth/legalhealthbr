-- 1. Registro de acessos e histórico de campos: escrita só pelo servidor
DROP POLICY IF EXISTS "Conta registra auditoria" ON public.patient_audit_log;
REVOKE INSERT ON public.patient_audit_log FROM authenticated;

DROP POLICY IF EXISTS "Conta registra historico de campos" ON public.patient_field_history;
REVOKE INSERT ON public.patient_field_history FROM authenticated;

-- 2. Áudio de triagem: leitura apenas por link assinado emitido pelo servidor
DROP POLICY IF EXISTS "Audio de triagem: leitura do proprio dono" ON storage.objects;
DROP POLICY IF EXISTS "Audio de triagem: envio do proprio dono" ON storage.objects;
DROP POLICY IF EXISTS "Audio de triagem: atualizacao do proprio dono" ON storage.objects;
DROP POLICY IF EXISTS "Audio de triagem: exclusao do proprio dono" ON storage.objects;

CREATE POLICY "Audio de triagem: envio pela conta"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-audio'
  AND public.pode_acessar_conta((((storage.foldername(name))[1])::uuid))
);

CREATE POLICY "Audio de triagem: atualizacao pela conta"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'patient-audio'
  AND public.pode_acessar_conta((((storage.foldername(name))[1])::uuid))
)
WITH CHECK (
  bucket_id = 'patient-audio'
  AND public.pode_acessar_conta((((storage.foldername(name))[1])::uuid))
);

CREATE POLICY "Audio de triagem: exclusao pelo dono"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-audio'
  AND (((storage.foldername(name))[1])::uuid) = auth.uid()
);
