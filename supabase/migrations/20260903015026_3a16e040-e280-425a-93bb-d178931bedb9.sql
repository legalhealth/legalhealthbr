-- ============ tipos ============
create type public.legal_source_type as enum
  ('constituicao','lei','decreto','resolucao','portaria','parecer','decisao','guia','doutrina','editorial');

create type public.legal_source_status as enum
  ('vigente','alterada','revogada','suspensa','em_revisao');

create type public.legal_risk_level as enum ('baixo','medio','alto');

-- ============ fontes ============
create table public.legal_sources (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,
  source_type public.legal_source_type not null,
  issuing_body text not null,
  title text not null,
  number text,
  official_url text,
  jurisdiction text not null default 'BR',
  authority_level smallint not null check (authority_level between 1 and 5),
  temas text[] not null default '{}',
  pilar text,
  status public.legal_source_status not null default 'em_revisao',
  publication_date date,
  current_version_id uuid,
  last_checked_at timestamptz,
  responsavel_juridico text,
  responsavel_medico text,
  responsavel_produto text,
  responsavel_tecnico text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.legal_sources to authenticated;
grant all on public.legal_sources to service_role;
alter table public.legal_sources enable row level security;

create policy "Admins gerenciam fontes juridicas" on public.legal_sources
  for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Autenticados leem fontes juridicas" on public.legal_sources
  for select to authenticated using (true);

create trigger update_legal_sources_updated_at before update on public.legal_sources
  for each row execute function public.update_updated_at_column();

-- ============ versões ============
create table public.legal_source_versions (
  id uuid primary key default gen_random_uuid(),
  source_uuid uuid not null references public.legal_sources(id) on delete cascade,
  version integer not null,
  status public.legal_source_status not null default 'em_revisao',
  effective_from date,
  effective_until date,
  content text not null,
  content_hash text not null default '',
  supersedes_version_id uuid references public.legal_source_versions(id) on delete set null,
  change_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_uuid, version)
);

grant select on public.legal_source_versions to authenticated;
grant all on public.legal_source_versions to service_role;
alter table public.legal_source_versions enable row level security;

create policy "Admins gerenciam versoes de fontes" on public.legal_source_versions
  for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Autenticados leem versoes publicadas" on public.legal_source_versions
  for select to authenticated
  using (published or public.has_role(auth.uid(),'admin'));

create trigger update_legal_source_versions_updated_at before update on public.legal_source_versions
  for each row execute function public.update_updated_at_column();

alter table public.legal_sources
  add constraint legal_sources_current_version_fkey
  foreign key (current_version_id) references public.legal_source_versions(id) on delete set null;

-- integridade do texto
create or replace function public.legal_version_hash_sync()
returns trigger language plpgsql set search_path = public as $$
begin
  new.content_hash := md5(coalesce(new.content,''));
  return new;
end;
$$;

create trigger legal_version_hash_sync_trigger before insert or update on public.legal_source_versions
  for each row execute function public.legal_version_hash_sync();

