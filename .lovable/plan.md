# Chatbot Legal Health — widget flutuante com IA integrada

Um chatbot em bolha flutuante, ligado à mesma IA da plataforma, disponível em duas versões: interna (usuário logado, contexto jurídico completo) e pública (visitantes em `/auth` e páginas abertas). O roteamento é híbrido: o próprio modelo classifica a intenção e responde como suporte do produto ou como orientação jurídica, sempre indicando a tela certa do app.

## Experiência

**Bolha flutuante**
- Botão circular fixo no canto inferior direito, com a marca (não usar ícone genérico de "sparkles"). No mobile logado, sobe acima da barra de navegação inferior para não sobrepor.
- Ao abrir: painel `#141414`, borda `#242424`, cantos arredondados, altura limitada, cabeçalho com nome do assistente, botão de nova conversa e fechar.
- Estética idêntica ao restante: dourado nos controles principais, azul apenas no balão do usuário, resposta da IA sem fundo colorido.
- Mensagens em markdown, indicador "Pensando..." em shimmer enquanto aguarda, streaming token a token.
- Sugestões iniciais clicáveis, diferentes por versão:
  - Logado: "O que meu Juriscore indica?", "Como redigir uma resposta a intimação?", "Onde vejo meu plano de ação?"
  - Público: "O que é o Juriscore?", "Quais são os planos?", "Como a IA ajuda minha clínica?"

**Roteamento híbrido**
- Cada resposta é classificada internamente em `suporte` | `juridico` | `comercial`.
- Quando for jurídico e o assunto exigir profundidade, o chatbot responde de forma resumida e oferece um botão de atalho para a tela correspondente (Assistente, Análise de Risco, Redigir Peça, Plano, Biblioteca).
- Versão pública nunca dá orientação jurídica aplicada: explica a plataforma e convida ao cadastro.
- Aviso legal curto no rodapé do painel, como já existe nas outras telas de IA.

**Histórico no banco**
- Logado: reaproveita `chat_threads` / `chat_messages`, com uma thread marcada como origem "widget", visível no Histórico da área de IA. Ao reabrir a bolha, retoma a última conversa; "Nova conversa" cria outra thread.
- Público: sessão anônima identificada por um id gerado no navegador, gravada em tabelas novas dedicadas. Se o visitante criar conta depois, a conversa pública não é migrada (fica apenas no registro interno).

## Detalhes técnicos

**Backend**
- Logado: nova rota `src/routes/api/ai-chatbot.ts` (mesmo padrão de `api/ai-chat.ts`: valida bearer, aplica cota diária via `ai_usage`, streaming SSE, prompt em `src/lib/ai-prompts.server.ts`). Reaproveita `diagnostic-context` para injetar os pontos críticos do Juriscore.
- Público: rota `src/routes/api/public/ai-chatbot.ts`, sem autenticação, com validação Zod, limite por sessão/IP e resposta curta (tokens limitados). O handler grava a conversa com o cliente de serviço, carregado dentro do handler.
- Ambas usam o Lovable AI Gateway com `google/gemini-3.7-flash`; a chave permanece só no servidor. Erros do gateway (402, 403, 429) são repassados como mensagem clara no widget, sem retentativa automática em status terminal.

**Banco (migração)**
- `chatbot_public_sessions` (id, session_key, user_agent, created_at) e `chatbot_public_messages` (id, session_id, role, content, created_at).
- RLS habilitado, sem políticas para `anon`/`authenticated` (acesso apenas pelo servidor) e `GRANT ALL ... TO service_role` em ambas.
- Em `chat_threads`, coluna `source text default 'assistente'` para diferenciar as threads criadas pelo widget.

**Frontend**
- Componentes novos em `src/components/chatbot/`: `chat-widget.tsx` (bolha + painel), `chat-widget-messages.tsx`, `chat-widget-suggestions.tsx`, `use-chatbot.ts` (estado, streaming, persistência).
- Reutiliza os AI Elements já instalados (`conversation`, `message`, `prompt-input`, `shimmer`) em vez de primitivas próprias.
- Montagem: versão logada dentro do layout `_authenticated`; versão pública no `__root` apenas para rotas não autenticadas, evitando duas bolhas na mesma tela.
- Persistência logada via `src/lib/chatbot.functions.ts` com `requireSupabaseAuth`; leitura das mensagens ao abrir o painel.

**Verificação antes de concluir**
- Typecheck completo.
- Teste no navegador: abrir a bolha em uma rota pública e em uma logada, enviar mensagem, confirmar streaming, recarregar e conferir se o histórico volta; checar que a bolha não cobre a navegação inferior no mobile.
