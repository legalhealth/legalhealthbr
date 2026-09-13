# # Minutas oficiais, minutas da clínica e aba Clínica na Biblioteca

&nbsp;

## 1. Tela Modelos com minutas oficiais da área médica

&nbsp;

Cadastrar um conjunto de minutas oficiais (escopo oficial, publicadas) já visíveis para todos os profissionais, organizadas em grupos:

&nbsp;

- Documentos essenciais: TCLE, contrato de prestação de serviços, aviso de privacidade LGPD, termo de teleconsulta, autorização de uso de imagem.

- Consentimentos por especialidade: estética, cirúrgico, sedação/anestesia, exames invasivos, odontológico, fisioterapia.

- Contratos e institucional: contrato de plantão, contrato com clínica parceira, regimento interno, política de cancelamento e no-show.

- LGPD e dados: registro de tratamento de dados, termo de sigilo de equipe, resposta a titular de dados, plano de resposta a incidente.

- Relacionamento e defesa: relatório de atendimento, resposta a reclamação de paciente, comunicado de alta/encerramento.

&nbsp;

Esses modelos aparecem na tela Modelos (lista oficial) e nos chips da aba Minutas da Biblioteca, misturados aos grupos existentes sem duplicar os que já existem — quando o slug já existe no catálogo do código, ele não é recriado.

&nbsp;

## 2. Categoria "Minutas da clínica"

&nbsp;

Nova categoria de minutas própria da clínica:

&nbsp;

- Só o responsável da conta cria, edita, publica e exclui.

- O assistente vinculado vê e usa as minutas da clínica, sem poder alterar.

- Vem com um conjunto pré-definido de modelos criados junto com a clínica (ex.: TCLE da clínica, política de cancelamento, termo de sigilo da equipe, ficha de anamnese, comunicado de pós-procedimento), que o responsável ajusta depois.

&nbsp;

## 3. Aba Clínica na Biblioteca (substitui a rota separada do assistente)

&nbsp;

Retirar a área separada `_authenticated/clinica/*` definida anteriormente para o acesso do assistente — ele passa a navegar pela própria Biblioteca, sem rota dedicada.

&nbsp;

- Nova aba "Clínica" nos chips da Biblioteca reunindo: minutas da clínica e oficiais, lista de pacientes com acesso à ficha, triagem (voz e formulário) a partir da ficha, e cabeçalho da clínica disponível nos documentos gerados — o mesmo conteúdo que estava planejado para a rota separada, agora dentro da Biblioteca.

- Em sessão de assistente, os chips da Biblioteca mostram apenas "Clínica" — os chips "Minutas", "Protocolos", "Checklists" e "Pacientes" continuam visíveis só para o médico dono (a aba Clínica já cobre pacientes e minutas para o assistente).

- As restrições já definidas para o assistente continuam valendo mesmo dentro da Biblioteca: sem ver assinatura/plano nem outras áreas da conta do médico. A navegação inferior (bottom nav) em sessão de assistente mostra só o necessário (Biblioteca), ocultando Início, IA, Juriscore e Plano; o Perfil do assistente fica limitado aos próprios dados, sem acesso ao Perfil do médico.

&nbsp;

## Fora de escopo

&nbsp;

- Preenchimento de "Minha clínica" (dados reais da clínica) e disparo do convite ao assistente — é uma ação manual com dados verdadeiros, feita separadamente, fora deste prompt.

&nbsp;

## Detalhes técnicos

&nbsp;

- Seed dos modelos oficiais em `library_templates` (escopo `oficial`, `status = 'publicado'`, `grupo` preenchido) e das categorias em `library_categories`, via inserts idempotentes por slug.

- Novo escopo `clinica` em `library_templates`/`library_categories` com coluna `clinic_owner_id`: RLS de leitura por `public.pode_acessar_conta(clinic_owner_id)` e escrita restrita a `auth.uid() = clinic_owner_id`; GRANTs para `authenticated` e `service_role`.

- Seed dos modelos pré-definidos da clínica no primeiro salvamento de `clinics` (função server-side idempotente), não em render de página.

- `modelosDaCategoria`/`useModelos` passam a incluir o escopo da clínica; `biblioteca-catalogo.ts` ganha a categoria `clinica` no chip list e `validateSearch` aceita `cat=clinica`.

- `biblioteca.modelos.tsx` ganha seletor de escopo (oficial só para admin, clínica só para o responsável, próprio para todos).

- Remover a rota `_authenticated/clinica/*` e qualquer código já feito nela; mover a lógica de acesso (RLS via `pode_ver_paciente`/`pode_acessar_conta`) para ser usada diretamente dentro de `_authenticated/biblioteca.tsx`, com os chips visíveis dependendo do papel da sessão (médico dono ou assistente).

- Layout/shell: bottom nav e Perfil passam a checar o papel da sessão para ocultar Início, IA, Juriscore, Plano e o Perfil do médico quando quem está logado é um assistente.

- Aba Clínica reaproveita `ListaPacientes`, `TriagemVoz`, `TriagemFormulario` e o fluxo atual de geração de minuta.

- Validação: `bunx tsgo --noEmit`, ESLint e Playwright autenticado (chips em 384px e 1280px; sessão de assistente vendo só o chip Clínica e a bottom nav restrita; sessão de médico sem mudanças).

&nbsp;