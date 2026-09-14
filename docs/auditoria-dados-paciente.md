# Auditoria de segurança dos dados de paciente

Data: 14/09/2026
Escopo: dados de paciente na plataforma Legal Health (fichas, atendimentos, triagem por voz, triagem estruturada, documentos vinculados, acesso da equipe da clínica).
Natureza: laudo de riscos. **Nenhuma alteração foi feita no aplicativo, no banco ou nas regras de acesso.**

Decisões de produto já assumidas como requisito nas recomendações:

- O áudio da triagem é guardado **sem prazo de expiração**; o descarte é manual.
- Exportar e apagar definitivamente todos os dados de um paciente (pedido do titular) entra como etapa seguinte.

---

## 1. Escopo verificado

Regras de acesso (RLS) das tabelas: `patients`, `patient_events`, `patient_triages`, `patient_screenings`, `patient_field_history`, `patient_audit_log`, `generated_docs`, `documents`, `clinic_members`, `clinic_invites`.

Políticas de arquivos (`storage.objects`) dos buckets `patient-audio`, `documentos` e `documents`.

Funções de controle de acesso: `public.pode_acessar_conta(_dono uuid)` e `public.eh_assistente_de(_dono uuid)` (ambas SECURITY DEFINER, EXECUTE restrito a `authenticated`/`service_role`).

Código: `src/lib/pacientes.ts` (incluindo `registrarAuditoria`), `src/lib/triagem.ts`, `src/lib/triagem-estruturada.ts`, `src/lib/triagem-audio.ts`, `src/lib/clinica.ts`, `src/lib/clinica.functions.ts`, e as rotas `src/routes/api/ai-triagem-transcrever.ts` e `src/routes/api/ai-triagem-resumo.ts`.

---

## 2. O que já está bem protegido

| Item | Situação |
| --- | --- |
| Leitura/gravação de ficha, atendimentos, triagens e histórico de campos | Restrito por `pode_acessar_conta(user_id)`: apenas o dono ou assistente com vínculo `ativo` |
| Exclusão de paciente, atendimento e triagem | Exclusiva do dono (`user_id = auth.uid()`); assistente não apaga |
| Documentos e minutas para o assistente | Somente quando `patient_id IS NOT NULL` e há vínculo ativo; o restante da pasta do médico permanece fechado |
| Áudio de triagem | Bucket privado, sem URL pública, caminho por usuário |
| Convite de assistente | Preso ao e-mail convidado (`current_user_email()`), com expiração e aceite só em estado `pendente` |
| Rotas de IA da triagem | Passam por `guardAiRequest` (autenticação e limite de uso) |

---

## 3. Achados

### Achado 1 — Registro de acessos é gravado pelo navegador e falha em silêncio
**Gravidade: alta.**
`registrarAuditoria` (`src/lib/pacientes.ts`) insere em `patient_audit_log` a partir do cliente, envolto em `try { ... } catch {}` deliberado para não interromper a ficha.
**Impacto:** o histórico de "quem viu/exportou o quê" pode ter lacunas silenciosas e não sustenta comprovação em fiscalização ou apuração de incidente.
**Recomendação:** mover o registro para uma server function com `requireSupabaseAuth`, gravando junto da própria leitura dos dados, com cliente privilegiado.

### Achado 2 — Assistente pode escrever no registro de acessos da conta
**Gravidade: alta.**
A política `Conta registra auditoria` permite INSERT com `WITH CHECK pode_acessar_conta(user_id)`, ou seja, qualquer pessoa com acesso à conta pode inserir linhas — inclusive apontando outro autor.
**Impacto:** o próprio log usado para investigar incidentes pode ser forjado.
**Recomendação:** revogar o INSERT direto de `authenticated` e permitir a gravação apenas pelo servidor. A mesma correção do Achado 1 resolve os dois.

### Achado 3 — Dois padrões distintos de acesso a arquivo sensível
**Gravidade: média-alta.**
`patient-audio` é lido por política direta no bucket (`foldername[1] = auth.uid()`), enquanto documentos e minutas usam link assinado temporário.
**Impacto:** dois modelos de acesso ao mesmo tipo de risco (arquivo sensível) elevam o custo de auditoria e manutenção; além disso, o assistente da mesma conta não consegue reouvir áudio gravado por outra pessoa da equipe. Como a retenção é sem prazo, forma-se um acervo permanente de voz de paciente sem tela de listagem nem exclusão.
**Recomendação:** unificar no modelo de link assinado e criar listagem de gravações com botão de apagar por atendimento, com aviso explícito de que o áudio permanece até exclusão manual.

