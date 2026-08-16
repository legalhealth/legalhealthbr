import { streamAiEndpoint } from "@/lib/ia-chat";

export const TIPOS_PECA = [
  { value: "defesa-sindicancia", label: "Defesa em Sindicância no CRM" },
  { value: "defesa-pep", label: "Defesa em Processo Ético-Profissional" },
  {
    value: "contestacao-responsabilidade",
    label: "Contestação em Ação de Responsabilidade Médica",
  },
  { value: "peticao-honorarios", label: "Petição Inicial de Cobrança de Honorários" },
  { value: "impugnacao-glosa", label: "Impugnação de Glosa perante Operadora" },
  { value: "notificacao-extrajudicial", label: "Notificação Extrajudicial" },
  { value: "recurso-cfm", label: "Recurso ao CFM" },
] as const;

export type TipoPeca = (typeof TIPOS_PECA)[number]["value"];

export function tipoPecaLabel(value: string): string {
  return TIPOS_PECA.find((t) => t.value === value)?.label ?? "Peça jurídica";
}

export type PecaInput = {
  tipo: string;
  cliente: string;
  contraria: string;
  orgao: string;
  fatos: string;
  objetivo: string;
  provas: string;
  contexto?: string;
};

/** Redige a peça via rota protegida /api/ai-peca (chave de IA só no servidor). */
export function streamPeca(input: PecaInput, onDelta: (chunk: string) => void): Promise<string> {
  return streamAiEndpoint(
    "/api/ai-peca",
    { ...input, tipo: tipoPecaLabel(input.tipo) },
    onDelta,
  );
}