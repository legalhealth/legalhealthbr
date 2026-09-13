# Minutas oficiais, minutas da clínica e aba Clínica na Biblioteca

## 1. Tela Modelos com minutas oficiais da área médica

Cadastrar um conjunto de minutas oficiais (escopo oficial, publicadas) já visíveis para todos os profissionais, organizadas em grupos:

- Documentos essenciais: TCLE, contrato de prestação de serviços, aviso de privacidade LGPD, termo de teleconsulta, autorização de uso de imagem.
- Consentimentos por especialidade: estética, cirúrgico, sedação/anestesia, exames invasivos, odontológico, fisioterapia.
- Contratos e institucional: contrato de plantão, contrato com clínica parceira, regimento interno, política de cancelamento e no-show.
- LGPD e dados: registro de tratamento de dados, termo de sigilo de equipe, resposta a titular de dados, plano de resposta a incidente.
- Relacionamento e defesa: relatório de atendimento, resposta a reclamação de paciente, comunicado de alta/encerramento.

Esses modelos aparecem na tela Modelos (lista oficial) e nos chips da aba Minutas da Biblioteca, misturados aos grupos existentes sem duplicar os que já existem — quando o slug já existe no catálogo do código, ele não é recriado.

## 2. Categoria "Minutas da clínica"

Nova categoria de minutas própria da clínica:

- Só o responsável da conta cria, edita, publica e exclui.
- O assistente vinculado vê e usa as minutas da clínica, sem poder alterar.
- Vem com um conjunto pré-definido de modelos criados junto com a clínica (ex.: TCLE da clínica, política de cancelamento, termo de sigilo da equipe, ficha de anamnese, comunicado de pós-procedimento), que o responsável ajusta depois.

## 3. Minha clínica preenchida e convite ao assistente

Não consigo concluir esta parte: você não informou os dados. Preciso de nome, CNPJ, endereço completo, telefone, e-mail, responsável técnico e horários — e o nome e e-mail do assistente para o convite. A tela já existe e funciona; ao me passar os dados eu preencho e disparo o convite (link válido por 7 dias).

## 4. Aba Clínica na Biblioteca

Nova aba "Clínica" na lista de chips da Biblioteca, pensada para o assistente:

- Minutas da clínica e minutas oficiais em um só lugar.
- Lista de pacientes com acesso à ficha.
- Triagem (voz e formulário) a partir da ficha do paciente.
- Cabeçalho da clínica disponível nos documentos gerados.
- Sem passar pelo Perfil, e sem expor dados de assinatura ou configurações da conta do responsável.

## Detalhes técnicos

- Seed dos modelos oficiais em `library_templates` (escopo `oficial`, `status = 'publicado'`, `grupo` preenchido) e das categorias em `library_categories`, via inserts idempotentes por slug.
- Novo escopo `clinica` em `library_templates`/`library_categories` com coluna `clinic_owner_id`: RLS de leitura por `public.pode_acessar_conta(clinic_owner_id)` e escrita restrita a `auth.uid() = clinic_owner_id`; GRANTs para `authenticated` e `service_role`.
- Seed dos modelos pré-definidos da clínica no primeiro salvamento de `clinics` (função server-side idempotente), não em render de página.
- `modelosDaCategoria`/`useModelos` passam a incluir o escopo da clínica; `biblioteca-catalogo.ts` ganha a categoria `clinica` no chip list e `validateSearch` aceita `cat=clinica`.
- `biblioteca.modelos.tsx` ganha seletor de escopo (oficial só para admin, clínica só para o responsável, próprio para todos).
- Aba Clínica reaproveita `ListaPacientes`, `TriagemVoz`, `TriagemFormulario` e o fluxo atual de geração de minuta.
- Validação: `bunx tsgo --noEmit`, ESLint e Playwright autenticado (chips em 384px e 1280px, aba Clínica com sessão de assistente).