-- ============ trechos ============
create table public.legal_chunks (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.legal_source_versions(id) on delete cascade,
  source_uuid uuid not null references public.legal_sources(id) on delete cascade,
  ordem integer not null default 1,
  artigo text,
  secao text,
  texto text not null,
  temas text[] not null default '{}',
  pilar text,
  contexto_aplicacao text,
  excecoes text,
  nivel_risco public.legal_risk_level not null default 'medio',
  exige_advogado boolean not null default false,
  termos_medicos text[] not null default '{}',
  termos_juridicos text[] not null default '{}',
  busca tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.legal_chunks to authenticated;
grant all on public.legal_chunks to service_role;
alter table public.legal_chunks enable row level security;

create policy "Admins gerenciam trechos juridicos" on public.legal_chunks
  for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Autenticados leem trechos juridicos" on public.legal_chunks
  for select to authenticated using (true);

create or replace function public.legal_chunks_busca_sync()
returns trigger language plpgsql set search_path = public as $$
begin
  new.busca := to_tsvector('portuguese',
    coalesce(new.artigo,'') || ' ' || coalesce(new.secao,'') || ' ' || coalesce(new.texto,'') || ' ' ||
    coalesce(array_to_string(new.temas,' '),'') || ' ' ||
    coalesce(array_to_string(new.termos_medicos,' '),'') || ' ' ||
    coalesce(array_to_string(new.termos_juridicos,' '),''));
  return new;
end;
$$;

create trigger legal_chunks_busca_sync_trigger before insert or update on public.legal_chunks
  for each row execute function public.legal_chunks_busca_sync();
create trigger update_legal_chunks_updated_at before update on public.legal_chunks
  for each row execute function public.update_updated_at_column();

create index legal_chunks_busca_idx on public.legal_chunks using gin (busca);
create index legal_chunks_texto_trgm_idx on public.legal_chunks using gin (texto gin_trgm_ops);
create index legal_chunks_version_idx on public.legal_chunks (version_id);

-- ============ ligação Q&A -> fonte ============
create table public.legal_qa_fontes (
  id uuid primary key default gen_random_uuid(),
  qa_id uuid not null references public.legal_qa(id) on delete cascade,
  version_id uuid not null references public.legal_source_versions(id) on delete cascade,
  artigo text,
  created_at timestamptz not null default now(),
  unique (qa_id, version_id, artigo)
);

grant select on public.legal_qa_fontes to authenticated;
grant all on public.legal_qa_fontes to service_role;
alter table public.legal_qa_fontes enable row level security;

create policy "Admins gerenciam fontes das QA" on public.legal_qa_fontes
  for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Autenticados leem fontes das QA" on public.legal_qa_fontes
  for select to authenticated using (true);

-- ============ auditoria de respostas ============
create table public.ai_answer_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  origem text not null default 'chatbot',
  pergunta text not null,
  fonte text not null default 'ia',
  qa_id uuid references public.legal_qa(id) on delete set null,
  version_ids uuid[] not null default '{}',
  citacoes jsonb,
  nivel_risco public.legal_risk_level,
  exige_advogado boolean not null default false,
  base_snapshot timestamptz not null default now(),
  created_at timestamptz not null default now()
);

grant select on public.ai_answer_audit to authenticated;
grant all on public.ai_answer_audit to service_role;
alter table public.ai_answer_audit enable row level security;

create policy "Admins leem auditoria de respostas" on public.ai_answer_audit
  for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Usuarios leem sua auditoria" on public.ai_answer_audit
  for select to authenticated using (user_id = auth.uid());

create index ai_answer_audit_created_idx on public.ai_answer_audit (created_at desc);

