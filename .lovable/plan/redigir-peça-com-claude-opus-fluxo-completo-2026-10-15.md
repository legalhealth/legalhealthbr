# Redigir peça com Claude Opus — fluxo completo

A tela "Redigir peça" já tem anexar → leitura → redigir, e o servidor já tenta o Claude Opus primeiro. Este plano fecha as lacunas para que o fluxo seja de fato "Claude lê o documento e redige".

## O que muda para o médico

1. **Anexar** (como hoje): PDF ou foto, vários arquivos, até 15 MB.
2. **Leitura pelo Claude**: o Claude passa a receber o próprio arquivo (PDF/imagem), não só o resumo extraído — lê carimbos, datas e prazos diretamente. A pré-visualização (tipo de documento, partes, prazos, pontos críticos) continua aparecendo.
3. **Tipo de peça**: sugerido automaticamente; campo de ajuste continua disponível.
4. **Complemento opcional** e recomendações salvas (como hoje).
5. **Redigir**: texto aparece enquanto é escrito, com um selo discreto "Redigido com Claude Opus". Se o Claude cair, a IA atual assume e o selo indica isso.
6. **Parar**: novo botão para interromper a redação no meio, mantendo o texto parcial.
7. Copiar, salvar no histórico e enviar ao advogado seguem iguais.

## Regras mantidas
- Limites diários do plano continuam valendo.
- Sem documento legível e sem complemento suficiente, o botão fica bloqueado.
- `[VERIFICAR]` em dados ausentes e aviso de revisão pelo advogado no final.

## Detalhes técnicos
- `src/lib/anthropic.server.ts`: aceitar `attachments` (`document` base64 para PDF, `image` para fotos) no conteúdo da mensagem; emitir evento SSE inicial `{"provider":"claude"|"fallback"}`; tratar `stop_reason: "refusal"` e 403 como terminais (sem fallback); propagar `AbortSignal` ao upstream.
- `src/routes/api/ai-peca.ts`: aceitar `arquivos: {nome, mime, dataUrl}[]` (máx. 4, ~20 MB total), validar mime, repassar ao Claude; no fallback, usar apenas o texto extraído.
- `src/lib/ia-peca.ts` / `src/lib/ia-chat.ts`: baixar os anexos legíveis como dataUrl (reaproveitando `downloadAsDataUrl`), enviar junto; ler o evento de provedor; suportar `AbortController`.
- `src/routes/_authenticated/ia.peca.tsx`: selo do provedor, botão Parar, estado de carregamento limpo em erro/recusa/parada.
- Verificação: teste real com um PDF de intimação via sessão autenticada, conferindo streaming e selo.
