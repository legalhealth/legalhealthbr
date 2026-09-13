# # Tela da Clínica

Uma página própria para os dados da clínica (nome, endereço e horários de atendimento) reunida com os convites da equipe, que hoje ficam no Perfil.

## O que o usuário verá

Nova página **Clínica**, acessível pelo Perfil e pelo menu, com três blocos:

1. **Identidade da clínica** — nome, CNPJ (opcional), telefone/WhatsApp, e-mail de contato e responsável técnico.

2. **Endereço** — CEP, rua, número, complemento, bairro, cidade e estado.

3. **Horário de atendimento** — uma linha por dia da semana (segunda a domingo), cada uma com "aberto/fechado" e horários de abertura e fechamento; botão para copiar o horário de segunda para os demais dias úteis.

Abaixo, o bloco **Equipe** já existente: convite por e-mail (válido por 7 dias), lista de convites pendentes com opção de cancelar e lista de assistentes com pausar, reativar ou remover. Quem aceita o convite passa a ver as fichas e minutas dos pacientes daquela clínica, sem entrar na conta do médico.

- Convite não aceito em 7 dias muda sozinho para status "expirado", sai da lista de pendentes e aparece na lista de convites com um botão "reenviar" (gera novo token e novo prazo).

- Pausar, reativar ou remover um assistente fica registrado (quem fez, quando, qual ação) — essas são ações sobre quem tem acesso a dados de paciente, e hoje não ficam em nenhum registro.

Os assistentes vinculados conseguem ver os dados da clínica, mas só o médico dono pode editá-los.

Os dados da clínica podem preencher automaticamente o cabeçalho das minutas geradas na Biblioteca (nome da clínica, endereço e contato), mas isso é uma opção que o profissional liga/desliga a cada geração de documento (padrão: ligado, quando os dados existirem) — não um comportamento fixo.

## Detalhes técnicos

**Banco (migração nova)**

- Tabela `public.clinics`: `user_id` (dono, único), `nome`, `cnpj`, `telefone`, `email`, `responsavel_tecnico`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `horarios jsonb` (array de 7 itens `{dia, aberto, abre, fecha}`), `created_at`, `updated_at` com trigger `update_updated_at_column`.

- `clinic_invites` ganha `status` `pendente|expirado|aceito|cancelado`) atualizado por rotina/trigger ao passar dos 7 dias, em vez de só checar a data na leitura.

- Ações sobre a equipe (pausar/reativar/remover assistente, cancelar/reenviar convite) passam pela mesma tabela de auditoria usada para pacientes (autor separado do dono), com `patient_id` agora opcional e `entidade` aceitando também `membro_equipeconvite`.

- GRANTs para `authenticated` e `service_role`; RLS ligada.

- Políticas: leitura e escrita reaproveitam a mesma função de associação já usada para dados de paciente (dono OU assistente ativo) — não criar uma segunda função equivalente só para `clinics`; se a função de paciente `pode_ver_paciente`) e a de conta `pode_acessar_conta`) já existirem separadas, unificar numa só e fazer a outra chamá-la, para uma regra de status não divergir entre as duas. Inserir/editar/excluir os dados da clínica continuam restritos a `auth.uid() = user_id` (só o dono).

**Frontend**

- `src/lib/clinica.ts`: hooks `useClinica()` (lê pela conta ativa, via `contaAtivaId()`) e `useSalvarClinica()` (upsert por `user_id`).

- `src/lib/clinica-horarios.ts`: constantes dos dias, valor padrão dos horários e `resumoHorarios()` para texto legível.

- `src/components/clinica/dados-clinica.tsx`: formulário dos três blocos, campos desabilitados para assistentes, salvar com feedback via `sonner`.

- `src/routes/_authenticated/clinica.tsx`: `PageShell` com `head()` próprio, renderizando `DadosClinica` + `EquipeClinica`.

- `src/routes/_authenticated/perfil.tsx`: substitui o bloco `EquipeClinica` por um card "Minha clínica" com resumo (nome, cidade, nº de assistentes) e link para `/clinica`.

- `src/routes/_authenticated/biblioteca.tsx`: adiciona um controle (ex.: switch) para incluir ou não os dados da clínica no cabeçalho do documento gerado, usando os dados salvos como valor padrão quando existirem.

## Fora de escopo

- Múltiplas unidades/clínicas por profissional.

- Agenda ou marcação de consultas a partir dos horários.

- Mudança no fluxo de aceite do convite `/convite/$token`), que já funciona.

&nbsp;