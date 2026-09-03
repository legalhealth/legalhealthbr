revoke all on function public.match_legal_qa(text,integer) from public, anon, authenticated;
grant execute on function public.match_legal_qa(text,integer) to service_role;
revoke all on function public.registrar_uso_legal_qa(uuid) from public, anon, authenticated;
grant execute on function public.registrar_uso_legal_qa(uuid) to service_role;
revoke all on function public.registrar_lacuna_legal_qa(text,text) from public, anon, authenticated;
grant execute on function public.registrar_lacuna_legal_qa(text,text) to service_role;