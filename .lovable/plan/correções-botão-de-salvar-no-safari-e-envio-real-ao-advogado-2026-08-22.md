# Correções: botão de salvar no Safari e envio real ao advogado

## 1. Envio da revisão por e-mail (não chegava)

Causa confirmada: o fluxo "Enviar ao advogado" não envia e-mail nenhum. Ele registra a revisão no banco e então tenta abrir o aplicativo de e-mail do dispositivo (link `mailto:`). No Safari/iOS esse link é aberto de forma assíncrona, depois do upload, então o navegador bloqueia — e mesmo quando abre, o e-mail fica apenas como rascunho no Mail e nunca é enviado sozinho.

Correção: o app passa a enviar o e-mail de verdade pela infraestrutura da plataforma (domínio de envio já verificado).

- Novo modelo de e-mail "Revisão jurídica" na identidade Legal Health (dourado, tipografia serifada, fundo branco): dados do médico remetente, título da peça, mensagem, o conteúdo da peça e a lista de links seguros (24h) dos anexos, mais o aviso de conteúdo gerado por IA.
- Nova rota de servidor autenticada que gera os links assinados dos anexos e dispara o e-mail para o advogado, com chave de idempotência baseada no protocolo da revisão (evita duplicidade em reenvio).
- O diálogo passa a chamar essa rota: as etapas viram "Enviando anexos" → "Enviando e-mail ao advogado" → "Concluído — e-mail enviado para <e-mail>". Remoção do `mailto:` e do texto "e-mail preparado para envio".
- Se o envio do e-mail falhar, a revisão continua registrada e o diálogo mostra erro claro com botão "Tentar enviar novamente" — sem perder o comprovante.
- Comprovante para download passa a registrar a confirmação de envio pela plataforma.

Sem cópia para o médico neste momento (opção escolhida: envio automático simples).

## 2. Botão "Salvar como recomendação" ausente no Safari

O botão existe abaixo de cada resposta da IA, mas está dentro do balão da mensagem, com estilos que dependem de variantes de grupo e de um contêiner com recorte (`overflow-hidden`) — no Safari ele pode ficar cortado ou não receber toque. A causa exata ainda não foi confirmada em Safari real.

Correção:
- Mover o botão para fora do balão, para uma linha de ações própria abaixo da mensagem, sem depender do recorte do balão.
- Transformá-lo em um botão visível de verdade (contorno dourado discreto, área de toque mínima de 44px), com estado "Salvando..." e "Salva" após sucesso.
- Verificar o resultado em um navegador WebKit (mesmo motor do Safari) em telas de celular e desktop antes de concluir; se o botão ainda não aparecer, investigar o balão da mensagem com base no que o teste mostrar.

## Detalhes técnicos

- Novo `src/lib/email-templates/revisao-advogado.tsx` registrado em `src/lib/email-templates/registry.ts`.
- Novo `src/lib/revisoes.functions.ts` com `createServerFn` + `requireSupabaseAuth`: valida que a revisão pertence ao usuário, cria links assinados no bucket `documents` via cliente autenticado e chama `sendTemplateEmail('revisao-advogado', ...)`.
- `src/components/ia/enviar-revisao-dialog.tsx`: substitui `window.location.href = buildMailto(...)` pela chamada `useServerFn`; ajusta `STAGE_META` e mensagens.
- `src/lib/ia-revisoes.ts`: `buildMailto` deixa de ser usado (removido) e `buildComprovante` passa a citar o envio pela plataforma.
- `src/routes/_authenticated/ia.assistente.tsx`: botão de salvar movido para fora de `MessageContent`.
