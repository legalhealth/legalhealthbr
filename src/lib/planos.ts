/**
 * Catálogo comercial dos planos da plataforma.
 * Os limites técnicos (consultas de IA por dia, máximo de pacientes etc.)
 * vivem na tabela `plan_limits`; aqui ficam os textos de venda exibidos
 * no Perfil (e, futuramente, na landing page).
 */

export type PlanoSlug = "free" | "essential" | "professional" | "enterprise";

export type PlanoComercial = {
  slug: PlanoSlug;
  nome: string;
  preco: string;
  periodo: string;
  descricao: string;
  destaque: boolean;
  recursos: string[];
  cta: "none" | "assinar" | "contato";
};

export const PLANOS: readonly PlanoComercial[] = [
  {
    slug: "free",
    nome: "Gratuito",
    preco: "R$ 0",
    periodo: "",
    descricao: "Para conhecer a plataforma no seu ritmo.",
    destaque: false,
    recursos: [
      "5 consultas de IA por dia",
      "Juriscore® 1x por mês",
      "Plano de Ação com suas prioridades",
      "Leitura do catálogo da Biblioteca",
      "1 paciente cadastrado",
      "Suporte por e-mail",
    ],
    cta: "none",
  },
  {
    slug: "essential",
    nome: "Essential",
    preco: "R$ 197",
    periodo: "/mês",
    descricao: "Médicos individuais e consultórios de menor porte.",
    destaque: false,
    recursos: [
      "40 consultas de IA por dia",
      "Juriscore® ilimitado, com histórico",
      "Minutas e peças com IA",
      "Pacientes ilimitados, com histórico completo",
      "Triagem por voz liberada",
      "Central de alertas e lembretes por e-mail",
      "Exportação e exclusão de dados do paciente",
      "Suporte por e-mail",
    ],
    cta: "assinar",
  },
  {
    slug: "professional",
    nome: "Professional",
    preco: "R$ 497",
    periodo: "/mês",
    descricao: "Clínicas integradas e equipes.",
    destaque: true,
    recursos: [
      "Tudo do Essential",
      "150 consultas de IA por dia",
      "Até 3 assistentes por convite",
      "Minutas oficiais da clínica",
      "Envio de triagens e minutas no WhatsApp",
      "2 revisões de advogado por mês",
      "Documentos de conformidade com dados da clínica",
      "Suporte prioritário no WhatsApp",
    ],
    cta: "assinar",
  },
  {
    slug: "enterprise",
    nome: "Enterprise",
    preco: "Sob consulta",
    periodo: "",
    descricao: "Redes hospitalares e operadoras de saúde.",
    destaque: false,
    recursos: [
      "Limites de IA sob medida",
      "Múltiplas clínicas e equipes sem teto",
      "Revisões jurídicas em volume contratado",
      "Painel administrativo e relatórios",
      "Contrato de dados dedicado",
      "Onboarding assistido e suporte dedicado",
    ],
    cta: "contato",
  },
] as const;

export const PLANO_PADRAO: PlanoSlug = "free";

export function planoComercial(slug: string | null | undefined): PlanoComercial {
  return PLANOS.find((p) => p.slug === slug) ?? PLANOS[0]!;
}
