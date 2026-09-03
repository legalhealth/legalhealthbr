/**
 * Configuração pública do programa de Embaixadores.
 * Cada benefício declara explicitamente sua situação para evitar promessa não sustentada.
 * Ajuste `situacao` conforme o regulamento vigente — nada aqui deve ser exibido como
 * funcionalidade pronta se ainda não existir no produto.
 */

export type SituacaoBeneficio =
  | "disponivel"
  | "piloto"
  | "em-breve"
  | "regulamento";

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
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
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
