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

/** Valor usado quando a IA deve decidir o tipo de peça a partir do documento. */
export const TIPO_AUTO = "auto";

export function tipoPecaLabel(value: string): string {
  if (!value || value === TIPO_AUTO) return "Peça definida pela IA";
  return TIPOS_PECA.find((t) => t.value === value)?.label ?? "Peça jurídica";
}

/** Sugere o tipo de peça a partir do tipo de documento identificado pela IA. */
export function sugerirTipoPeca(tipoDocumento: string): TipoPeca | null {
  const t = tipoDocumento
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (t.includes("sindicancia")) return "defesa-sindicancia";
  if (t.includes("etico") || t.includes("pep")) return "defesa-pep";
  if (t.includes("glosa") || t.includes("operadora")) return "impugnacao-glosa";
  if (t.includes("honorario")) return "peticao-honorarios";
  if (t.includes("recurso") || t.includes("cfm")) return "recurso-cfm";
  if (t.includes("notificacao")) return "notificacao-extrajudicial";
  if (
    t.includes("citacao") ||
    t.includes("acao") ||
    t.includes("processo judicial") ||
    t.includes("inicial") ||
    t.includes("intimacao")
  )
    return "contestacao-responsabilidade";
  return null;
}

export type PecaDocumento = {
  nome: string;
  tipo_documento: string;
  partes: string[];
  prazos: string[];
  pontos: string[];
  transcricao: string[];
};

export type PecaArquivo = { nome: string; mime: string; dataUrl: string };

export type PecaInput = {
  /** Tipo escolhido pelo usuário; `auto` deixa a IA decidir. */
  tipo: string;
  documentos: PecaDocumento[];
  /** Arquivos originais (PDF/imagem) para o Claude ler diretamente. */
  arquivos?: PecaArquivo[];
  complemento?: string;
  contexto?: string;
};

/** Redige a peça via rota protegida /api/ai-peca (chave de IA só no servidor). */
export function streamPeca(
  input: PecaInput,
  onDelta: (chunk: string) => void,
  opts?: { signal?: AbortSignal; onProvider?: (provider: string) => void },
): Promise<string> {
  return streamAiEndpoint(
    "/api/ai-peca",
    {
      ...input,
      tipo: input.tipo === TIPO_AUTO ? "" : tipoPecaLabel(input.tipo),
    },
    onDelta,
    opts,
  );
}
