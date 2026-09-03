/**
 * Configuração pública do programa de Embaixadores.
 * Cada benefício declara explicitamente sua situação para evitar promessa não sustentada.
 * Ajuste `situacao` conforme o regulamento vigente — nada aqui deve ser exibido como
 * funcionalidade pronta se ainda não existir no produto.
 */

export type SituacaoBeneficio = "disponivel" | "piloto" | "em-breve" | "regulamento";

export const SITUACAO_LABEL: Record<SituacaoBeneficio, string> = {
  disponivel: "Disponível agora",
  piloto: "Disponível no programa piloto",
  "em-breve": "Em breve",
  regulamento: "Sujeito ao regulamento",
};

export type Beneficio = { texto: string; situacao: SituacaoBeneficio };

export type FasePrograma = {
  mes: string;
  titulo: string;
  mensagem: string;
  beneficios: Beneficio[];
};

export const FASES: FasePrograma[] = [
  {
    mes: "Mês 1",
    titulo: "Conhecer e organizar",
    mensagem:
      "Comece entendendo seus próprios pontos de atenção antes de apresentar a plataforma a outras pessoas.",
    beneficios: [
      { texto: "Acesso de experiência à plataforma e ao Juriscore®", situacao: "piloto" },
      { texto: "Diagnóstico preventivo da própria prática", situacao: "disponivel" },
      { texto: "Visão dos cinco pilares de atenção", situacao: "disponivel" },
      { texto: "Onboarding orientado", situacao: "disponivel" },
      { texto: "Materiais de apresentação do programa", situacao: "em-breve" },
      { texto: "Canal de suporte para dúvidas sobre a plataforma", situacao: "piloto" },
      { texto: "Sessão coletiva de apresentação", situacao: "regulamento" },
    ],
  },
  {
    mes: "Mês 2",
    titulo: "Usar e compartilhar",
    mensagem:
      "Compartilhe uma ferramenta que você conheceu na prática, sem precisar fazer promessas que a plataforma não sustenta.",
    beneficios: [
      { texto: "Uso dos recursos liberados no plano de embaixador", situacao: "regulamento" },
      { texto: "Biblioteca de modelos, protocolos e checklists", situacao: "disponivel" },
      { texto: "Conteúdos educativos sobre prevenção jurídica na saúde", situacao: "em-breve" },
      { texto: "Materiais prontos para compartilhar com a sua rede", situacao: "em-breve" },
      { texto: "Canal para enviar sugestões de melhoria", situacao: "piloto" },
      { texto: "Participação em pesquisa de feedback com a equipe", situacao: "piloto" },
    ],
  },
  {
    mes: "Mês 3",
    titulo: "Participar e evoluir",
    mensagem:
      "Ao final de três meses, você terá uma visão mais organizada da sua experiência e poderá decidir se deseja continuar próximo da Legal Health.",
    beneficios: [
      { texto: "Reavaliação do Juriscore® e revisão de prioridades", situacao: "disponivel" },
      { texto: "Relatório de aprendizados da experiência", situacao: "em-breve" },
      { texto: "Encontro de feedback do grupo de embaixadores", situacao: "regulamento" },
      { texto: "Reconhecimento como participante da fase inicial", situacao: "regulamento" },
      { texto: "Condição de continuidade após o período experimental", situacao: "regulamento" },
    ],
  },
];

export const PROFISSOES = [
  "Medicina",
  "Odontologia",
  "Psicologia",
  "Enfermagem",
  "Fisioterapia",
  "Nutrição",
  "Gestão de clínica ou serviço de saúde",
  "Outra profissão da saúde",
] as const;

export const TIPOS_ATUACAO = [
  "Consultório próprio",
  "Clínica ou centro médico",
  "Hospital",
  "Atendimento remoto / telessaúde",
  "Gestão ou administração",
  "Ensino ou produção de conteúdo",
] as const;

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const FAQ = [
  {
    pergunta: "O programa de Embaixadores tem remuneração ou comissão?",
    resposta:
      "Não divulgamos remuneração, comissão ou desconto como definitivos. Qualquer condição comercial só existirá se aprovada e documentada no regulamento do programa.",
  },
  {
    pergunta: "A Legal Health substitui um advogado?",
    resposta:
      "Não. A plataforma organiza pontos de atenção, prioridades e documentos de apoio. Decisões jurídicas e representação continuam sendo do advogado.",
  },
  {
    pergunta: "Preciso ser médico para participar?",
    resposta:
      "Não. Profissionais da saúde de diferentes categorias podem se candidatar. Regras específicas de medicina, como as resoluções do CFM, aplicam-se ao contexto médico; cada profissão tem normas próprias.",
  },
  {
    pergunta: "Quanto tempo dura a experiência?",
    resposta:
      "Três meses, organizados em conhecer, usar e participar. Vagas, recursos liberados e critérios seguem o regulamento vigente do piloto.",
  },
  {
    pergunta: "Vou receber certificado?",
    resposta:
      "Só ofereceremos reconhecimento ou certificado se existirem regras definidas para isso. Nada será apresentado como certificação oficial sem comprovação.",
  },
  {
    pergunta: "Que dados vocês pedem na candidatura?",
    resposta:
      "Apenas contato, área de atuação e o motivo do interesse. Não pedimos CRM, OAB, dados de pacientes ou documentos sensíveis nesta etapa.",
  },
  {
    pergunta: "A candidatura garante aprovação?",
    resposta:
      "Não. As informações são analisadas conforme os critérios e a disponibilidade do programa, sem prazo garantido de resposta.",
  },
];

