# Pacientes e triagem por voz na Biblioteca Inteligente

Nova aba **Pacientes** dentro da Biblioteca Inteligente, com ficha individual permanente (histórico documental e de procedimentos) e triagem por voz com transcrição ao vivo, resumo e direcionamento feitos pela IA.

## O que o profissional passa a ter

**Aba Pacientes (lista)**
- Busca por nome, cadastro rápido e contagem de atendimentos.
- Cada paciente abre a própria ficha; nada expira nem é apagado automaticamente.

**Ficha do paciente**
- Dados: nome, data de nascimento, contato, convênio, observações e alertas relevantes.
- Linha de tempo única, do mais recente ao mais antigo, reunindo:
  - atendimentos e procedimentos registrados (data, tipo, profissional, notas);
  - documentos anexados (PDF/imagem) com abertura segura;
  - minutas geradas para aquele paciente;
  - triagens por voz com áudio, transcrição e resumo.
- Botão "Gerar documento para este paciente": abre a Biblioteca já com os dados do paciente e do profissional preenchidos; a minuta gerada fica vinculada à ficha.

**Triagem por voz**
- Botão "Iniciar triagem" na ficha; o texto aparece na tela enquanto a pessoa fala.
- Ao encerrar, a IA devolve: motivo do contato, resumo em tópicos, urgência (alta/média/baixa), encaminhamento sugerido, documentos recomendados da Biblioteca e pendências a confirmar.
- O áudio fica guardado na ficha para ouvir depois, junto da transcrição completa e do resumo.
- Aviso claro de que a triagem é apoio e não substitui avaliação profissional, com consentimento do paciente registrado antes de gravar.

## Privacidade (dados de saúde)

- Cada ficha, documento, triagem e áudio pertence apenas à conta que criou; ninguém mais acessa.
- Áudios e anexos ficam em armazenamento privado, acessados só por link temporário.
- Exclusão manual de paciente, atendimento ou triagem sempre disponível (apaga áudio e anexos).
- Consentimento do paciente para gravação registrado com data/hora.

## Detalhes técnicos

**Banco (uma migração)**
- `patients` (user_id, nome, nascimento, contato, convenio, observacoes, ativo).
- `patient_events` (patient_id, tipo: `atendimento|procedimento|documento|minuta|triagem`, titulo, descricao, ocorrido_em, doc_id → `generated_docs`, document_id → `documents`, triage_id).
- `patient_triages` (patient_id, audio_path, transcricao, resumo jsonb, urgencia, encaminhamento, consentimento_em, duracao_seg, status).
- `patient_id` (nullable) em `generated_docs` e `documents` para vincular o já existente.
- GRANT para `authenticated`/`service_role`, RLS por `auth.uid()` em todas (eventos/triagens validam propriedade via `patients`), triggers `updated_at`.
- Bucket privado `patient-audio` + políticas em `storage.objects` restritas ao prefixo `{user_id}/`.

**Transcrição ao vivo**
- Captura PCM via Web Audio, janelas de ~5s codificadas em WAV 16 kHz mono (não usar timeslice do MediaRecorder).
- Rota protegida `src/routes/api/ai-triagem-transcrever.ts`: recebe cada janela, encaminha a `POST /v1/audio/transcriptions` com `google/gemini-3.5-transcribe` e `stream: "true"`, repassando o SSE; usa `guardAiRequest` como as demais rotas de IA.
- Ao encerrar: WAV completo salvo em `patient-audio`, transcrição concatenada enviada a `src/routes/api/ai-triagem-resumo.ts` (chat, `google/gemini-3.6-flash`, saída JSON validada com zod) e persistida em `patient_triages`.
- Erros do gateway (402/403/429) surgem na tela com a mensagem real; nada de resposta silenciosa.

**Front-end**
- `src/lib/pacientes.ts` (queries/mutations React Query), `src/lib/triagem-audio.ts` (captura/encode WAV), componentes em `src/components/pacientes/`.
- Nova aba "Pacientes" em `src/routes/_authenticated/biblioteca.tsx` junto às categorias existentes; ficha em `src/routes/_authenticated/biblioteca.paciente.$id.tsx`.
- Geração de minuta reaproveita `streamBibliotecaDoc`/`saveHistoryItem`, passando `patient_id`; catálogo e chips atuais permanecem intactos.
- Cores, fontes, espaçamentos, header e hero da página não mudam.

**Prompt de triagem** adicionado em `src/lib/ai-prompts.server.ts`: filtra a demanda, nunca diagnostica, marca `[VERIFICAR]` no que não estiver claro e só recomenda modelos existentes no catálogo da Biblioteca.
