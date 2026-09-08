# Novos modelos na Biblioteca Inteligente (aba Minutas)

## Resumo

Ampliar a lista de chips da aba **Minutas** em `/biblioteca`, saindo de 5 para 24 modelos, agrupados visualmente em 4 blocos com subtítulos discretos. Nenhum item atual é removido, o componente de chip permanece idêntico, e todos os novos itens passam a usar exatamente a mesma lógica de campos dinâmicos e geração por IA que já existe.

## Grupos e itens

````text
Documentos essenciais            (os 5 atuais, sem alteração de rótulo)
  Termo de Consentimento (TCLE) *
  Contrato de Prestação de Serviços Médicos
  Aviso de Privacidade LGPD para Pacientes
  Termo de Consentimento para Teleconsulta
  Autorização de Uso de Imagem (padrão CFM) *

Consentimentos por especialidade
  Consentimento para Procedimentos Estéticos *
  Consentimento Cirúrgico *
  Consentimento para Sedação/Anestesia *
  Consentimento para Exames Invasivos *
  Consentimento para Tratamento Odontológico *
  Consentimento para Fisioterapia *
  Consentimento para Vacinação

Contratos e institucional
  Contrato de Parceria entre Clínicas/Profissionais
  Contrato de Locação de Consultório
  Termo de Responsabilidade por Não Comparecimento (No-show)
  Termo de Quitação e Alta Médica
  Contrato para Plataformas de Telemedicina
  Termo de Sigilo (NDA) para Equipe

LGPD e dados
  Consentimento para Uso de Imagem em Marketing/Redes Sociais
  Aviso de Privacidade para Prontuário Eletrônico
  Termo de Compartilhamento de Dados com Convênios
  Termo de Anuência para Pesquisa Científica
````

`*` = modelo que exibe o campo extra **Procedimento** no formulário, como já acontece hoje com TCLE e Autorização de Uso de Imagem.

## Como será feito

### 1. Catálogo (`src/lib/biblioteca-catalogo.ts`)

- Adicionar o campo opcional `grupo?: string` ao tipo `BibliotecaDoc`.
- Preencher `grupo` nos itens já existentes com `"Documentos essenciais"`, mantendo os rótulos atuais byte a byte.
- Acrescentar os 19 novos itens à categoria `minutas`, na ordem dos grupos acima, cada um com identificador `value` em kebab-case (ex.: `consentimento-estetica`, `consentimento-cirurgico`, `consentimento-sedacao`, `consentimento-exames-invasivos`, `consentimento-odontologico`, `consentimento-fisioterapia`, `consentimento-vacinacao`, `contrato-parceria`, `contrato-locacao-consultorio`, `termo-no-show`, `termo-quitacao-alta`, `contrato-telemedicina`, `termo-sigilo-equipe`, `uso-imagem-marketing`, `aviso-privacidade-prontuario`, `compartilhamento-dados-convenios`, `anuencia-pesquisa-cientifica`).
- Marcar com `procedimento: true` os seis modelos clínicos definidos: Procedimentos Estéticos, Cirúrgico, Sedação/Anestesia, Exames Invasivos, Tratamento Odontológico e Fisioterapia.
- Manter `docsDaCategoria()` retornando a lista plana (sem `grupo`), para que as ferramentas de integração existentes continuem funcionando sem alteração.
- Criar `gruposDaCategoria(categoria)` devolvendo `[{ label, docs }]` na ordem de declaração, derivado dos próprios itens — assim Protocolos e Checklists (sem `grupo`) continuam funcionando como uma única lista.

### 2. Tela (`src/routes/_authenticated/biblioteca.tsx`)

- Trocar o mapa plano de chips por um mapa de grupos, renderizando acima de cada bloco um subtítulo discreto (texto pequeno, `text-muted-foreground`, espaçamento moderado) e abaixo os chips.
- Manter o `Button` de chip com as mesmas classes e a mesma lógica ativo/inativo (`border-gold/50 bg-gold/10 text-gold` quando ativo), sem mudar tamanho, arredondamento ou cores.
- Selecionar um chip continua chamando `setDocumento`, então `docAtual`, o campo condicional **Procedimento** e `handleGenerate()` seguem funcionando sem nenhuma alteração de fluxo.
- Header, hero, descrição da página, painel de campos, botão dourado, pré-visualização, aviso de IA e histórico permanecem intactos.

### 3. Geração por IA

Nenhuma mudança necessária: a rota `/api/ai-biblioteca` já recebe o rótulo do documento escolhido e injeta os campos informados no prompt, então cada novo modelo é gerado com o mesmo comportamento dos atuais (streaming, salvamento no histórico, cópia e envio ao advogado).

## Verificação

- Typecheck (`bunx tsgo --noEmit`) e ESLint nos arquivos alterados.
- Conferir na pré-visualização: 4 subtítulos visíveis, 24 chips no total, chips atuais inalterados, seleção de um item com `procedimento` exibe o campo extra, e a geração de um novo modelo produz texto e entra no histórico.
- Confirmar que as ferramentas de integração que listam modelos (as duas de Biblioteca) continuam retornando a lista completa com os novos itens.

## Fora do escopo

- Novos campos, novos formulários ou mudanças nos prompts de sistema.
- Ajustes visuais em Protocolos e Checklists.
- Banco de dados: nenhuma tabela nova é necessária (os documentos continuam indo para `generated_docs`).
