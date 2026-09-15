# Política de Retenção e Contrato LGPD na Biblioteca

## O que você vai ter

Uma nova aba **Conformidade** na Biblioteca, visível só para o dono da conta, com dois documentos prontos para consulta e envio:

1. **Política de Retenção de Dados** — o que a plataforma guarda (ficha do paciente, atendimentos, triagens, gravações de voz, minutas e registro de acessos), que nada expira automaticamente, como se apaga definitivamente pela ficha do paciente, e a ressalva sobre cópias de segurança da infraestrutura.
2. **Contrato de Tratamento de Dados (LGPD) com a clínica** — papéis de controlador e operador, finalidades, dados sensíveis de saúde, segurança, uso de serviço de inteligência artificial, incidentes, direitos do titular e encerramento.

Cada documento abre em página própria, com o texto completo na tela e os dados da sua clínica já preenchidos (nome, CNPJ, responsável técnico, endereço e contato, vindos da tela Clínica). O que ainda não estiver cadastrado aparece marcado como **[preencher]**, com um aviso no topo listando o que falta e um atalho para a tela Clínica.

## Versão para anexar ao e-mail formal

Em cada página, dois botões:

- **Baixar em Word** — arquivo .doc que abre no Word e no Google Docs, para o advogado revisar e comentar.
- **Baixar em PDF** — abre a versão de impressão já formatada (cabeçalho Legal Health, margens, sem menus) e você salva como PDF pelo próprio aparelho ou computador.

Os dois trazem a mesma marcação de versão e data e a nota de que é minuta sujeita a revisão do advogado, até que você indique que foi validada.

## Onde fica

- Chip **Conformidade** na lista de abas da Biblioteca, ao lado das demais; leva a uma lista com os dois documentos.
- Assistente de clínica não vê o chip nem as páginas.
- A página pública `/retencao-de-dados` passa a apontar para essa área quando o usuário está logado, sem mudar de aparência.

## Detalhes técnicos

- Conteúdo dos dois documentos em `src/lib/conformidade-docs.ts`: blocos de título e parágrafos em dados (não HTML solto), com marcadores substituídos pelos campos de `clinics` via `useClinica()`; helper que lista os campos faltantes.
- Duas rotas novas: `src/routes/_authenticated/conformidade.retencao.tsx` e `src/routes/_authenticated/conformidade.contrato-lgpd.tsx`, mais `conformidade.index.tsx` com a lista; cada uma com `head()` próprio (`noindex`) seguindo o padrão das telas internas.
- Chip "Conformidade" em `biblioteca.tsx` na mesma lista de abas, oculto quando `useEhAssistente()` é verdadeiro; as rotas também redirecionam assistentes para `/biblioteca`.
- Download em Word: montagem de um documento HTML com `mime type application/msword` e `Blob` no navegador — sem biblioteca nova e sem processamento no servidor.
- PDF: folha de estilo `@media print` na página do documento e `window.print()`, aproveitando o "Salvar como PDF" do sistema.
- Texto derivado das minutas já existentes em `docs/contrato-tratamento-dados-clinicas.md` e `docs/politica-privacidade-paciente.md` (a parte de retenção), mantidas no repositório como fonte para o advogado.
- Sem mudança de banco de dados.

## Verificação

- Checagem de tipos e formatação.
- Percurso em tela de celular (384 px) e desktop: chip Conformidade, as duas páginas, aviso de campos faltantes, download em Word e a visualização de impressão.
- Conferência de que o assistente não alcança as páginas.
