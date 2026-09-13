# Roadmap — Legal Health

## Landing pública de Embaixadores (concluído)
- [x] Landing pública em `/` (visitante) + painel movido para `/inicio` (redireciona quem já tem sessão)
- [x] Candidatura real em `ambassador_applications` (insert público validado por RLS, leitura só admin) + página `/embaixadores`
- [x] Páginas legais `/termos` e `/privacidade` (com retenção e canal de privacidade)
- [x] Eventos de conversão sem dados pessoais em `src/lib/analytics.ts`
- [ ] Regulamento oficial do programa + revisão jurídica dos textos legais (hoje marcados como preliminares)
- [ ] Painel admin para triagem das candidaturas
- [ ] Lighthouse mobile/desktop após publicação

## Em andamento
- [ ] Base própria de Q&A jurídico (`legal_qa`) + busca no banco usada pelo chatbot antes da IA externa
- [ ] Painel de curadoria da base em `/admin/base-juridica` (papel admin)
- [ ] Papéis de usuário (`user_roles`: medico | advogado | admin) + `has_role`
- [ ] Painel do advogado em `/advogado` (revisões recebidas, anexos, comprovante, parecer, status)
- [ ] Comprovante público por token em `/revisao/$token` (intimação anexada + Juriscore, sem login)
- [ ] Publicar e validar logado (chatbot responde pela base sem créditos, Juriscore e histórico carregam)
- [ ] Corrigir aviso de hidratação do cabeçalho no preview

## Pendências conhecidas (fora do escopo atual)
- Checkout/pagamento dos planos (hoje só grava `profiles.plano`)
- Service worker (offline) e Web Push reais
- Cron + e-mail dos lembretes de prazo (`plan_reminders`, TODO no hook)

## Progresso (base própria + link seguro)
- [x] Base `legal_qa` com 41 Q&A (jurídico, suporte, comercial), busca `match_legal_qa`, registro de usos e lacunas
- [x] Chatbot logado e público respondem primeiro pela base própria (sem consumir créditos de IA)
- [x] Token seguro de 7 dias por revisão + link no e-mail do advogado
- [x] Página pública `/revisao/<token>` com intimação anexada, peça e Juriscore, sem login
- [ ] Painel do advogado (`/advogado`) com parecer e resposta direta + e-mail ao médico (template `revisao-parecer` já criado)
- [ ] Painel admin da base jurídica (`/admin/base-juridica`) usando `src/lib/legal-qa.ts`
- [ ] Publicar e validar logado com pergunta coberta pela base

## Progresso (infraestrutura da base jurídica)
- [x] Fontes oficiais versionadas (`legal_sources`, `legal_source_versions`, hash, vigência, responsáveis)
- [x] Trechos indexados (`legal_chunks`) com tema, pilar, risco e exigência de advogado
- [x] Recuperação `match_legal_chunks` com relevância por termos raros, filtro de vigência e autoridade
- [x] Citação de fontes + auditoria (`ai_answer_audit`) nas rotas de IA (assistente, chatbot logado e público)
- [x] Painel de governança em `/admin/fontes` (alertas, versões, bloqueio, auditoria)
- [ ] Suíte de 100 casos jurídicos de validação
- [ ] Painel do advogado (`/advogado`) e painel `/admin/base-juridica`


## Pipeline de ingestão (concluído)
- Catálogo curado de 12 fontes oficiais em `src/lib/legal-ingest.server.ts` (9 HTML automáticas + 3 do CFM em PDF, com curadoria manual).
- Coleta idempotente: compara o texto oficial com o indexado, cria nova versão só quando há alteração e preserva a anterior.
- Painel admin em /admin/fontes (`src/components/admin/painel-ingestao.tsx`) com histórico em `legal_ingest_runs`.
- Resoluções CFM 2.314/2022, 2.336/2023 e 2.217/2018 curadas em `src/lib/legal-curadoria-cfm.server.ts` e indexadas (152 trechos vigentes, versão 2, revisor registrado).
- Pendências: painel do advogado /advogado, suíte de 100 casos.

## Atualização automática da base jurídica (concluída)
- Rotina diária (cron do banco, 06:10 UTC) chama `/api/public/hooks/base-juridica-sync`.
- Reconfere as 12 fontes oficiais, cria nova versão quando o texto muda (versão anterior preservada como `alterada`).
- Detecta nota de revogação/suspensão no cabeçalho oficial → fonte marcada `em_revisao` para triagem humana.
- Alertas gravados em `legal_change_alerts`, exibidos em `/admin/fontes` e enviados por e-mail aos administradores (template `base-juridica-alerta`).

## Auditoria da landing pública (briefing 9/10)
- Bloco de clareza imediata com os três benefícios confirmados e situação explícita.
- Cartões da plataforma com situação real por recurso e texto honesto sobre fontes oficiais.
- Novas seções: responsabilidades do embaixador (antes do formulário), tabela Benefício/Situação/Observação (inclui remuneração "sujeito ao regulamento") e limites da plataforma.
- FAQ ampliada (indicação, redes sociais, dados de pacientes, pós-3 meses, tratamento de dados).
- Formulário: primeira etapa curta (cidade e tipo de atuação passaram a opcionais), erros com `aria-live` e evento `application_field_error`; envio por POST (sem dados na URL).
- Menu mobile fecha por Escape e devolve o foco ao botão.
- Analytics: `benefits_view`, `application_field_error`, `diagnostic_cta_click` adicionados.
- Verificado: menu, FAQ, tabela, envio real (com sucesso e erro), zero erro de console, 200 em /, /auth, /embaixadores, /termos, /privacidade, /inicio.
- Pendente: Lighthouse mobile/desktop após publicação, teste com 10 profissionais, regulamento oficial do programa, painel admin de candidaturas.

## Ajustes visuais na Biblioteca Inteligente (13/09)
- [x] Chips de categoria em grade 2x2 no celular (sem pílula órfã), mantendo uma linha no desktop
- [x] Ícone de pessoa no chip "Pacientes" para diferenciar a área de cadastro
- [x] Margem de segurança entre o botão flutuante do chat e os campos do formulário
- [ ] Conferir em mais aparelhos reais (iPhone SE / Android pequeno) após publicar

## Lighthouse no pipeline (concluído)
- `bun run lighthouse` mede as rotas públicas (/, /embaixadores, /auth) em mobile e desktop contra `BASE_URL` (padrão localhost:8080).
- `bun run lighthouse:build` faz o build de produção, sobe o worker com wrangler em 4173 e mede — é o número que vale (o dev server distorce a performance).
- `bun run lighthouse:prod` mede o site publicado; `lighthouse:mobile` / `lighthouse:desktop` restringem o formato.
- Metas em `scripts/lighthouse.config.mjs`; abaixo delas o comando sai com código 1 (pronto para CI). `--sem-metas` só mede.
- Relatórios HTML + JSON e `resumo.json` em `.lighthouse/` (fora do versionamento).
- Linha de base do build local: mobile perf 38-51 / a11y 92-94; desktop perf 84 / a11y 94. SEO 100, boas práticas 96.
- Pendências apontadas pelo relatório: 404 KiB de JS não usado (perf mobile), contraste de cor, links distinguíveis só por cor e um rótulo acessível divergente.
