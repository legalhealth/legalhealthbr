# # Auditoria de segurança dos dados de paciente — laudo de riscos

Você pediu apenas o laudo: eu levanto e documento os riscos, sem alterar o aplicativo agora. Duas decisões suas já entram como requisito nas recomendações: o áudio da triagem fica guardado sem prazo (descarte manual) e queremos, no futuro, exportar e apagar definitivamente todos os dados de um paciente a pedido do titular.

## O que já está bem protegido (verificado)

- Toda leitura e gravação de ficha, atendimentos, triagens (voz e formulário), histórico de campos e registro de acessos passa por uma regra de conta: só o profissional dono ou um assistente ativo daquela clínica alcança os dados.

- Apagar paciente, atendimento ou triagem é exclusivo do dono da conta — assistente não apaga.

- Documentos e minutas vinculados a paciente só são visíveis ao assistente quando estão realmente ligados a um paciente; o resto da pasta do médico continua fechado.

- Os áudios ficam em área privada, em pasta por usuário, sem link público.

- Convite de assistente é preso ao e-mail convidado, expira e só pode ser aceito enquanto pendente.

## Riscos encontrados (ordenados por gravidade)

1. **Registro de acessos é feito pelo próprio navegador e falha em silêncio.** Quem visualiza ou exporta uma ficha é gravado a partir do aplicativo, e o erro é ignorado de propósito para não travar a tela. Consequência: o histórico de "quem viu o quê" pode ter lacunas e não serve como prova sólida em fiscalização. Recomendação: gravar esse registro no servidor, junto da própria leitura dos dados.

2. **Assistente pode escrever no registro de acessos da conta.** As regras permitem que qualquer pessoa com acesso à conta insira linhas nesse histórico, inclusive em nome de outra. Recomendação: permitir gravação só pelo servidor — a mesma correção do item 1 resolve os dois de uma vez, revogando o insert direto do cliente.

3. **Dois padrões diferentes de acesso a arquivo sensível na mesma plataforma.** O áudio da triagem é lido por política direta no bucket (dono da pasta), enquanto documentos e minutas usam link assinado temporário. Manter dois modelos de acesso a arquivo sensível é mais difícil de auditar e manter seguro do que um único padrão. Isso também explica por que o assistente da mesma conta não consegue reouvir um áudio gravado por outra pessoa da equipe. Recomendação: migrar o áudio para o mesmo modelo de link assinado, e criar uma tela de listagem com botão de apagar por atendimento — já que a decisão do produto é guardar sem prazo, o descarte precisa ser manual e visível.

4. **Dado de saúde processado por um provedor de IA externo, sem contrato formal verificado.** A triagem por voz envia áudio e texto do paciente para um serviço de terceiros de transcrição e resumo (gateway de IA). Isso torna esse provedor um subprocessador de dado sensível de saúde. Recomendação: formalizar um contrato de tratamento de dados (DPA) com esse provedor e declarar esse fluxo especificamente no termo de consentimento do paciente — hoje o consentimento cobre a gravação e o armazenamento, mas não o envio a terceiros.

5. **Não há atendimento a pedido do titular.** Hoje não existe forma de entregar ao paciente tudo o que está guardado sobre ele nem de apagar definitivamente (ficha, atendimentos, triagens, áudio, minutas). Recomendação: implementar exportação completa e exclusão definitiva com registro do pedido — trabalho para a etapa seguinte. Ressalva importante para o desenho dessa etapa: apagar da tabela não remove o dado de cópias de backup do banco dentro da janela de retenção do provedor de infraestrutura; a comunicação ao titular precisa deixar isso explícito, para não prometer uma exclusão mais completa do que a infraestrutura garante hoje.

6. **Sem prazo de descarte e sem aviso de retenção.** A escolha de guardar sem prazo é legítima, mas precisa estar escrita para o profissional e para o paciente no termo de consentimento, e o profissional precisa poder apagar quando quiser.

7. **Falta contrato de tratamento de dados com as clínicas.** A plataforma trata dado sensível de saúde em nome do profissional; sem esse contrato e sem política de privacidade específica de paciente, o risco recai sobre você em caso de incidente.

8. **Sem plano de incidente.** Não existe procedimento definido para detectar, conter e comunicar vazamento de dados de paciente nos prazos legais.

## Ordem sugerida de correção

A gravidade técnica acima não é a mesma coisa que urgência de negócio — esta ordem prioriza o que sustenta a confiabilidade do restante do sistema e o risco legal que já existe hoje, independente de código:

**Agora — técnico, rápido, sustenta o resto**

1. Achados 1 e 2 (mover o registro de auditoria para o servidor). Enquanto isso não é corrigido, o próprio histórico usado para investigar qualquer outro incidente pode ter lacunas ou ser forjado por um assistente — é a base de tudo, não só mais um item da lista.

2. Achado 3 (unificar o acesso a arquivo por link assinado e criar a tela de listar/apagar áudio).

**Agora, em paralelo — jurídico e processo, não depende de código**

3. Achado 7 (contrato de tratamento de dados com as clínicas) e achado 4 (contrato/DPA com o provedor de IA de transcrição). Risco legal que recai sobre o profissional e a plataforma desde já, e cresce a cada clínica nova — vale resolver antes de escalar a base, não depois.

4. Achado 8 (plano de incidente básico: quem faz o quê nas primeiras 72h em caso de vazamento).

**Próxima etapa — feature maior**

5. Achado 5 (exportação e exclusão a pedido do titular), já desenhado desde o início com a ressalva de backup declarada ao paciente.

6. Achado 6 (aviso de retenção sem prazo) — integra o mesmo trabalho de consentimento do paciente do achado 4.

## Entrega

Um documento de auditoria `docs/auditoria-dados-paciente.md`) com: escopo verificado, achados acima com gravidade e impacto, recomendação prática para cada um, e a ordem sugerida de correção. Sem nenhuma alteração no aplicativo, no banco ou nas regras de acesso.

## Detalhes técnicos

- Verificado: políticas RLS de `patients`, `patient_events`, `patient_triages`, `patient_screenings`, `patient_field_history`, `patient_audit_log`, `generated_docs`, `documents`, `clinic_members`, `clinic_invites`; políticas de `storage.objects` para `patient-audiodocumentosdocuments`; funções `pode_acessar_conta` e `eh_assistente_de`; `registrarAuditoria` em `src/lib/pacientes.ts`; guardas das rotas `api/ai-triagem-transcrever` e `api/ai-triagem-resumo`.

- Achado 1/2 detalhado no laudo: `registrarAuditoria` roda no cliente com `catch {}`; política `Conta registra auditoria` com `WITH CHECK pode_acessar_conta(user_id)` permite insert por assistente. Correção proposta (não aplicada): mover para server function com `requireSupabaseAuth` e insert via cliente privilegiado, revogando insert de `authenticated`.

- Achado 3: `storage.objects` para `patient-audio` filtra por `foldername[1] = auth.uid()`, incompatível com leitura por assistente da mesma conta; `documentsgenerated_docs` usam token assinado temporário — padrões diferentes para o mesmo tipo de risco (arquivo sensível). Nenhuma rotina de expurgo existe (coerente com "sem prazo"), faltando UI de exclusão.

- Achado 4 (novo): rotas `api/ai-triagem-transcrever` e `api/ai-triagem-resumo` encaminham áudio/texto de paciente ao gateway de IA de terceiros — nenhum DPA ou cláusula de sigilo verificada com esse provedor até o momento.

&nbsp;