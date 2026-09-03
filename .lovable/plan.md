# Redigir Peça a partir do documento anexado

Hoje a tela `Redigir peça` exige que o médico escolha o tipo de peça em uma lista e preencha vários campos manualmente. A mudança inverte o fluxo: o médico anexa o documento (intimação, notificação, sindicância, glosa, reclamação), a IA lê, identifica o que é e redige a defesa técnica.

## Novo fluxo da tela

1. **Anexar documento** — área de upload (PDF ou foto, até 15 MB, vários arquivos), igual à usada na Análise de Risco. Cada arquivo fica salvo em Documentos.
2. **Leitura automática** — ao anexar, a IA extrai o conteúdo e mostra: tipo de documento identificado, partes, prazos detectados e trechos essenciais.
3. **Tipo de peça sugerido pela IA** — em vez de o usuário escolher às cegas, a IA propõe a peça adequada (ex.: "Defesa em Sindicância no CRM"). Fica visível e ajustável em um campo secundário, caso o médico queira mudar.
4. **Complemento opcional** — um único campo de texto livre ("O que a IA deve saber a mais sobre o caso?"). Os campos obrigatórios de fatos, objetivo, provas, órgão e partes deixam de ser exigidos: a IA os extrai do documento e marca `[VERIFICAR]` no que não estiver claro.
5. **Redigir defesa técnica** — botão único. A peça é gerada em streaming, com o documento anexado como base factual, mais o contexto do Juriscore® e as recomendações salvas (comportamento atual mantido).
6. **Depois de gerada** — copiar texto, salvar no histórico e "Enviar ao advogado" continuam funcionando como hoje, com os anexos vinculados ao envio.

## Regras

- Sem documento anexado, o botão fica desabilitado com a mensagem "Anexe o documento que originou o caso".
- Se o arquivo estiver ilegível, a tela avisa e pede reenvio ou permite descrever o caso no campo livre.
- A peça continua citando as fontes da base jurídica própria e encerra com o aviso de revisão pelo advogado.

## Detalhes técnicos

- `src/routes/_authenticated/ia.peca.tsx`: substituir o `Select` de tipos e os campos obrigatórios pelo bloco de upload/extração (reaproveitando o padrão de `ia.risco.tsx`, `useUploadDocuments` e `useAnalyzeDocument` de `src/lib/ia-documents.ts`), mais pré-visualização da leitura e campo livre.
- `src/lib/ia-peca.ts`: `PecaInput` passa a aceitar `documentos: { nome, tipo_documento, texto, analise }[]` e `complemento`, mantendo `tipo` como sugestão/override.
- `src/routes/api/ai-peca.ts`: montar o prompt a partir da análise dos documentos; validação deixa de exigir `fatos` com 20 caracteres e passa a exigir pelo menos um documento analisado (ou complemento suficiente).
- `src/lib/ai-prompts.server.ts` (prompt `peca`): instruir a IA a inferir o tipo de peça e o órgão de destino a partir do documento, extrair fatos/pedidos/provas do próprio conteúdo e usar `[VERIFICAR]` quando o documento não trouxer o dado.
- `TIPOS_PECA` continua existindo apenas como lista de override e para rotular o histórico.
