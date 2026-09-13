# Pacientes e triagem por voz na Biblioteca Inteligente

Nova aba Pacientes dentro da Biblioteca Inteligente, com ficha individual permanente (histórico documental e de procedimentos) e triagem por voz com transcrição ao vivo, resumo e direcionamento feitos pela IA.

## O que o profissional passa a ter

### Aba Pacientes (lista)

- Busca por nome, cadastro rápido e contagem de atendimentos.

- Cada paciente abre a própria ficha; nada expira nem é apagado automaticamente.

### Ficha do paciente

- Dados: nome, data de nascimento, contato, convênio, observações e alertas relevantes. Quando o paciente for menor de idade ou incapaz, campo para responsável legal, com registro de quem deu o consentimento nesses casos.

- Linha de tempo única, do mais recente ao mais antigo, reunindo:

  - atendimentos e procedimentos registrados (data, tipo, profissional, notas);

  - documentos anexados (PDF/imagem) com abertura segura;

  - minutas geradas para aquele paciente;

  - triagens por voz com áudio, transcrição e resumo.

- Edições nos dados cadastrais (convênio, observações etc.) geram histórico de alteração — nunca sobrescrevem silenciosamente o valor anterior.

- Botão "Gerar documento para este paciente": abre a Biblioteca já com os dados do paciente e do profissional preenchidos; a minuta gerada fica vinculada à ficha.

- Botão "Exportar ficha/atendimento em PDF": gera um PDF com hash e timestamp da exportação, servindo como registro documental com valor probatório para o profissional em caso de processo.

### Triagem por voz

- Botão "Iniciar triagem" na ficha; o texto aparece na tela enquanto a pessoa fala.

- Consentimento em duas camadas, cada uma com data/hora registrada: (1) consentimento para o atendimento por voz em si; (2) consentimento específico para guardar o áudio bruto — o paciente pode recusar apenas o áudio e manter só a transcrição. Isso segue o Art. 11 da LGPD, que exige consentimento específico e destacado para dado de saúde (não um consentimento genérico).

- Ao encerrar, a IA devolve: motivo do contato, resumo em tópicos, urgência (alta/média/baixa), encaminhamento sugerido, documentos recomendados da Biblioteca e pendências a confirmar.

- Antes de a triagem ser salva definitivamente na ficha, o profissional revisa e pode editar o resumo, a urgência e o encaminhamento sugeridos pela IA. A triagem só passa a status "confirmada" depois dessa revisão, e fica registrado quem revisou/editou e quando. O resumo original gerado pela IA é preservado separadamente do editado.

- O áudio (quando consentido) fica guardado na ficha para ouvir depois, junto da transcrição completa e do resumo.

- Aviso claro de que a triagem é apoio e não substitui avaliação profissional, exibido antes de iniciar a gravação.

## Privacidade (dados de saúde)

- Cada ficha, documento, triagem e áudio pertence apenas à conta que criou; ninguém mais acessa.

- Áudios e anexos ficam em armazenamento privado, acessados só por link temporário.

- Exclusão manual de paciente, atendimento ou triagem sempre disponível (apaga áudio e anexos).

- Retenção do áudio bruto configurável (padrão sugerido: 90 dias), após o qual apenas a transcrição permanece — reduz o tempo de exposição do dado sensível guardado.

- Toda visualização, exportação, edição e exclusão de ficha, documento ou triagem gera um registro de auditoria (quem, quando, o quê). Isso sustenta o princípio de responsabilização da LGPD e é o que dá à ficha valor de prova.

## Detalhes técnicos

### Banco (uma migração)

- `patients` (user_id, nome, nascimento, contato, convenio, observacoes, responsavel_legal, ativo).

- `patient_events` (patient_id, tipo: atendimento|procedimento|documento|minuta|triagem, titulo, descricao, ocorrido_em, doc_id → generated_docs, document_id → documents, triage_id).

- `patient_triages` (patient_id, audio_path, transcricao, resumo jsonb, resumo_original jsonb, urgencia, encaminhamento, consentimento_atendimento_em, consentimento_audio_em, duracao_seg, status, revisado_por, revisado_em).

- `patient_audit_log` (user_id, patient_id, entidade, entidade_id, acao: visualizacao|exportacao|edicao|exclusao, ocorrido_em).

- patient_id (nullable) em generated_docs e documents para vincular o já existente.

- GRANT para authenticated/service_role, RLS por auth.uid() em todas (eventos/triagens/auditoria validam propriedade via patients), triggers updated_at.

- Bucket privado patient-audio + políticas em storage.objects restritas ao prefixo {user_id}/.

### Transcrição ao vivo

- Captura PCM via Web Audio, janelas de ~5s codificadas em WAV 16 kHz mono (não usar timeslice do MediaRecorder).

- Buffer local (IndexedDB) das janelas WAV até confirmação de upload, para não perder áudio se a rede cair no meio da gravação.

- Tratar a suspensão do Web Audio quando o app vai para segundo plano ou a tela trava (comum em PWA mobile): pausar e retomar sem corromper o WAV em andamento.

- Limite de duração por triagem (ex.: 15 minutos), com aviso ao usuário ao se aproximar do limite.

- Rota protegida `src/routes/api/ai-triagem-transcrever.ts`: recebe cada janela, encaminha a POST /v1/audio/transcriptions com google/gemini-3.5-transcribe e stream: "true", repassando o SSE; usa guardAiRequest como as demais rotas de IA.

- Ao encerrar: WAV completo salvo em patient-audio (se consentido), transcrição concatenada enviada a `src/routes/api/ai-triagem-resumo.ts` (chat, google/gemini-3.6-flash, saída JSON validada com zod) e persistida em patient_triages, com resumo_original preservado; revisado_por/revisado_em só são preenchidos após confirmação do profissional.

- Erros do gateway (402/403/429) surgem na tela com a mensagem real; nada de resposta silenciosa.

### Front-end

- `src/lib/pacientes.ts` (queries/mutations React Query), `src/lib/triagem-audio.ts` (captura/encode WAV), componentes em `src/components/pacientes/`.

- Nova aba "Pacientes" em `src/routes/_authenticated/biblioteca.tsx` junto às categorias existentes; ficha em `src/routes/_authenticated/biblioteca.paciente.$id.tsx`.

- Geração de minuta reaproveita streamBibliotecaDoc/saveHistoryItem, passando patient_id; catálogo e chips atuais permanecem intactos.

- Sinalização (na aba Pacientes ou num painel) de triagens com urgência alta sem nenhum atendimento/procedimento registrado depois — é essa lacuna que mais gera risco de processo, e é justamente o que o Legal Health se propõe a prevenir.

- Cores, fontes, espaçamentos, header e hero da página não mudam.

Prompt de triagem adicionado em `src/lib/ai-prompts.server.ts`: filtra a demanda, nunca diagnostica, não sugere conduta clínica, marca [VERIFICAR] no que não estiver claro e só recomenda modelos existentes no catálogo da Biblioteca.

&nbsp;