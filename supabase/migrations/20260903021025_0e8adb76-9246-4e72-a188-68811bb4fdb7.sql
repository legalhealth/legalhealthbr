create table public.legal_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_id text not null,
  official_url text,
  resultado text not null default 'ok',
  version integer,
  chunks integer not null default 0,
  tamanho_texto integer not null default 0,
  mensagem text,
  executado_por uuid,
  created_at timestamp with time zone not null default now()
);

grant select on public.legal_ingest_runs to authenticated;
grant all on public.legal_ingest_runs to service_role;

alter table public.legal_ingest_runs enable row level security;

create policy "Admins veem o histórico de coletas"
  on public.legal_ingest_runs
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index legal_ingest_runs_source_idx on public.legal_ingest_runs (source_id, created_at desc);

create unique index if not exists legal_chunks_version_artigo_uidx
  on public.legal_chunks (version_id, coalesce(artigo, ''), md5(texto));