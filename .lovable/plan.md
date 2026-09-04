# Entrar no computador usando QR-Code do celular

Quem já está logado no celular passa a poder liberar o acesso no computador escaneando um QR-Code, com uma confirmação antes de liberar.

## Como vai funcionar

1. Na tela de entrada do computador aparece a opção "Entrar com o celular". Ela mostra um QR-Code que vale por 2 minutos, com botão para gerar outro quando expira.
2. No celular (já logado), a pessoa abre "Entrar no computador" pelo Perfil, aponta a câmera e escaneia o código.
3. O celular mostra uma tela de confirmação com o pedido: horário, navegador e sistema aproximados de quem pediu, e cidade/país aproximados. A pessoa toca em "Autorizar" ou "Recusar".
4. Assim que autoriza, o computador entra automaticamente, sem digitar senha, e o código deixa de valer.
5. Se recusar, expirar ou o código já ter sido usado, o computador mostra a mensagem correspondente e permite tentar de novo.

Também ficará disponível, na mesma tela do celular, a alternativa de digitar o código de 8 caracteres exibido embaixo do QR — útil quando a câmera não funciona.

## Segurança

- O código só vale uma vez, expira em 2 minutos e é invalidado após autorizar ou recusar.
- A liberação só acontece com a confirmação explícita no celular.
- O computador não recebe nada até a autorização; ele só pergunta periodicamente se o pedido já foi aprovado.
- O pedido registra data/hora e é apagado automaticamente depois de expirar.

## Detalhes técnicos

Banco (migração com GRANTs + RLS):
- Tabela `device_login_requests`: `id`, `code` (curto, único), `verifier_hash`, `status` (`pending|approved|denied|consumed|expired`), `user_id` (preenchido ao aprovar), `session_payload_encrypted`, `user_agent`, `ip_hash`, `created_at`, `expires_at`, `approved_at`.
- Sem acesso `anon`/`authenticated` à tabela: todo acesso via server functions com `supabaseAdmin`; RLS habilitada sem políticas permissivas.

Server functions (`src/lib/device-login.functions.ts`):
- `criarPedidoLogin` (pública): cria o pedido, devolve `code` + `secret` (o segredo fica só no navegador do PC; guardamos só o hash).
- `consultarPedido` (pública, exige `code` + `secret`): devolve `pending`/`denied`/`expired`, ou, quando aprovado, os tokens de sessão uma única vez (marca `consumed`).
- `detalhesPedido` (`requireSupabaseAuth`): dados não sensíveis do pedido para a tela de confirmação no celular.
- `autorizarPedido` (`requireSupabaseAuth`): gera uma sessão para o usuário autenticado via Auth Admin (`generateLink`/refresh do token do próprio usuário), grava criptografada com AES-GCM usando segredo do servidor e marca `approved`.
- `recusarPedido` (`requireSupabaseAuth`).

Frontend:
- `src/routes/auth.tsx`: aba/botão "Entrar com o celular" renderizando novo `src/components/auth/qr-login-panel.tsx` (QR gerado no cliente com `qrcode` — pacote leve, carregado sob demanda), polling a cada 2s, expiração e regeneração; ao receber tokens chama `supabase.auth.setSession` e navega para `/inicio`.
- Nova rota autenticada `src/routes/_authenticated/entrar-no-pc.tsx`: leitor de câmera (import dinâmico de `@zxing/browser`, apenas no clique), campo para digitar o código, tela de confirmação com Autorizar/Recusar, mensagens de erro/expiração.
- Link "Entrar no computador" em `src/routes/_authenticated/perfil.tsx`.
- Rota `/entrar/$code` (pública) que, se logado, encaminha para a tela de confirmação; se não, manda para `/auth?next=...`.

Limpeza: expiração verificada em cada leitura; remoção dos pedidos antigos aproveitando o cron diário já existente.

Verificações: typecheck, lint, e teste no navegador do fluxo completo (gerar código, aprovar, entrar; recusar; expirar) a 390px e 1280px.
