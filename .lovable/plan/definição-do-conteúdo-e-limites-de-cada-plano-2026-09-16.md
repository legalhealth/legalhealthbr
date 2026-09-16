# Definição do conteúdo e limites de cada plano

Decisões já tomadas: gratuito é **permanente**; **toda consulta de IA conta** no limite (assistente, peças, minutas, triagem por voz, leitura de documento); preços mantidos (Essential R$ 197/mês, Professional R$ 497/mês, Enterprise sob consulta).

## Proposta de conteúdo por plano

### Gratuito (permanente) — porta de entrada
- **5 consultas de IA por dia** (janela de 24h, como já funciona hoje).
- Juriscore® completo, 1x por mês.
- Plano de Ação com as prioridades do Juriscore.
- Biblioteca: leitura do catálogo; geração de minutas conta no limite diário de IA.
- 1 paciente cadastrado na ficha (sem histórico estendido).
- Sem triagem por voz (o resumo de triagem é consulta de IA pesada; fica como degustação bloqueada com convite de upgrade).
- Suporte por e-mail.

### Essential — R$ 197/mês (médico individual)
- **40 consultas de IA por dia**.
- Juriscore® ilimitado, com histórico completo.
- Minutas e peças ilimitadas dentro do limite diário de IA.
- Pacientes ilimitados, com histórico documental e procedimental.
- Triagem por voz liberada.
- Central de alertas e lembretes de prazo por e-mail.
- Exportação e exclusão de dados do paciente (direitos do titular).
- Suporte por e-mail.

### Professional — R$ 497/mês (clínicas e equipes)
- Tudo do Essential, com **150 consultas de IA por dia** (conta da clínica).
- **Equipe**: até 3 assistentes por convite, com acesso às fichas e minutas sem entrar na conta do médico.
- Minutas oficiais da clínica (aba Clínica) e modelos privados.
- WhatsApp do profissional: envio de triagens e minutas sem abrir o app.
- Revisão humana por advogado: até 2 revisões por mês incluídas.
- Documentos de conformidade (Política de Retenção, Contrato LGPD) com dados da clínica.
- Suporte prioritário (WhatsApp).

### Enterprise — sob consulta (redes e operadoras)
- Limites de IA sob medida, múltiplas clínicas e equipes sem teto de assistentes.
- Revisões jurídicas em volume contratado.
- Painel administrativo consolidado, exportações e relatórios.
- Contrato de tratamento de dados dedicado e plano de resposta a incidentes customizado.
- Onboarding assistido e suporte dedicado.

## O que será implementado

1. **Tabela de planos e limites** — coluna `plan` em `profiles` (padrão `free`) + tabela `plan_limits` (slug, limite diário de IA, juriscore por mês, max pacientes, max assistentes, triagem por voz, revisões por mês) com as 4 linhas seed; RLS: leitura autenticada, escrita só service_role.
2. **Enforcement no servidor** — `guardAiRequest` passa a ler o limite do plano do usuário em `plan_limits` em vez da constante fixa; mensagem de bloqueio passa a indicar o plano atual e link para `/perfil#planos`. Checagens extras: triagem por voz bloqueada no plano gratuito (erro amigável), limite de pacientes e de assistentes validados nas server functions de pacientes e convite.
3. **Tela de planos** — seção de assinatura no Perfil vira comparativo completo (4 colunas no desktop, cartões empilhados no celular) com a matriz acima, destaque no Professional, marcação do plano atual e botões "Assinar" (placeholder até o pagamento ser ligado) / "Falar com a equipe" no Enterprise.
4. **Avisos de upgrade** — ao atingir o limite diário, o aviso mostra quantas consultas o plano atual permite e o ganho no próximo plano.

## Fora de escopo (próximos passos, quando você quiser)
- Cobrança real (pagamento dos planos) — hoje os planos existem na tela, sem checkout.
- Troca de plano self-service; nesta etapa a alteração de plano é feita por você no banco (service_role).

## Detalhes técnicos
- Migração: `plan_limits` (GRANT SELECT authenticated, ALL service_role; RLS) + `profiles.plan` com default `'free'`; seed idempotente das 4 linhas.
- `src/lib/ai-gateway.server.ts` (`guardAiRequest`): busca plano do usuário → limite em `plan_limits`; fallback seguro para o menor limite em caso de erro.
- `src/lib/clinica.functions.ts` (`convidarAssistente`) e `src/lib/pacientes.ts`: validação de limites do plano antes de inserir.
- `src/routes/_authenticated/perfil.tsx`: substituir `PLANS` pela matriz completa (dados em `src/lib/planos.ts`, reutilizável na landing depois).

## Verificação
- `bunx tsgo --noEmit` e ESLint.
- Playwright autenticado: tela de planos no celular e desktop; bloqueio de triagem por voz no plano gratuito; mensagem de limite diário com o nome do plano.
