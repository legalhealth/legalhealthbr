REVOKE EXECUTE ON FUNCTION public.match_legal_qa(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_legal_qa(text, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.registrar_uso_legal_qa(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_uso_legal_qa(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.registrar_lacuna_legal_qa(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_lacuna_legal_qa(text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.current_user_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Base jurídica publicada é pública" ON public.legal_qa;

CREATE POLICY "Visitantes leem a base publicada"
ON public.legal_qa FOR SELECT TO anon
USING (status = 'publicado');

CREATE POLICY "Usuários leem a base publicada"
ON public.legal_qa FOR SELECT TO authenticated
USING (status = 'publicado' OR public.has_role(auth.uid(), 'admin'));