# Tirar os avisos repetidos da Central de alertas

## O que está acontecendo

Cada prioridade do plano de ação gera dois lembretes do mesmo prazo (um com antecedência de 7 dias e outro de 1 dia). Como os dois têm o mesmo título e a mesma data de vencimento, a lista "Prazos vencendo" no Início — e a lista de prazos na tela do Plano — mostra o mesmo aviso duas vezes.

Confirmado nos dados: para cada prioridade existem exatamente 2 registros com título e data idênticos, diferindo só na antecedência.

## O que muda

- Cada prazo aparece uma única vez, com a contagem correta ("vence hoje", "vence amanhã", "em X dias").
- Vale para a Central de alertas no Início e para a lista de prazos na tela do Plano, já que ambas leem a mesma fonte.
- Nada é apagado do banco: os dois lembretes continuam existindo para o envio de aviso por e-mail nos dois momentos; apenas a exibição deixa de repetir.

## Detalhes técnicos

- `usePlanReminders` em `src/lib/plano.ts`: agrupar o resultado por `titulo` + `due_date` e manter um registro por grupo (o de menor `offset_days`, preservando a ordem por `due_date`).
- Nenhuma mudança em `src/routes/_authenticated/inicio.tsx` nem em `plano.tsx` além do efeito da deduplicação; sem migração de banco.

## Verificação

- Checagem de tipos e conferência das duas telas em viewport de celular, confirmando um único item por prazo.
