# Medir o funil de candidatura da landing

Hoje os eventos da landing (visita, início e envio do formulário) só existem no navegador: nada é gravado, então não há como saber quantas pessoas chegam ao formulário e quantas concluem. O plano cria essa medição própria, sem cookies de terceiros e sem dados pessoais.

## O que você vai ver

Um painel novo em `/admin/funil` (visível apenas para administradores) com:

- Visitantes da landing, quantos viram o formulário, quantos começaram a preencher e quantos enviaram.
- Taxas de conversão entre cada etapa (visita → formulário visto → início → envio).
- Filtro por período (7, 30, 90 dias) e comparação entre a landing (`/`) e a página `/embaixadores`.
- Motivos de abandono agregados: qual validação mais bloqueia o envio (consentimento, motivo curto, campos obrigatórios, antispam).
- Número de candidaturas efetivamente salvas no período, para conferir contra os envios registrados.

## Como a medição funciona

- Cada visita recebe um identificador aleatório temporário guardado apenas na sessão do navegador, para não contar a mesma pessoa várias vezes. Nenhum nome, e-mail, texto digitado ou IP é gravado.
- Os eventos são enviados em segundo plano e não atrasam a página nem bloqueiam o envio da candidatura.
- Continua valendo a regra atual: só nomes de evento e rótulos curtos permitidos (seção, origem, posição, id).

## Detalhes técnicos

1. **Banco (migração)**
   - Tabela `landing_events`: `id`, `session_key` (texto curto aleatório), `event` (texto validado contra a lista de eventos), `rota`, `secao`, `origem`, `posicao`, `id_ref`, `variante`, `created_at`.
   - `GRANT INSERT ON public.landing_events TO anon, authenticated` (necessário para visitantes) + `GRANT ALL ... TO service_role` + `GRANT SELECT TO authenticated`.
   - RLS habilitada: policy de `INSERT` para `anon`/`authenticated` com `WITH CHECK (true)` restrita por `CHECK` de domínio nos campos; policy de `SELECT` só via `public.has_role(auth.uid(), 'admin')`.
   - Índices em `(created_at)` e `(event, created_at)`.
   - Função `public.funil_landing(_desde timestamptz, _rota text)` (`SECURITY DEFINER`, `search_path = public`, `REVOKE ... FROM anon`) devolvendo os totais por etapa e sessões distintas; usada pelo painel.

2. **Cliente**
   - `src/lib/analytics.ts`: manter `track()` como está (dataLayer + evento local) e adicionar o envio persistido — `sendBeacon` com `fetch keepalive` como fallback — para a rota pública abaixo. Gera/lê `session_key` em `sessionStorage`.
   - Novos eventos: `application_form_view` (formulário entrou na viewport, disparado por `DeferredSection`/`IntersectionObserver` na landing e em `/embaixadores`) e `application_abandon_reason` reaproveitando o `id` já enviado em `application_field_error`.
   - `candidatura-form.tsx`: nenhum campo novo; apenas dispara `application_form_view` ao montar e mantém `application_start`/`application_submit`.

3. **Rota pública de coleta**
   - `src/routes/api/public/landing-event.ts` (`POST`): valida com Zod a lista fechada de eventos e o tamanho dos rótulos, descarta chaves fora da allowlist, aplica limite simples por sessão/janela e grava com o cliente publicável. Responde `204` sempre, sem devolver dados.

4. **Painel**
   - `src/routes/_authenticated/admin.funil.tsx`, seguindo o padrão de `/admin/fontes`: gate por `useHasRole("admin")`, cartões de etapa, barras de conversão e tabela de motivos de abandono, nos tokens visuais atuais (fundo `#0A0A0A`, cartões `#141414`, dourado `#C8A96A`).

5. **Verificação**
   - Typecheck e lint.
   - Teste no navegador em 375px: abrir a landing, rolar até o formulário, enviar uma candidatura de teste e conferir as quatro etapas no painel; depois remover a linha de teste.
   - Conferir que nenhum dado pessoal aparece nos registros gravados.
