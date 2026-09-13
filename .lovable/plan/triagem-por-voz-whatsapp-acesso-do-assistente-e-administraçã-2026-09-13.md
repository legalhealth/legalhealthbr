# # Triagem por voz, WhatsApp, acesso do assistente e administração de minutas

&nbsp;

Seis frentes, entregues em quatro etapas. Cada etapa fica utilizável antes da próxima começar.

&nbsp;

## Etapa 1 — Triagem por voz confiável no celular

&nbsp;

Hoje a gravação já existe na ficha do paciente, mas precisa funcionar de forma previsível no celular.

&nbsp;

- Pedir permissão do microfone só depois do consentimento, com mensagens claras quando o navegador nega, quando não há microfone ou quando o áudio fica mudo.

- Manter a gravação viva quando a tela apaga ou o app vai para segundo plano; ao voltar, a captação continua sem perder o trecho anterior.

- Indicador de voz ao vivo (nível do som) para o profissional confirmar que está captando, cronômetro e avisos de limite.

- Trechos de áudio guardados no aparelho até a confirmação de envio, com reenvio automático em rede instável.

- Transcrição aparecendo durante a conversa; ao encerrar, o áudio completo é guardado (quando autorizado) e a IA organiza motivo, prioridade, encaminhamento e pendências.

- **Sugestão de minutas** em destaque no resultado: modelos da aba Minutas ligados ao caso, com um toque para gerar já vinculado ao paciente.

- O refactor técnico da captura (ver Detalhes técnicos) não pode alterar o fluxo já existente: consentimento em duas camadas (atendimento e áudio bruto), revisão humana obrigatória antes de a triagem virar "confirmada" e `resumo_original` preservado separado do editado pelo profissional.

- Teste real de ponta a ponta com uma consulta curta: gravar, transcrever, salvar áudio, revisar resumo e abrir uma minuta sugerida.

&nbsp;

## Etapa 2 — Tela de triagem completa (sem voz)

&nbsp;

Nova tela de triagem estruturada na Biblioteca, ao lado da triagem por voz:

&nbsp;

- Campos: identificação do paciente, sintomas/queixa, histórico e medicações, exames e documentos anexados, sinais de alerta e fatores de risco.

- Classificação de risco calculada e exibida (baixo / médio / alto), com justificativa em texto.

- Ao concluir, a minuta correspondente é gerada automaticamente (consentimento, orientação ou registro conforme o caso) e vinculada à ficha do paciente.

- Tudo revisável e editável antes de salvar; a triagem só vira "confirmada" depois dessa revisão — mesmo padrão já usado na triagem por voz. A IA nunca diagnostica nem indica conduta.

&nbsp;

## Etapa 3 — Envio pelo WhatsApp (link pronto)

&nbsp;

O chatbot da Biblioteca passa a enviar minutas e resultados de triagem para o WhatsApp do profissional, sem abrir nenhuma API.

&nbsp;

- Número do WhatsApp salvo no Perfil (com confirmação simples do formato). É o WhatsApp do próprio profissional — ele recebe o link para si mesmo, não envia diretamente ao paciente.

- No chatbot e na triagem, um botão "Enviar no WhatsApp" abre o WhatsApp do aparelho com a mensagem e o link seguro do documento já escritos — você só toca em enviar.

- Funciona no celular e no computador (WhatsApp Web), sem contratar serviço nem aprovar número.

- O link do documento continua temporário e seguro, igual aos envios por e-mail.

- Um envio direto ao paciente fica fora de escopo por ora: dado de saúde trafegando por WhatsApp para terceiros exigiria consentimento específico à parte, diferente do autoenvio aqui descrito.

&nbsp;

## Etapa 4 — Assistente da clínica e administração de minutas

&nbsp;

**Acesso do assistente**

&nbsp;

- O médico convida o assistente por e-mail no Perfil; o convite expira e pode ser revogado antes de aceito.

- O assistente cria a própria senha e entra numa área própria: lista de pacientes daquele médico, fichas, histórico e minutas vinculadas.

- Pode cadastrar pacientes e fazer triagem (voz e formulário); não pode excluir pacientes, ver assinatura/plano nem acessar as demais áreas do médico.

- O médico também pode desativar um assistente já ativo (não só revogar convite pendente), suspendendo o acesso imediatamente sem apagar o histórico de ações dele.

- Toda ação do assistente fica registrada no histórico do paciente com o nome de quem fez — o registro de auditoria guarda o autor real (médico ou assistente), não só o dono da conta.

&nbsp;

**Administração de minutas**

&nbsp;

- Nova área de administração na Biblioteca para criar, editar, reordenar e excluir minutas e categorias, sem depender do chat.

- Dois níveis: catálogo oficial mantido pelo time Legal Health (visível a todos) e modelos privados de cada profissional (visíveis só na conta dele).

- Cada minuta tem título, categoria/subcategoria, campos que o formulário deve pedir e as instruções que a IA segue ao gerar.

- O catálogo oficial tem estado rascunho/publicado: edições ficam em rascunho até serem publicadas, para uma alteração incompleta do time Legal Health não ir ao ar para todos os profissionais no meio do trabalho.

&nbsp;

## Detalhes técnicos

&nbsp;

- Captura: mantém PCM via Web Audio + WAV completo por janela (`src/lib/triagem-audio.ts`); trocar `ScriptProcessorNode` por `AudioWorklet` com fallback, `wakeLock` opcional e reconstrução do `AudioContext` em `visibilitychange`, preservando os campos e o fluxo de consentimento/revisão já existentes em `patient_triages`.

- Transcrição/resumo seguem em `src/routes/api/ai-triagem-transcrever.ts` (SSE) e `ai-triagem-resumo.ts`; sugestão de minutas validada contra `BIBLIOTECA_CATEGORIAS`.

- Triagem estruturada: nova tabela `patient_screenings` (com `status` incluindo rascunho/confirmada, espelhando `patient_triages`) + geração de minuta reaproveitando `/api/ai-biblioteca`, com `patient_id` já suportado em `generated_docs`.

- WhatsApp: `profiles.whatsapp` no Perfil; botões montam link `wa.me/<numero>?text=...` com mensagem + URL assinada temporária do documento (reaproveita os tokens seguros já usados nas revisões). Sem backend novo.

- Assistente: `clinic_members` (medico_user_id, assistente_user_id, papel, status: convidado|ativo|inativo) + `clinic_invites` (com expiração); novo papel `assistente` no enum `app_role`; RLS de `patients`, `patient_events`, `patient_triages`, `generated_docs` e `documents` passa a aceitar dono OU assistente ativo via função `security definer` (`pode_ver_paciente`). Rotas sob `_authenticated/clinica/*`.

- Auditoria: `patient_audit_log` passa a ter `autor_user_id` (quem executou a ação) separado de `dono_user_id` (a quem pertence a conta/paciente), preenchido tanto para o médico quanto para o assistente.

- Minutas: `library_templates` (com `status`: rascunho|publicado) + `library_categories`, com escopo `oficial` (admin) e `proprio` (user_id); RLS por `has_role('admin')`/`auth.uid()`; catálogo estático atual vira seed e a Biblioteca lê a união das duas fontes, mostrando ao profissional apenas itens oficiais publicados.

- Validação: `bunx tsgo --noEmit`, ESLint e testes Playwright autenticados (triagem curta por voz e por formulário, envio WhatsApp em modo simulado, login e desativação do assistente, CRUD de minutas com rascunho/publicação).

&nbsp;