### Achado 4 — Dado de saúde processado por provedor de IA externo sem contrato verificado
**Gravidade: alta (jurídica).**
`api/ai-triagem-transcrever` e `api/ai-triagem-resumo` encaminham áudio e texto do paciente a um gateway de IA de terceiros, que passa a ser subprocessador de dado sensível de saúde. Nenhum DPA ou cláusula de sigilo com esse provedor foi verificado.
**Recomendação:** formalizar contrato de tratamento de dados com o provedor e declarar esse envio a terceiros no termo de consentimento do paciente — hoje o consentimento cobre gravação e armazenamento, não a transferência.

### Achado 5 — Não há atendimento a pedido do titular
**Gravidade: média-alta (jurídica).**
Não existe caminho para entregar ao paciente tudo o que está guardado sobre ele, nem para apagar definitivamente ficha, atendimentos, triagens, áudio e minutas.
**Recomendação:** implementar exportação completa e exclusão definitiva, com registro do pedido. Ressalva de desenho: apagar da tabela não remove o dado das cópias de backup do banco dentro da janela de retenção da infraestrutura — a comunicação ao titular precisa declarar isso, para não prometer exclusão mais ampla do que a infraestrutura garante.

### Achado 6 — Sem prazo de descarte e sem aviso de retenção
**Gravidade: média.**
Guardar sem prazo é uma escolha legítima, mas precisa estar escrita para o profissional e para o paciente, e o profissional precisa poder apagar quando quiser.
**Recomendação:** texto de retenção no termo de consentimento e na ficha, somado à exclusão manual do Achado 3.

### Achado 7 — Falta contrato de tratamento de dados com as clínicas
**Gravidade: alta (jurídica).**
A plataforma trata dado sensível de saúde em nome do profissional, sem contrato de operador nem política de privacidade específica de paciente.
**Recomendação:** contrato de tratamento de dados padrão para clínicas e política de privacidade de paciente, antes de escalar a base de clientes.

### Achado 8 — Sem plano de incidente
**Gravidade: média.**
Não há procedimento definido para detectar, conter e comunicar vazamento de dados de paciente nos prazos legais.
**Recomendação:** plano mínimo com responsáveis, canais e roteiro das primeiras 72 horas.

---

## 4. Ordem sugerida de correção

Gravidade técnica não é o mesmo que urgência de negócio. Esta ordem prioriza o que sustenta a confiabilidade do restante do sistema e o risco legal já existente.

**Agora — técnico, rápido, sustenta o resto**
1. Achados 1 e 2: mover o registro de auditoria para o servidor e revogar o INSERT do cliente. Enquanto isso não é feito, o histórico usado para investigar qualquer outro incidente pode estar incompleto ou forjado.
2. Achado 3: unificar o acesso a arquivo por link assinado e criar a tela de listar/apagar áudio.

**Agora, em paralelo — jurídico e processo, sem depender de código**
3. Achado 7 (contrato com as clínicas) e Achado 4 (DPA com o provedor de IA). O risco cresce a cada clínica nova; resolver antes de escalar.
4. Achado 8: plano de incidente básico.

**Próxima etapa — feature maior**
5. Achado 5: exportação e exclusão a pedido do titular, com a ressalva de backup declarada.
6. Achado 6: aviso de retenção sem prazo, integrado ao mesmo trabalho de consentimento do Achado 4.

---

## 5. Referências técnicas dos achados

- `registrarAuditoria` — `src/lib/pacientes.ts` (insert client-side com `catch {}` silencioso).
- Política `Conta registra auditoria` em `patient_audit_log` — INSERT para `authenticated` com `WITH CHECK pode_acessar_conta(user_id)`.
- Políticas de `storage.objects` para `patient-audio` — filtro `(storage.foldername(name))[1] = auth.uid()::text` nas quatro operações.
- Rotas de IA da triagem — `src/routes/api/ai-triagem-transcrever.ts`, `src/routes/api/ai-triagem-resumo.ts` (encaminhamento a gateway de terceiros via `guardAiRequest`).
- Funções de acesso — `public.pode_acessar_conta`, `public.eh_assistente_de`.
