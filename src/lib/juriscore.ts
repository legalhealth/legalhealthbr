export type AnswerValue = 0 | 1 | 2;

export const ANSWER_OPTIONS: { value: AnswerValue; label: string }[] = [
  { value: 2, label: "Sim, implementado" },
  { value: 1, label: "Parcialmente" },
  { value: 0, label: "Não / Não sei" },
];

export type Pillar = {
  id: string;
  name: string;
  short: string;
  subtitle: string;
  questions: { key: string; text: string }[];
};

export const PILLARS: Pillar[] = [
  {
    id: "documental",
    name: "Documental",
    short: "Documental",
    subtitle: "Prontuários, termos de consentimento e contratos",
    questions: [
      {
        key: "doc_1",
        text: "Todos os procedimentos de risco são precedidos de Termo de Consentimento (TCLE) específico, com riscos e alternativas descritos?",
      },
      {
        key: "doc_2",
        text: "Os prontuários são preenchidos de forma completa e contemporânea ao atendimento, incluindo recusas e faltas do paciente?",
      },
      {
        key: "doc_3",
        text: "As relações com pacientes particulares, parceiros e prestadores estão formalizadas por contratos escritos e revisados?",
      },
    ],
  },
  {
    id: "regulatorio",
    name: "Regulatório",
    short: "Regulatório",
    subtitle: "CFM, ANS, ANVISA e LGPD",
    questions: [
      {
        key: "reg_1",
        text: "A publicidade e as redes sociais seguem a Resolução do CFM (sem promessa de resultado; antes/depois só com autorização e nos limites)?",
      },
      {
        key: "reg_2",
        text: "Há adequação à LGPD: política de privacidade, controle de acesso a dados de pacientes e fluxo para pedidos de titulares?",
      },
      {
        key: "reg_3",
        text: "Licenças, alvarás e exigências de vigilância sanitária do consultório/clínica estão em dia?",
      },
    ],
  },
  {
    id: "operacional",
    name: "Operacional",
    short: "Operacional",
    subtitle: "Rotinas, equipe e protocolos internos",
    questions: [
      {
        key: "ope_1",
        text: "Existem protocolos escritos para intercorrências, eventos adversos e comunicação com o paciente?",
      },
      {
        key: "ope_2",
        text: "A equipe recebe treinamento periódico sobre sigilo, atendimento e obrigações legais?",
      },
      {
        key: "ope_3",
        text: "Reclamações de pacientes são registradas e tratadas com fluxo definido antes de escalarem?",
      },
    ],
  },
  {
    id: "historico",
    name: "Histórico",
    short: "Histórico",
    subtitle: "Passivo e aprendizados de casos anteriores",
    questions: [
      {
        key: "his_1",
        text: "Você está livre de processos judiciais ou sindicâncias éticas em andamento?",
      },
      {
        key: "his_2",
        text: "Notificações extrajudiciais e reclamações formais dos últimos anos foram tratadas e encerradas?",
      },
      {
        key: "his_3",
        text: "Aprendizados de eventos passados foram incorporados a protocolos e documentos?",
      },
    ],
  },
  {
    id: "contextual",
    name: "Contextual",
    short: "Contextual",
    subtitle: "Especialidade, exposição e proteção contratada",
    questions: [
      {
        key: "con_1",
        text: "Possui seguro de responsabilidade civil profissional vigente e adequado à sua atuação?",
      },
      {
        key: "con_2",
        text: "Se atua em área de alta judicialização (estética, cirurgia, obstetrícia), possui mitigações reforçadas (consentimentos ampliados, registro fotográfico, dupla checagem)?",
      },
      {
        key: "con_3",
        text: "A comunicação com pacientes ocorre por canais definidos, com registro adequado (WhatsApp institucional, prontuário)?",
      },
    ],
  },
];

export const TOTAL_QUESTIONS = PILLARS.reduce((sum, p) => sum + p.questions.length, 0);
export const MAX_POINTS = TOTAL_QUESTIONS * 2;

export type Level = {
  id: string;
  name: string;
  phrase: string;
  color: string;
  className: string;
};

export const LEVELS: (Level & { min: number; max: number })[] = [
  {
    id: "critico",
    name: "Crítico",
    phrase: "Exposição severa. Priorize as ações do Plano de Ação imediatamente.",
    color: "var(--color-danger)",
    className: "text-danger",
    min: 0,
    max: 25,
  },
  {
    id: "exposto",
    name: "Exposto",
    phrase: "Exposição relevante a riscos jurídicos. Ação estruturada recomendada.",
    color: "var(--color-warn)",
    className: "text-warn",
    min: 26,
    max: 50,
  },
  {
    id: "evolucao",
    name: "Em Evolução",
    phrase: "Boa base preventiva, com lacunas específicas a corrigir.",
    color: "var(--color-success-light)",
    className: "text-success-light",
    min: 51,
    max: 75,
  },
  {
    id: "protegido",
    name: "Protegido",
    phrase: "Alta blindagem jurídica. Foco em manutenção e monitoramento contínuo.",
    color: "var(--color-success)",
    className: "text-success",
    min: 76,
    max: 100,
  },
];

export function getLevel(score: number): Level {
  return LEVELS.find((level) => score >= level.min && score <= level.max) ?? LEVELS[0]!;
}

export type Answers = Record<string, AnswerValue>;

export type PillarScore = {
  id: string;
  name: string;
  points: number;
  max: number;
  percent: number;
};

export function computePillarScores(answers: Answers): PillarScore[] {
  return PILLARS.map((pillar) => {
    const max = pillar.questions.length * 2;
    const points = pillar.questions.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0);
    return {
      id: pillar.id,
      name: pillar.name,
      points,
      max,
      percent: Math.round((points / max) * 100),
    };
  });
}

export function computeScore(answers: Answers): number {
  const total = Object.values(answers).reduce<number>((sum, value) => sum + value, 0);
  return Math.round((total / MAX_POINTS) * 100);
}

export function pillarColor(percent: number): string {
  if (percent >= 67) return "var(--color-success)";
  if (percent >= 34) return "var(--color-warn)";
  return "var(--color-danger)";
}

export function pillarTextClass(percent: number): string {
  if (percent >= 67) return "text-success";
  if (percent >= 34) return "text-warn";
  return "text-danger";
}