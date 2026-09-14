# Onboarding guiado + correção dos oito riscos da auditoria

Duas frentes: (A) levar o médico novo do Juriscore até a primeira minuta sem se perder; (B) corrigir os oito achados da auditoria de dados de paciente, começando por retenção e contrato com as clínicas.

## A. Onboarding guiado (trilha + progresso fixo)

Trilha de 3 passos, sempre com o mesmo estado:

1. **Juriscore** — responder o questionário e ver o score.
2. **Seus riscos** — ver as prioridades do plano de ação.
3. **Primeira minuta** — gerar o primeiro documento na Biblioteca.

- No primeiro acesso, a tela de boas-vindas passa a abrir a trilha com "Começar agora" e, nas voltas seguintes, "Continuar de onde parei" — sempre aponta para o passo pendente.
- No Início, um cartão de progresso fixo mostra os 3 passos com marca de concluído, calculada do que já existe na conta (tem Juriscore, tem plano de ação, tem minuta gerada) — não depende do navegador, então funciona no celular e no PC.
- Ao terminar cada passo, um rodapé discreto convida para o próximo ("Ver seus 3 riscos", "Gerar sua primeira minuta"), para o caminho nunca terminar em tela vazia.
- Quando os 3 passos estão concluídos, o cartão vira um resumo de conquista e sai do caminho.
- Assistentes de clínica não veem a trilha (não usam Juriscore).

## B. Correção dos oito achados

### 1. Retenção e avisos (achado 6) — primeiro
- Texto claro de retenção sem prazo na ficha do paciente, na triagem por voz e no termo de consentimento apresentado antes de gravar: o que é guardado, por quanto tempo (até exclusão manual), quem acessa e que a análise passa por um serviço de inteligência artificial.
- Aviso de revisão humana obrigatória mantido em destaque.

### 2. Contrato com as clínicas e documentos jurídicos (achados 7, 4, 8)
Minutas em arquivo, para revisão do seu advogado antes de publicar:
- `docs/contrato-tratamento-dados-clinicas.md` — contrato de operador de dados (papéis, finalidade, sigilo, subprocessadores, incidentes, término).
- `docs/politica-privacidade-paciente.md` — política voltada ao paciente, incluindo o envio a serviço de IA e a retenção sem prazo.
- `docs/dpa-provedor-ia.md` — pontos exigidos do provedor de IA (sigilo, não uso para treino, subprocessadores, região, incidentes).
- `docs/plano-resposta-incidente.md` — responsáveis, canais e roteiro das primeiras 72 horas.

### 3. Registro de acessos confiável (achados 1 e 2)
- O registro de "quem viu, gerou ou exportou o quê" passa a ser gravado pelo servidor junto da própria operação, sem falhar em silêncio; erros ficam visíveis nos registros do sistema.
- A escrita direta desse registro pela conta é revogada, então ninguém pode inserir ou forjar linhas — nem o assistente.

### 4. Áudio de paciente: acesso único e exclusão (achado 3)
- Todo acesso ao áudio passa a usar link temporário emitido pelo servidor, igual aos documentos, e o assistente com vínculo ativo passa a poder ouvir gravações da mesma conta.
- Nova lista de gravações na ficha, com duração, data, autor e botão "Apagar gravação" (apaga o arquivo e o vínculo, com registro no histórico de acessos), e aviso de que o áudio fica guardado até ser apagado.

### 5. Pedido do titular: exportação e exclusão (achado 5)
- Botão "Exportar tudo deste paciente" na ficha: gera um arquivo com dados cadastrais, atendimentos, triagens, avaliações e lista de documentos vinculados.
- Botão "Apagar definitivamente" com confirmação por nome do paciente: remove ficha, atendimentos, triagens, avaliações, áudios e vínculo dos documentos.
- Ambos ficam registrados como pedido do titular, com data e autor, e a tela declara que cópias de segurança da infraestrutura só expiram dentro da janela de retenção do provedor — não prometemos exclusão mais ampla do que existe.

## Detalhes técnicos

- Progresso do onboarding derivado do servidor: existência de linha em `juriscore_results`, `action_plans` e `generated_docs`; `lh:welcome-seen` continua só para não repetir a trilha.
- Auditoria: nova `src/lib/pacientes.functions.ts` com `registrarAuditoria` sob `requireSupabaseAuth`, gravando via `supabaseAdmin` com `autor_user_id = context.userId` e `user_id` validado por `pode_acessar_conta`; `registrarAuditoria` client-side é removida. Migração: `REVOKE INSERT ON public.patient_audit_log FROM authenticated` e remoção da política `Conta registra auditoria`.
- Áudio: server fn `urlAudioTriagem` (link assinado, TTL curto) validando `pode_acessar_conta(user_id)` e `excluirAudioTriagem`; políticas de `storage.objects` do bucket `patient-audio` reescritas para leitura só pelo servidor (dono/assistente via server fn), mantendo upload do dono.
- Exportação/exclusão: server fns `exportarPaciente` e `apagarPacienteDefinitivo` (`requireSupabaseAuth`, restritas ao dono), com escrita em `patient_audit_log` (`acao = 'exportacao_titular' | 'exclusao_titular'`) antes da remoção; exclusão em ordem de dependências + remoção dos objetos no bucket.
- Consentimento/retenção como constantes em `src/lib/triagem.ts` para reuso na ficha, triagem por voz e termo.
- Validação: `bunx tsgo --noEmit`, ESLint e Playwright autenticado em localhost:8080 (trilha, ficha, exclusão de áudio, exportação).
