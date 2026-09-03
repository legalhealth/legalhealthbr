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
  with q as (
    select to_tsquery(
      'portuguese',
      nullif((
        select string_agg(distinct quote_literal(lexeme), ' | ')
        from unnest(to_tsvector('portuguese', coalesce(consulta,''))) as l(lexeme)
      ), '')
    ) as tsq
  )
  select
    c.id, v.id, s.source_id, s.title, s.issuing_body, s.number, s.official_url,
    s.authority_level, c.artigo, c.secao, c.texto, c.pilar, c.nivel_risco, c.exige_advogado,
    v.effective_from, v.version,
    greatest(
      case when q.tsq is not null and c.busca @@ q.tsq
        then 0.45 + least(ts_rank(c.busca, q.tsq) * 4, 0.55) else 0 end,
      word_similarity(coalesce(consulta,''), coalesce(c.artigo,'') || ' ' || c.texto)
    )::real as score
  from public.legal_chunks c
  join public.legal_source_versions v on v.id = c.version_id
  join public.legal_sources s on s.id = c.source_uuid
  cross join q
  where v.published
    and v.status = 'vigente'
    and s.status in ('vigente','alterada')
    and (v.effective_from is null or v.effective_from <= current_date)
    and (v.effective_until is null or v.effective_until >= current_date)
    and s.authority_level <= coalesce(autoridade_max, 4)
    and (pilar_in is null or c.pilar = pilar_in or c.pilar is null)
  order by score desc, s.authority_level asc
  limit greatest(coalesce(limite,4),1);
$$;

revoke all on function public.match_legal_chunks(text,integer,text,smallint) from public, anon, authenticated;
grant execute on function public.match_legal_chunks(text,integer,text,smallint) to service_role;