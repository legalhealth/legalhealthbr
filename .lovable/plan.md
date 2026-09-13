# Tela de Pacientes no Perfil do profissional

## Objetivo
Dentro da página **Perfil**, adicionar uma área "Meus pacientes" com a lista de pacientes, acesso às fichas individuais e às minutas vinculadas — reaproveitando tudo o que já existe na aba Pacientes da Biblioteca, sem duplicar código nem alterar banco de dados.

## O que já existe (reuso)
- Componente `ListaPacientes`: busca, botão "Novo paciente" e cards que abrem a ficha em `/paciente/$id`.
- Ficha `/paciente/$id`: dados cadastrais, histórico, triagem por voz e seção "Documentos vinculados" (minutas + anexos por paciente).
- Hooks prontos em `src/lib/pacientes.ts`: `usePacientes`, `usePaciente`, `useDocumentosDoPaciente` etc.

## Mudanças

1. **Perfil** (`src/routes/_authenticated/perfil.tsx`)
   - Nova seção/card "Meus pacientes" renderizando o componente `ListaPacientes` já existente (mesma busca, mesmo diálogo de cadastro, mesmo visual de cards).
   - Posição: após os dados profissionais e antes das configurações/assinatura, mantendo o estilo atual da página.

2. **Resumo rápido no card** (opcional, leve)
   - Cabeçalho do card mostra o total de pacientes cadastrados e um atalho "Ver ficha" em cada item (o card inteiro já é clicável para `/paciente/$id`).

3. **Minutas vinculadas**
   - Já aparecem na ficha do paciente (seção "Documentos vinculados"). Nenhuma alteração necessária — o acesso a partir do Perfil usa o mesmo caminho.

## Fora de escopo
- Nenhuma mudança de banco, RLS ou rotas novas.
- Nenhuma alteração na aba Pacientes da Biblioteca, header, hero ou estilo geral.

## Validação
- `bunx tsgo --noEmit`.
- Teste no navegador (sessão autenticada): abrir Perfil, cadastrar paciente, abrir ficha, confirmar minutas vinculadas listadas.
