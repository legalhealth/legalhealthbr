# Painel do time Legal Health

Uma área única e restrita ao time, em `/admin`, reunindo os relatórios do programa: candidaturas de Embaixadores, uso do chatbot e resultados do Juriscore — somando o funil da landing e a governança da base jurídica que já existem.

## O que o time verá

**Visão geral (topo da página)**
Cartões com os números do período escolhido (7, 30 ou 90 dias): candidaturas recebidas, conversas iniciadas no chatbot, diagnósticos Juriscore concluídos, score médio e quantas pessoas chegaram ao formulário de candidatura.

**Candidaturas de Embaixadores**
- Lista das candidaturas com nome, e-mail, profissão, estado/cidade, tipo de atuação, link informado, tamanho de comunidade e data.
- Filtro por situação (recebida, em análise, aprovada, recusada) e por profissão/estado.
- Botão para mudar a situação de cada candidatura, com registro da alteração.
- Busca por nome ou e-mail e exportação da lista em planilha (CSV), com aviso de que o arquivo contém dados pessoais.
- Distribuição por profissão e por estado, e taxa de aceite do consentimento de contato.

**Chatbot**
- Conversas por dia, total de mensagens, média de mensagens por conversa e proporção de conversas com mais de uma pergunta.
- Divisão entre visitantes (sem conta) e usuários logados.
- Perguntas que a base própria não cobriu (lacunas registradas), ordenadas por número de ocorrências — a lista de prioridade para ampliar a base.
- Origem das respostas (base própria de perguntas, trechos oficiais das normas ou IA), a partir da auditoria já registrada.

**Juriscore**
- Diagnósticos concluídos por período e score médio.
- Distribuição por faixa de risco (alto, médio, baixo).
- Média por pilar, para identificar onde os profissionais estão mais expostos.
- Quantos diagnósticos geraram plano de ação e quantos itens foram concluídos.

**Funil e base jurídica**
Atalhos para as páginas já existentes de funil da landing e de governança das fontes, para o time navegar entre os relatórios sem procurar endereços.

## Privacidade

- Nenhum conteúdo de conversa do chatbot é exibido: apenas contagens, e as perguntas sem cobertura que já são armazenadas para curadoria.
- Respostas individuais do Juriscore não aparecem; só médias e faixas.
- Dados pessoais aparecem apenas nas candidaturas, que o time precisa contatar, com aviso na exportação.
- O acesso é restrito a quem tem papel de administrador; qualquer outra pessoa vê apenas uma mensagem de área restrita.

## Detalhes técnicos

- Nova rota `src/routes/_authenticated/admin.index.tsx` (`/admin`) com abas: Visão geral, Candidaturas, Chatbot, Juriscore. As páginas `/admin/fontes` e `/admin/funil` continuam como estão e passam a ser linkadas do painel.
- As tabelas `chatbot_public_sessions`, `chatbot_public_messages` e `juriscore_results` não são legíveis pelo cliente (política `false` / escopo `auth.uid()`). Os relatórios agregados vêm de um novo `src/lib/admin-relatorios.functions.ts` com `createServerFn` + `requireSupabaseAuth`, que primeiro confirma `has_role(userId, 'admin')` via `context.supabase` e só então carrega `supabaseAdmin` dentro do handler para as agregações. Nada de novas políticas amplas nem de RPC `SECURITY DEFINER` exposta.
- Retorno das funções: apenas números agregados e rótulos (contagens por dia, médias, faixas, top de lacunas). Sem texto de conversa.
- Candidaturas usam o cliente do navegador: a política de leitura para administradores em `ambassador_applications` já existe. Nova migração adiciona apenas `status` atualizável por administrador (política de UPDATE restrita a `has_role(auth.uid(),'admin')`), pois hoje só há leitura e inserção.
- Hooks de dados em `src/lib/admin-relatorios.ts` (React Query, `staleTime` de 60s), seguindo o padrão de `src/lib/funil.ts` e `legal-fontes.ts`.
- Componentes de apresentação em `src/components/admin/` (`relatorio-candidaturas.tsx`, `relatorio-chatbot.tsx`, `relatorio-juriscore.tsx`), reutilizando `PageShell`, `glass-card`, tokens dourados e gráficos Recharts já usados no Juriscore.
- Exportação CSV gerada no navegador a partir dos dados já carregados, sem novo endpoint.
- Sem item no menu principal (que é para médicos); o acesso é pelo endereço `/admin`, com `robots: noindex, nofollow` como nas outras páginas administrativas.

## Verificação antes de entregar

- `bunx tsgo --noEmit` e ESLint/Prettier limpos.
- Teste no navegador em 390px e 1280px: abas, filtros de período, mudança de situação de candidatura e exportação.
- Conferência de que as funções agregadas recusam quem não é administrador e de que nenhuma resposta traz texto de conversa ou resposta individual de diagnóstico.
