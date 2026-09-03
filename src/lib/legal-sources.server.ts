import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Abaixo disso o trecho não entra na fundamentação da resposta. */
const LIMIAR_TRECHO = 0.3;

export type NivelRisco = "baixo" | "medio" | "alto";

export type TrechoFonte = {
  chunkId: string;
  versionId: string;
  sourceId: string;
  title: string;
  issuingBody: string;
  number: string | null;
  officialUrl: string | null;
  authorityLevel: number;
  artigo: string | null;
  secao: string | null;
  texto: string;
  pilar: string | null;
  nivelRisco: NivelRisco;
  exigeAdvogado: boolean;
  effectiveFrom: string | null;
  version: number;
  score: number;
};

export type RecuperacaoJuridica = {
  trechos: TrechoFonte[];
  /** Maior nível de risco entre os trechos recuperados. */
  nivelRisco: NivelRisco | null;
  exigeAdvogado: boolean;
  suficiente: boolean;
};

const ORDEM_RISCO: Record<NivelRisco, number> = { baixo: 0, medio: 1, alto: 2 };

/**
 * Recupera trechos de fontes oficiais vigentes (nível de autoridade 1 a 4),
 * filtrando por pilar do Juriscore quando informado. Sem custo de IA.
 */
export async function recuperarFontes(
  consulta: string,
  opcoes: { limite?: number; pilar?: string | null } = {},
): Promise<RecuperacaoJuridica> {
  const vazio: RecuperacaoJuridica = {
    trechos: [],
    nivelRisco: null,
    exigeAdvogado: false,
    suficiente: false,
  };

  const texto = (consulta ?? "").trim();
  if (texto.length < 6) return vazio;

  const { data, error } = await supabaseAdmin.rpc("match_legal_chunks", {
    consulta: texto.slice(0, 600),
    limite: opcoes.limite ?? 4,
    pilar_in: opcoes.pilar ?? null,
    autoridade_max: 4,
  });

  if (error) {
    console.error("legal_sources: falha na recuperação", error);
    return vazio;
  }

  const trechos: TrechoFonte[] = (Array.isArray(data) ? data : [])
    .map((row: Record<string, unknown>) => ({
      chunkId: String(row.chunk_id),
      versionId: String(row.version_id),
      sourceId: String(row.source_id),
      title: String(row.title),
      issuingBody: String(row.issuing_body),
      number: (row.number as string | null) ?? null,
      officialUrl: (row.official_url as string | null) ?? null,
      authorityLevel: Number(row.authority_level ?? 5),
      artigo: (row.artigo as string | null) ?? null,
      secao: (row.secao as string | null) ?? null,
      texto: String(row.texto),
      pilar: (row.pilar as string | null) ?? null,
      nivelRisco: ((row.nivel_risco as NivelRisco) ?? "medio") as NivelRisco,
      exigeAdvogado: Boolean(row.exige_advogado),
      effectiveFrom: (row.effective_from as string | null) ?? null,
      version: Number(row.version ?? 1),
      score: Number(row.score ?? 0),
    }))
    .filter((t) => t.score >= LIMIAR_TRECHO);

  if (trechos.length === 0) return vazio;

  const nivelRisco = trechos.reduce<NivelRisco>(
    (maior, t) => (ORDEM_RISCO[t.nivelRisco] > ORDEM_RISCO[maior] ? t.nivelRisco : maior),
    "baixo",
  );

  return {
    trechos,
    nivelRisco,
    exigeAdvogado: trechos.some((t) => t.exigeAdvogado),
    suficiente: true,
  };
}

/** Citação legível de um trecho, com norma, artigo, vigência e link oficial. */
export function citacao(trecho: TrechoFonte): string {
  const norma = trecho.number ? `${trecho.title} (${trecho.number})` : trecho.title;
  const local = trecho.artigo ?? trecho.secao ?? "";
  const vigencia = trecho.effectiveFrom ? `vigente desde ${trecho.effectiveFrom}` : "vigente";
  return [
    `${norma}${local ? ` — ${local}` : ""}`,
    trecho.issuingBody,
    vigencia,
    trecho.officialUrl ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Bloco de contexto entregue ao modelo: só o que foi recuperado pode ser citado.
 */
export function contextoDasFontes(rec: RecuperacaoJuridica): string {
  if (rec.trechos.length === 0) return "";

  const blocos = rec.trechos.map((t, i) => {
    return [
      `[Fonte ${i + 1}] ${citacao(t)}`,
      `Texto: ${t.texto}`,
      t.pilar ? `Pilar do Juriscore: ${t.pilar}` : "",
      `Nível de risco: ${t.nivelRisco}${t.exigeAdvogado ? " · exige revisão de advogado" : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "FONTES OFICIAIS RECUPERADAS DA BASE JURÍDICA LEGAL HEALTH (todas vigentes na data de hoje).",
    "Regras obrigatórias:",
    "- Fundamente a resposta apenas nestas fontes; não invente normas, artigos, números ou julgados.",
    "- Cite a fonte usada com norma, artigo e órgão emissor.",
    "- Se as fontes não cobrirem a pergunta, diga que a base não tem fundamento suficiente e recomende avaliação de advogado.",
    "",
    blocos.join("\n\n"),
  ].join("\n");
}

/** Lista de fontes exibida ao usuário no fim da resposta. */
export function rodapeDeFontes(rec: RecuperacaoJuridica): string {
  if (rec.trechos.length === 0) return "";
  const hoje = new Date().toISOString().slice(0, 10);
  const linhas = rec.trechos.map((t) => `- ${citacao(t)}`);
  return [
    "",
    "",
    `**Fontes consultadas na base Legal Health** (consulta em ${hoje}):`,
    ...linhas,
    rec.exigeAdvogado
      ? "\n⚠️ Tema de risco elevado: confirme a conduta com advogado antes de aplicar."
      : "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** Resposta padrão quando a base não tem fundamento suficiente. */
export const SEM_FUNDAMENTO =
  "Não encontrei na base jurídica da Legal Health fonte oficial vigente suficiente para responder com segurança a essa pergunta. Para não gerar orientação sem fundamento verificável, recomendo avaliação de um advogado — você pode enviar o caso pela área de Revisões.";

/** Registra a resposta com as versões de fonte usadas (auditoria e revalidação). */
export async function registrarAuditoria(input: {
  userId?: string | null;
  origem: string;
  pergunta: string;
  fonte: "base-propria" | "base-fontes" | "ia" | "insuficiente";
  qaId?: string | null;
  trechos?: TrechoFonte[];
  nivelRisco?: NivelRisco | null;
  exigeAdvogado?: boolean;
}): Promise<void> {
  const trechos = input.trechos ?? [];
  const { error } = await supabaseAdmin.rpc("registrar_auditoria_resposta", {
    user_id_in: input.userId ?? null,
    origem_in: input.origem,
    pergunta_in: input.pergunta.slice(0, 1000),
    fonte_in: input.fonte,
    qa_id_in: input.qaId ?? null,
    version_ids_in: Array.from(new Set(trechos.map((t) => t.versionId))),
    citacoes_in: trechos.map((t) => ({
      source_id: t.sourceId,
      version: t.version,
      artigo: t.artigo,
      citacao: citacao(t),
    })),
    nivel_risco_in: input.nivelRisco ?? null,
    exige_advogado_in: input.exigeAdvogado ?? false,
  });
  if (error) console.error("auditoria de resposta: falha ao registrar", error);
}