/** Responsabilidades do embaixador, exibidas antes do formulário. */
export const RESPONSABILIDADES = [
  "Usar a plataforma de forma realista e responsável",
  "Enviar feedback estruturado sobre clareza e utilidade",
  "Relatar dificuldades e oportunidades encontradas",
  "Compartilhar somente materiais autorizados pela equipe",
  "Não prometer resultados jurídicos a colegas ou pacientes",
  "Não oferecer aconselhamento em nome da Legal Health",
  "Não inserir dados identificáveis de pacientes na plataforma",
  "Respeitar as normas profissionais e de publicidade da própria categoria",
];

/** Tabela de benefícios: nada aqui deve ser exibido sem situação explícita. */
export const TABELA_BENEFICIOS: {
  beneficio: string;
  situacao: SituacaoBeneficio;
  observacao: string;
}[] = [
  {
    beneficio: "Acesso de experiência à plataforma",
    situacao: "piloto",
    observacao: "Conforme critérios de seleção",
  },
  {
    beneficio: "Uso do Juriscore®",
    situacao: "disponivel",
    observacao: "Diagnóstico preventivo em 15 perguntas",
  },
  {
    beneficio: "Onboarding orientado",
    situacao: "disponivel",
    observacao: "Conforme agenda da equipe",
  },
  {
    beneficio: "Canal de feedback",
    situacao: "piloto",
    observacao: "Sugestões e pesquisas com a equipe",
  },
  {
    beneficio: "Conteúdos exclusivos",
    situacao: "em-breve",
    observacao: "Serão anunciados somente quando existirem",
  },
  {
    beneficio: "Comissão ou remuneração",
    situacao: "regulamento",
    observacao:
      "Esta condição ainda está em definição e será informada no regulamento antes da participação",
  },
  {
    beneficio: "Continuidade após os três meses",
    situacao: "regulamento",
    observacao: "Decisão posterior, sem promessa de renovação",
  },
];

/** Limites explícitos da plataforma, apresentados antes da candidatura. */
export const LIMITES = [
  "A Legal Health é uma ferramenta de apoio preventivo, não um serviço jurídico.",
  "O Juriscore® não prevê processos nem garante proteção jurídica.",
  "O assistente de IA não substitui a análise de um advogado.",
  "Dados de saúde exigem tratamento responsável e não devem ser inseridos sem necessidade.",
  "As fontes jurídicas citadas são identificadas e podem ser verificadas nos sites oficiais.",
  "O candidato não deve enviar dados de pacientes em nenhuma etapa.",
];

export const FAQ_EXTRA = [
  {
    pergunta: "Preciso indicar outras pessoas para participar?",
    resposta:
      "Não. Indicação não é requisito nem meta do programa. O foco é usar a plataforma e enviar feedback estruturado.",
  },
  {
    pergunta: "Posso divulgar nas minhas redes sociais?",
    resposta:
      "Sim, desde que use apenas materiais autorizados, sem prometer resultados jurídicos e respeitando as regras de publicidade da sua categoria profissional.",
  },
  {
    pergunta: "Posso enviar dados de pacientes?",
    resposta:
      "Não. Nunca insira nome, prontuário, exame, número de processo ou qualquer dado identificável de paciente na candidatura ou na plataforma.",
  },
  {
    pergunta: "O que acontece depois dos três meses?",
    resposta:
      "A continuidade depende do regulamento vigente e da avaliação do piloto. Não há promessa automática de renovação, benefício ou remuneração.",
  },
  {
    pergunta: "Como meus dados serão tratados?",
    resposta:
      "Os dados da candidatura são usados apenas para avaliar sua participação no programa, com acesso restrito à equipe. Consulte os Termos de Uso e a Política de Privacidade, incluindo retenção e canal de privacidade.",
  },
];
