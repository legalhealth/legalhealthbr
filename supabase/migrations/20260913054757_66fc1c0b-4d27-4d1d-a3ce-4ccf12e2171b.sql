REVOKE EXECUTE ON FUNCTION public.pode_acessar_conta(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.eh_assistente_de(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_acessar_conta(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.eh_assistente_de(uuid) TO authenticated, service_role;