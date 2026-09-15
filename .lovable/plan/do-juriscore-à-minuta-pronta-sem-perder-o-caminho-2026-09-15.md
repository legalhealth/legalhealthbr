# Do Juriscore à minuta pronta, sem perder o caminho

Hoje a trilha termina apontando a aba Minutas, mas quem cadastra um paciente fica parado na lista, e o documento gerado não tem botão de imprimir. Este plano fecha esse fim de caminho.

## 1. Depois de salvar o paciente, seguir direto para a minuta

- Ao salvar um paciente novo pelo cadastro rápido, aparece uma confirmação com duas ações: **Gerar minuta deste paciente** (destaque) e **Abrir a ficha**.
- "Gerar minuta deste paciente" abre a aba Minutas já com o paciente selecionado e o modelo do passo da trilha, com a página posicionada no botão de gerar.
- Quando os primeiros passos ainda não estão concluídos, essa ação vem pré-selecionada e a faixa da trilha explica que falta apenas gerar o documento.

## 2. Documento pronto com os dados da clínica

- O cabeçalho com nome, responsável técnico, CNPJ, endereço, telefone, e-mail e horários da clínica continua sendo incluído, e passa a vir ligado por padrão.
- Se a clínica ainda não estiver preenchida, aparece um aviso discreto acima do botão de gerar: "Preencha os dados da clínica para o documento sair com cabeçalho" com link para a tela da Clínica.
- Quando há paciente selecionado, o nome do paciente entra na identificação do documento, logo abaixo do cabeçalho da clínica.

## 3. Botão de imprimir

- No bloco do documento, junto de Copiar texto e Enviar no WhatsApp, entra **Imprimir / Salvar em PDF**.
- Abre o documento formatado em página branca (cabeçalho da clínica, título, corpo e aviso de revisão humana) e chama a impressão do aparelho, onde o próprio celular ou computador oferece "Salvar como PDF".
- Se o navegador bloquear a abertura da janela, aparece um aviso pedindo para permitir pop-ups.

## Detalhes técnicos

- `src/components/pacientes/lista-pacientes.tsx`: após `criar.mutateAsync`, exibir as duas ações; a de minuta navega para `/biblioteca` com `search: { cat: "minutas", pac: id }`.
- `src/routes/_authenticated/biblioteca.tsx`: `incluirClinica` inicia `true`; aviso quando `!clinicaData?.clinica`; incluir a linha do paciente no texto ao lado de `cabecalhoClinica`; novo botão de imprimir chamando um helper compartilhado.
- Novo helper `imprimirTexto({ titulo, corpo, cabecalho })` em `src/lib/conformidade-docs.ts` (ou módulo irmão `src/lib/imprimir.ts`), reaproveitando a mesma estratégia de `abrirImpressao` (nova aba + `window.print()`, retorno `false` quando bloqueado).
- Sem mudanças de banco de dados; `useProgressoTrilha` já detecta a minuta gerada (`origem: "biblioteca"`).
