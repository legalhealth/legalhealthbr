# Excluir recomendações salvas

Na tela de redigir peça, cada recomendação salva do Assistente passa a ter um botão de excluir.

## Como vai funcionar

- Ao lado de cada recomendação da lista aparece um ícone de lixeira discreto (área de toque confortável no celular).
- Ao tocar, abre uma confirmação simples ("Excluir esta recomendação?"). Confirmando, ela desaparece da lista na hora.
- Se a recomendação estava selecionada para entrar na peça, a seleção é desfeita automaticamente.
- Se der erro, aparece um aviso e a recomendação permanece.

## Detalhes técnicos

- Reutilizar `useDeleteRecommendation` de `src/lib/ia-recommendations.ts` (já existe, com invalidação da lista).
- Em `src/routes/_authenticated/ia.peca.tsx` (bloco "Recomendações salvas do Assistente", ~linhas 361-391): envolver o botão de seleção e um `<button>` de exclusão numa linha flex, mantendo o clique de seleção separado do de exclusão.
- Confirmação via `AlertDialog` (shadcn) ou `window.confirm`; usar `toast` (sonner) para erro/sucesso.
- Ao excluir com sucesso, remover o id de `selectedRecs`.
- Sem mudanças no banco: a política de exclusão de `ai_recommendations` já permite o dono apagar.
