# Tela de Pacientes no Perfil do profissional

## Objetivo

Dentro da página **Perfil**, adicionar uma área "Meus pacientes" com a lista de pacientes, acesso às fichas individuais e às minutas vinculadas — reaproveitando tudo o que já existe na aba Pacientes da Biblioteca, sem duplicar código nem alterar banco de dados.

## O que já existe (reuso)

- Componente `ListaPacientes`: busca, botão "Novo paciente" e cards que abrem a ficha em `/paciente/$id`.

- Ficha `/paciente/$id`: dados cadastrais, histórico, triagem por voz e seção "Documentos vinculados" (minutas + anexos por paciente).

- Hooks prontos em `src/lib/pacientes.ts`: `usePacientes`, `usePaciente`, `useDocumentosDoPaciente` etc.

## Mudanças

1. **Perfil** `src/routes/_authenticated/perfil.tsx`)

   - Nova seção/card "Meus pacientes" mostrando os pacientes mais recentes (ex.: os 5 últimos com atendimento ou cadastro), reaproveitando os mesmos hooks e o mesmo card de `ListaPacientes` — sem embutir a busca completa aqui, para não duplicar essa UI em duas telas.

   - Link "Ver todos na Biblioteca" no cabeçalho do card, levando à aba Pacientes já existente (onde a busca completa continua vivendo).

   - Posição: após os dados profissionais e antes das configurações/assinatura, mantendo o estilo atual da página.

2. **Resumo rápido no card** (opcional, leve)

   - Cabeçalho do card mostra o total de pacientes cadastrados.

   - Cada item do card já é clicável para `/paciente/$id`.

3. **Minutas vinculadas**

   - Já aparecem na ficha do paciente (seção "Documentos vinculados"). Nenhuma alteração necessária — o acesso a partir do Perfil usa o mesmo caminho.

4. **Navegação**

   - O botão de voltar em `/paciente/$id` retorna para a página de origem (Perfil ou Biblioteca), não fixo para a Biblioteca — usar o histórico do router em vez de um link hardcoded.

## Fora de escopo

- Nenhuma mudança de banco, RLS ou rotas novas.

- Nenhuma alteração na aba Pacientes da Biblioteca, header, hero ou estilo geral.

- Sem estado de busca duplicado entre Perfil e Biblioteca — ambos consomem o mesmo cache do React Query via `usePacientes`.

## Validação

- `bunx tsgo --noEmit`.

- Teste no navegador (sessão autenticada): abrir Perfil, ver os pacientes recentes, cadastrar paciente, abrir ficha, confirmar minutas vinculadas listadas.

- Testar navegação: abrir uma ficha a partir do Perfil e voltar (deve retornar ao Perfil); abrir a mesma ficha a partir da Biblioteca e voltar (deve retornar à Biblioteca).

&nbsp;