-- ============ recuperação (somente servidor) ============
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
  with q as (select websearch_to_tsquery('portuguese', coalesce(consulta,'')) as tsq)
  select
    c.id, v.id, s.source_id, s.title, s.issuing_body, s.number, s.official_url,
    s.authority_level, c.artigo, c.secao, c.texto, c.pilar, c.nivel_risco, c.exige_advogado,
    v.effective_from, v.version,
    greatest(
      case when c.busca @@ q.tsq then 0.55 + least(ts_rank(c.busca, q.tsq) * 3, 0.45) else 0 end,
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

create or replace function public.registrar_auditoria_resposta(
  user_id_in uuid,
  origem_in text,
  pergunta_in text,
  fonte_in text,
  qa_id_in uuid,
  version_ids_in uuid[],
  citacoes_in jsonb,
  nivel_risco_in public.legal_risk_level,
  exige_advogado_in boolean
)
returns void language sql security definer set search_path = public as $$
  insert into public.ai_answer_audit
    (user_id, origem, pergunta, fonte, qa_id, version_ids, citacoes, nivel_risco, exige_advogado)
  values
    (user_id_in, left(coalesce(origem_in,'chatbot'),40), left(coalesce(pergunta_in,''),1000),
     left(coalesce(fonte_in,'ia'),40), qa_id_in, coalesce(version_ids_in,'{}'), citacoes_in,
     nivel_risco_in, coalesce(exige_advogado_in,false));
$$;

revoke all on function public.registrar_auditoria_resposta(uuid,text,text,text,uuid,uuid[],jsonb,public.legal_risk_level,boolean) from public, anon, authenticated;
grant execute on function public.registrar_auditoria_resposta(uuid,text,text,text,uuid,uuid[],jsonb,public.legal_risk_level,boolean) to service_role;

-- ============ alertas de governança ============
create or replace view public.legal_source_alerts
with (security_invoker = true) as
  select s.id as source_uuid, s.source_id, s.title, s.status, a.alerta
  from public.legal_sources s
  cross join lateral (
    select unnest(array_remove(array[
      case when s.last_checked_at is null or s.last_checked_at < now() - interval '30 days'
        then 'sem revisao recente' end,
      case when s.responsavel_juridico is null then 'sem responsavel juridico' end,
      case when s.official_url is null or length(s.official_url) < 8 then 'sem link oficial' end,
      case when s.current_version_id is null then 'sem versao vigente definida' end,
      case when exists (
        select 1 from public.legal_chunks c
        join public.legal_source_versions v on v.id = c.version_id
        where c.source_uuid = s.id and v.published and v.status in ('revogada','suspensa')
      ) then 'trecho revogado ainda indexado' end
    ], null)) as alerta
  ) a;

grant select on public.legal_source_alerts to authenticated;
grant select on public.legal_source_alerts to service_role;

-- ============ conteúdo inicial ============
insert into public.legal_sources
  (source_id, source_type, issuing_body, title, number, official_url, authority_level, temas, pilar, status, publication_date, last_checked_at, responsavel_juridico, responsavel_tecnico)
values
  ('br-cf-1988','constituicao','Congresso Nacional','Constituição da República Federativa do Brasil','1988','https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',1,array['direitos fundamentais','privacidade'],'Regulatório','vigente','1988-10-05',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('br-lei-10406-2002','lei','Congresso Nacional','Código Civil','10.406/2002','https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',1,array['responsabilidade civil','contratos'],'Histórico','vigente','2002-01-10',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('br-lei-8078-1990','lei','Congresso Nacional','Código de Defesa do Consumidor','8.078/1990','https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',1,array['consumidor','responsabilidade civil'],'Histórico','vigente','1990-09-11',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('br-lei-13709-2018','lei','Congresso Nacional','Lei Geral de Proteção de Dados Pessoais','13.709/2018','https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',1,array['LGPD','dados sensiveis'],'Documental','vigente','2018-08-14',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('br-lei-13105-2015','lei','Congresso Nacional','Código de Processo Civil','13.105/2015','https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',1,array['prazos','intimacoes'],'Operacional','vigente','2015-03-16',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('cfm-res-2217-2018','resolucao','Conselho Federal de Medicina','Código de Ética Médica','2.217/2018','https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2018/2217',2,array['etica medica','consentimento'],'Regulatório','vigente','2018-11-01',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('cfm-res-1821-2007','resolucao','Conselho Federal de Medicina','Normas técnicas de guarda e digitalização de prontuários','1.821/2007','https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2007/1821',2,array['prontuario','guarda documental'],'Documental','vigente','2007-11-23',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('cfm-res-2314-2022','resolucao','Conselho Federal de Medicina','Telemedicina','2.314/2022','https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2022/2314',2,array['telemedicina'],'Operacional','vigente','2022-05-05',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('cfm-res-2336-2023','resolucao','Conselho Federal de Medicina','Publicidade e propaganda médicas','2.336/2023','https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2023/2336',2,array['publicidade medica'],'Regulatório','vigente','2023-09-13',now(),'Jurídico Legal Health','Tecnologia Legal Health'),
  ('cfm-recomendacao-01-2016','guia','Conselho Federal de Medicina','Recomendação sobre o processo de obtenção de consentimento livre e esclarecido','1/2016','https://portal.cfm.org.br/images/Recomendacoes/1_2016.pdf',2,array['consentimento','TCLE'],'Documental','vigente','2016-05-21',now(),'Jurídico Legal Health','Tecnologia Legal Health');

insert into public.legal_source_versions
  (source_uuid, version, status, effective_from, content, change_reason, reviewed_by, reviewed_at, review_notes, published)
select s.id, 1, 'vigente', s.publication_date,
  'Versão inicial registrada na base Legal Health: ' || s.title || ' (' || coalesce(s.number,'s/n') || '), ' || s.issuing_body || '. Texto oficial em ' || coalesce(s.official_url,'fonte oficial') || '.',
  'Carga inicial da base jurídica', 'Jurídico Legal Health', now(),
  'Trechos selecionados por relevância para o produto; texto integral deve ser consultado na fonte oficial.', true
from public.legal_sources s;

update public.legal_sources s
set current_version_id = v.id
from public.legal_source_versions v
where v.source_uuid = s.id and v.version = 1;

insert into public.legal_chunks
  (version_id, source_uuid, ordem, artigo, texto, temas, pilar, contexto_aplicacao, excecoes, nivel_risco, exige_advogado, termos_medicos, termos_juridicos)
select v.id, s.id, d.ordem, d.artigo, d.texto, d.temas, s.pilar, d.contexto, d.excecoes, d.risco::public.legal_risk_level, d.advogado, d.termos_medicos, d.termos_juridicos
from (values
  ('br-cf-1988', 1, 'Art. 5º, X', 'São inviolábeis a intimidade, a vida privada, a honra e a imagem das pessoas, assegurado o direito a indenização pelo dano material ou moral decorrente de sua violação.', array['privacidade','imagem'], 'Base constitucional para sigilo do paciente e uso de imagem em publicidade e redes sociais.', 'Uso autorizado por escrito e finalidade científica com anonimização.', 'alto', true, array['paciente','imagem clinica'], array['dano moral','intimidade']),
  ('br-lei-10406-2002', 1, 'Art. 186', 'Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, comete ato ilícito.', array['responsabilidade civil'], 'Fundamento da responsabilidade subjetiva do médico por culpa.', 'Obrigação de resultado em procedimentos estéticos é analisada de forma distinta.', 'alto', true, array['erro medico','negligencia'], array['ato ilicito','culpa']),
  ('br-lei-10406-2002', 2, 'Art. 951', 'O disposto nos arts. 948, 949 e 950 aplica-se ainda no caso de indenização devida por aquele que, no exercício de atividade profissional, por negligência, imprudência ou imperícia, causar a morte do paciente, agravar-lhe o mal, causar-lhe lesão ou inabilitá-lo para o trabalho.', array['responsabilidade civil','indenizacao'], 'Dimensiona a indenização em demandas de responsabilidade médica.', null, 'alto', true, array['lesao','incapacidade'], array['indenizacao','impericia']),
  ('br-lei-8078-1990', 1, 'Art. 14, § 4º', 'A responsabilidade pessoal dos profissionais liberais será apurada mediante verificação de culpa.', array['consumidor','responsabilidade civil'], 'Médico autônomo responde por culpa; clínicas e hospitais podem responder objetivamente pelo serviço.', 'Pessoa jurídica prestadora de serviço responde independentemente de culpa.', 'alto', true, array['clinica','consultorio'], array['profissional liberal','culpa']),
  ('br-lei-8078-1990', 2, 'Art. 6º, VIII', 'É direito básico do consumidor a facilitação da defesa de seus direitos, inclusive com a inversão do ônus da prova a seu favor, a critério do juiz, quando for verossímil a alegação ou for hipossuficiente.', array['onus da prova'], 'Explica por que prontuário e consentimento bem documentados são a principal defesa do médico.', null, 'alto', true, array['prontuario'], array['inversao do onus da prova','hipossuficiencia']),
  ('br-lei-13709-2018', 1, 'Art. 11', 'O tratamento de dados pessoais sensíveis somente poderá ocorrer com consentimento específico e destacado do titular ou, sem consentimento, nas hipóteses legais, entre elas a tutela da saúde exclusivamente em procedimento realizado por profissionais de saúde ou serviços de saúde.', array['LGPD','dados sensiveis'], 'Base legal para tratar dados de saúde em clínicas e em sistemas de prontuário eletrônico.', 'Vedado o uso compartilhado de dados de saúde para obtenção de vantagem econômica, salvo exceções legais.', 'alto', true, array['dados de saude','prontuario eletronico'], array['dado sensivel','consentimento especifico']),
  ('br-lei-13709-2018', 2, 'Art. 46', 'Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão.', array['LGPD','seguranca'], 'Fundamenta controles de acesso, backup e registro de acessos no consultório.', null, 'medio', false, array['sistema de gestao clinica'], array['agente de tratamento','incidente de seguranca']),
  ('br-lei-13105-2015', 1, 'Art. 219', 'Na contagem de prazo em dias, estabelecido por lei ou pelo juiz, computar-se-ão somente os dias úteis.', array['prazos'], 'Contagem de prazos de intimações judiciais recebidas pelo médico ou pela clínica.', 'Prazos processuais penais e administrativos podem seguir contagem em dias corridos.', 'alto', true, array[]::text[], array['prazo processual','dias uteis']),
  ('cfm-res-2217-2018', 1, 'Cap. IX, Art. 73', 'É vedado ao médico revelar fato de que tenha conhecimento em virtude do exercício de sua profissão, salvo por motivo justo, dever legal ou consentimento, por escrito, do paciente.', array['sigilo','etica medica'], 'Sigilo profissional em pedidos de informação de terceiros, convênios e processos.', 'Dever legal de notificação compulsória e ordem judicial fundamentada.', 'alto', true, array['sigilo medico'], array['dever legal','segredo profissional']),
  ('cfm-res-2217-2018', 2, 'Cap. V, Art. 31', 'É vedado ao médico desrespeitar o direito do paciente ou de seu representante legal de decidir livremente sobre a execução de práticas diagnósticas ou terapêuticas, salvo em caso de iminente risco de morte.', array['consentimento','autonomia'], 'Base ética do consentimento livre e esclarecido antes de procedimentos.', 'Iminente risco de morte autoriza atuação sem consentimento.', 'alto', true, array['procedimento','diagnostico'], array['autonomia do paciente','consentimento']),
  ('cfm-res-1821-2007', 1, 'Art. 8º', 'Fica estabelecido o prazo mínimo de 20 (vinte) anos, a partir do último registro, para a preservação dos prontuários médicos em suporte de papel.', array['prontuario','guarda documental'], 'Define por quanto tempo a clínica deve guardar prontuários antes de descarte.', 'Prontuário digitalizado conforme requisitos do CFM permite eliminação do papel.', 'alto', true, array['prontuario'], array['guarda de documentos','prazo minimo']),
  ('cfm-res-2314-2022', 1, 'Art. 3º', 'A telemedicina deve ser exercida com autonomia do médico, respeitados o sigilo, a segurança dos dados e o registro em prontuário, sendo o atendimento presencial a regra em casos de relação inicial complexa.', array['telemedicina'], 'Requisitos mínimos de teleconsulta: registro, sigilo, plataforma segura e limites de indicação.', 'Situações de urgência e teleinterconsulta possuem regras próprias.', 'medio', false, array['teleconsulta','telemonitoramento'], array['prontuario','sigilo']),
  ('cfm-res-2336-2023', 1, 'Art. 13', 'É vedado ao médico divulgar autorretrato ou imagem de paciente em situação de antes e depois de procedimentos, bem como usar expressões que sugiram garantia de resultado ou incentivo ao consumo de procedimentos.', array['publicidade medica'], 'Regra prática para redes sociais da clínica e do médico.', 'Divulgação científica em ambiente restrito a profissionais.', 'alto', true, array['antes e depois','procedimento estetico'], array['publicidade','sensacionalismo']),
  ('cfm-recomendacao-01-2016', 1, 'Item 3', 'O consentimento livre e esclarecido deve ser precedido de informação adequada sobre diagnóstico, procedimento proposto, alternativas, riscos e prognóstico, registrado no prontuário e, quando cabível, em termo escrito assinado.', array['consentimento','TCLE'], 'Checklist do que precisa constar no TCLE e no registro do processo de esclarecimento.', 'Emergência com risco iminente dispensa formalização prévia.', 'alto', true, array['TCLE','prognostico'], array['consentimento livre e esclarecido','dever de informar'])
) as d(source_id, ordem, artigo, texto, temas, contexto, excecoes, risco, advogado, termos_medicos, termos_juridicos)
join public.legal_sources s on s.source_id = d.source_id
join public.legal_source_versions v on v.source_uuid = s.id and v.version = 1;