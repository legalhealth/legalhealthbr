# Triagem por voz, WhatsApp, acesso do assistente e administração de minutas

Seis frentes, entregues em quatro etapas. Cada etapa fica utilizável antes da próxima começar.

## Etapa 1 — Triagem por voz confiável no celular

Hoje a gravação já existe na ficha do paciente, mas precisa funcionar de forma previsível no celular.

- Pedir permissão do microfone só depois do consentimento, com mensagens claras quando o navegador nega, quando não há microfone ou quando o áudio fica mudo.
- Manter a gravação viva quando a tela apaga ou o app vai para segundo plano; ao voltar, a captação continua sem perder o trecho anterior.
- Indicador de voz ao vivo (nível do som) para o profissional confirmar que está captando, cronômetro e avisos de limite.
- Trechos de áudio guardados no aparelho até a confirmação de envio, com reenvio automático em rede instável.
- Transcrição aparecendo durante a conversa; ao encerrar, o áudio completo é guardado (quando autorizado) e a IA organiza motivo, prioridade, encaminhamento e pendências.
- **Sugestão de minutas** em destaque no resultado: modelos da aba Minutas ligados ao caso, com um toque para gerar já vinculado ao paciente.
- Teste real de ponta a ponta com uma consulta curta: gravar, transcrever, salvar áudio, revisar resumo e abrir uma minuta sugerida.

## Etapa 2 — Tela de triagem completa (sem voz)

Nova tela de triagem estruturada na Biblioteca, ao lado da triagem por voz:

- Campos: identificação do paciente, sintomas/queixa, histórico e medicações, exames e documentos anexados, sinais de alerta e fatores de risco.
- Classificação de risco calculada e exibida (baixo / médio / alto), com justificativa em texto.
- Ao concluir, a minuta correspondente é gerada automaticamente (consentimento, orientação ou registro conforme o caso) e vinculada à ficha do paciente.
- Tudo revisável e editável antes de salvar; a IA nunca diagnostica nem indica conduta.

## Etapa 3 — Envio pelo WhatsApp (link pronto)

O chatbot da Biblioteca passa a enviar minutas e resultados de triagem para o WhatsApp do profissional, sem abrir nenhuma API.

- Número do WhatsApp salvo no Perfil (com confirmação simples do formato).
- No chatbot e na triagem, um botão "Enviar no WhatsApp" abre o WhatsApp do aparelho com a mensagem e o link seguro do documento já escritos — você só toca em enviar.
- Funciona no celular e no computador (WhatsApp Web), sem contratar serviço nem aprovar número.
- O link do documento continua temporário e seguro, igual aos envios por e-mail.

## Etapa 4 — Assistente da clínica e administração de minutas

**Acesso do assistente**

- O médico convida o assistente por e-mail no Perfil; o convite expira e pode ser revogado.
- O assistente cria a própria senha e entra numa área própria: lista de pacientes daquele médico, fichas, histórico e minutas vinculadas.
- Pode cadastrar pacientes e fazer triagem (voz e formulário); não pode excluir pacientes, ver assinatura/plano nem acessar as demais áreas do médico.
- Toda ação do assistente fica registrada no histórico do paciente com o nome de quem fez.

**Administração de minutas**

- Nova área de administração na Biblioteca para criar, editar, reordenar e excluir minutas e categorias, sem depender do chat.
- Dois níveis: catálogo oficial mantido pelo time Legal Health (visível a todos) e modelos privados de cada profissional (visíveis só na conta dele).
- Cada minuta tem título, categoria/subcategoria, campos que o formulário deve pedir e as instruções que a IA segue ao gerar.

## Detalhes técnicos

- Captura: mantém PCM via Web Audio + WAV completo por janela (`src/lib/triagem-audio.ts`); trocar `ScriptProcessorNode` por `AudioWorklet` com fallback, `wakeLock` opcional e reconstrução do `AudioContext` em `visibilitychange`.
- Transcrição/resumo seguem em `src/routes/api/ai-triagem-transcrever.ts` (SSE) e `ai-triagem-resumo.ts`; sugestão de minutas validada contra `BIBLIOTECA_CATEGORIAS`.
- Triagem estruturada: nova tabela `patient_screenings` + geração de minuta reaproveitando `/api/ai-biblioteca`, com `patient_id` já suportado em `generated_docs`.
- WhatsApp: `whatsapp_messages` (log) + `profiles.whatsapp`/`whatsapp_verificado_em`; rota `src/routes/api/public/hooks/whatsapp-status.ts` para callbacks de status, com verificação de assinatura. Secrets: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`.
- Assistente: `clinic_members` (medico_user_id, assistente_user_id, papel, status) + `clinic_invites`; novo papel `assistente` no enum `app_role`; RLS de `patients`, `patient_events`, `patient_triages`, `generated_docs` e `documents` passa a aceitar dono OU assistente ativo via função `security definer` (`pode_ver_paciente`). Rotas sob `_authenticated/clinica/*`.
- Minutas: `library_templates` + `library_categories` com escopo `oficial` (admin) e `proprio` (user_id), RLS por `has_role('admin')`/`auth.uid()`; catálogo estático atual vira seed e a Biblioteca lê a união das duas fontes.
- Validação: `bunx tsgo --noEmit`, ESLint e testes Playwright autenticados (triagem curta, envio WhatsApp em modo simulado, login do assistente, CRUD de minutas).
