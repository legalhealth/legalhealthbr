# Auditoria de segurança dos dados de paciente — laudo de riscos

Você pediu apenas o laudo: eu levanto e documento os riscos, sem alterar o aplicativo agora. Duas decisões suas já entram como requisito nas recomendações: o áudio da triagem fica guardado sem prazo (descarte manual) e queremos, no futuro, exportar e apagar definitivamente todos os dados de um paciente a pedido do titular.

## O que já está bem protegido (verificado)

- Toda leitura e gravação de ficha, atendimentos, triagens (voz e formulário), histórico de campos e registro de acessos passa por uma regra de conta: só o profissional dono ou um assistente ativo daquela clínica alcança os dados.
- Apagar paciente, atendimento ou triagem é exclusivo do dono da conta — assistente não apaga.
- Documentos e minutas vinculados a paciente só são visíveis ao assistente quando estão realmente ligados a um paciente; o resto da pasta do médico continua fechado.
- Os áudios ficam em área privada, em pasta por usuário, sem link público.
- Convite de assistente é preso ao e-mail convidado, expira e só pode ser aceito enquanto pendente.

## Riscos encontrados (ordenados por gravidade)

1. **Registro de acessos é feito pelo próprio navegador e falha em silêncio.** Quem visualiza ou exporta uma ficha é gravado a partir do aplicativo, e o erro é ignorado de propósito para não travar a tela. Consequência: o histórico de "quem viu o quê" pode ter lacunas e não serve como prova sólida em fiscalização. Recomendação: gravar esse registro no servidor, junto da própria leitura dos dados.
2. **Assistente pode escrever no registro de acessos da conta.** As regras permitem que qualquer pessoa com acesso à conta insira linhas nesse histórico, inclusive em nome de outra. Recomendação: permitir gravação só pelo servidor.
3. **Áudio da triagem é lido apenas pelo dono da pasta.** Como você quer guardar sem prazo, isso significa acervo permanente de voz de paciente: assistente que gravou não consegue reouvir, e não existe nenhuma tela para listar e apagar áudios antigos. Recomendação: criar uma lista de gravações com botão de apagar por atendimento, e aviso claro de que o áudio fica guardado até exclusão manual.
4. **Não há atendimento a pedido do titular.** Hoje não existe forma de entregar ao paciente tudo o que está guardado sobre ele nem de apagar definitivamente (ficha, atendimentos, triagens, áudio, minutas). Recomendação: implementar exportação completa e exclusão definitiva com registro do pedido — trabalho para a etapa seguinte.
5. **Sem prazo de descarte e sem aviso de retenção.** A escolha de guardar sem prazo é legítima, mas precisa estar escrita para o profissional e para o paciente no termo de consentimento, e o profissional precisa poder apagar quando quiser.
6. **Falta contrato de tratamento de dados com as clínicas.** A plataforma trata dado sensível de saúde em nome do profissional; sem esse contrato e sem política de privacidade específica de paciente, o risco recai sobre você em caso de incidente.
7. **Sem plano de incidente.** Não existe procedimento definido para detectar, conter e comunicar vazamento de dados de paciente nos prazos legais.

## Entrega

Um documento de auditoria (`docs/auditoria-dados-paciente.md`) com: escopo verificado, achados acima com gravidade e impacto, recomendação prática para cada um, e uma ordem sugerida de correção. Sem nenhuma alteração no aplicativo, no banco ou nas regras de acesso.

## Detalhes técnicos

- Verificado: políticas RLS de `patients`, `patient_events`, `patient_triages`, `patient_screenings`, `patient_field_history`, `patient_audit_log`, `generated_docs`, `documents`, `clinic_members`, `clinic_invites`; políticas de `storage.objects` para `patient-audio`/`documentos`/`documents`; funções `pode_acessar_conta` e `eh_assistente_de`; `registrarAuditoria` em `src/lib/pacientes.ts`; guardas das rotas `api/ai-triagem-transcrever` e `api/ai-triagem-resumo`.
- Achado 1/2 detalhado no laudo: `registrarAuditoria` roda no cliente com `catch {}`; política `Conta registra auditoria` com `WITH CHECK pode_acessar_conta(user_id)` permite insert por assistente. Correção proposta (não aplicada): mover para server function com `requireSupabaseAuth` e insert via cliente privilegiado, revogando insert de `authenticated`.
- Achado 3: `storage.objects` para `patient-audio` filtra por `foldername[1] = auth.uid()`, incompatível com leitura por assistente da mesma conta; nenhuma rotina de expurgo existe (coerente com "sem prazo"), faltando UI de exclusão.
