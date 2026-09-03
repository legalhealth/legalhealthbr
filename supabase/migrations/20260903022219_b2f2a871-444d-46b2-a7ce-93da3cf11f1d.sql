with vigentes as (
  select distinct on (source_uuid) id, source_uuid
  from public.legal_source_versions
  order by source_uuid, version desc
)
delete from public.legal_source_versions v
where v.version > 1
  and not exists (select 1 from vigentes x where x.id = v.id);

update public.legal_sources s
set current_version_id = (
  select v.id from public.legal_source_versions v
  where v.source_uuid = s.id
  order by v.version desc limit 1
);

update public.legal_source_versions v
set status = 'vigente', effective_until = null
where v.id = (
  select x.id from public.legal_source_versions x
  where x.source_uuid = v.source_uuid order by x.version desc limit 1
);