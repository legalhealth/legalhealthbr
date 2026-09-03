create or replace function public.match_legal_chunks(
  consulta text,
  limite integer default 4,
  pilar_in text default null,
  autoridade_max smallint default 4
)
returns table (
  chunk_id uuid,
  version_id uuid,
  source_id text,
  title text,
  issuing_body text,
  number text,
  official_url text,
  authority_level smallint,
  artigo text,
  secao text,
  texto text,
  pilar text,
  nivel_risco public.legal_risk_level,
  exige_advogado boolean,
  effective_from date,
  version integer,
  score real
)
language sql stable security definer set search_path = public as $$
  with termos as (
    select distinct lexeme
    from unnest(to_tsvector('portuguese', coalesce(consulta,''))) as l(lexeme)
  ),
  total as (select greatest(count(*),1)::numeric as n from public.legal_chunks),
  pesos as (
    select t.lexeme,
      ln(1 + (select n from total) / greatest((
        select count(*) from public.legal_chunks c2
        where c2.busca @@ to_tsquery('portuguese', quote_literal(t.lexeme))
      ),1)::numeric) as peso
    from termos t
  ),
  soma as (select greatest(sum(peso), 0.0001) as total_peso from pesos),
  elegiveis as (
    select c.id as chunk_id, c.busca, c.artigo, c.secao, c.texto, c.pilar,
           c.nivel_risco, c.exige_advogado,
           v.id as version_id, v.effective_from, v.version,
           s.source_id, s.title, s.issuing_body, s.number, s.official_url, s.authority_level
    from public.legal_chunks c
    join public.legal_source_versions v on v.id = c.version_id
    join public.legal_sources s on s.id = c.source_uuid
    where v.published
      and v.status = 'vigente'
      and s.status in ('vigente','alterada')
      and (v.effective_from is null or v.effective_from <= current_date)
      and (v.effective_until is null or v.effective_until >= current_date)
      and s.authority_level <= coalesce(autoridade_max, 4)
      and (pilar_in is null or c.pilar = pilar_in or c.pilar is null)
  )
  select
    e.chunk_id, e.version_id, e.source_id, e.title, e.issuing_body, e.number, e.official_url,
    e.authority_level, e.artigo, e.secao, e.texto, e.pilar, e.nivel_risco, e.exige_advogado,
    e.effective_from, e.version,
    greatest(
      coalesce((
        select sum(p.peso) from pesos p
        where e.busca @@ to_tsquery('portuguese', quote_literal(p.lexeme))
      ), 0) / (select total_peso from soma),
      word_similarity(coalesce(consulta,''), coalesce(e.artigo,'') || ' ' || e.texto)
    )::real as score
  from elegiveis e
  order by score desc, e.authority_level asc
  limit greatest(coalesce(limite,4),1);
$$;

revoke all on function public.match_legal_chunks(text,integer,text,smallint) from public, anon, authenticated;
grant execute on function public.match_legal_chunks(text,integer,text,smallint) to service_role;