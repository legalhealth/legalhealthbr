import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Acima disso a resposta da base é entregue direto, sem consultar o modelo externo. */
export const LIMIAR_ALTO = 0.6;
/** Entre o médio e o alto, a base entra como contexto para a IA. */
export const LIMIAR_MEDIO = 0.34;

export type BaseMatch = {
  id: string;
  pergunta: string;
  resposta: string;
  fundamentacao: string[];
  pilar: string | null;
  categoria: string;
  score: number;
};

export type BaseLookup = {
  match: BaseMatch | null;
  confianca: "alta" | "media" | "nenhuma";
};

/** Busca na base própria de Q&A jurídico (sem custo de IA). */
export async function buscarNaBase(consulta: string): Promise<BaseLookup> {
  const texto = (consulta ?? "").trim();
  if (texto.length < 6) return { match: null, confianca: "nenhuma" };

  const { data, error } = await supabaseAdmin.rpc("match_legal_qa", {
    consulta: texto.slice(0, 600),
    limite: 1,
  });

  if (error) {
    console.error("legal_qa: falha na busca", error);
    return { match: null, confianca: "nenhuma" };
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return { match: null, confianca: "nenhuma" };

  const match: BaseMatch = {
    id: row.id,
    pergunta: row.pergunta,
    resposta: row.resposta,
    fundamentacao: row.fundamentacao ?? [],
    pilar: row.pilar ?? null,
    categoria: row.categoria,
    score: Number(row.score ?? 0),
  };

  if (match.score >= LIMIAR_ALTO) return { match, confianca: "alta" };
  if (match.score >= LIMIAR_MEDIO) return { match, confianca: "media" };
  return { match: null, confianca: "nenhuma" };
}

/** Texto final entregue ao usuário quando a resposta vem da base própria. */
export function respostaDaBase(match: BaseMatch): string {
  const fontes =
    match.fundamentacao.length > 0
      ? `\n\n**Base Legal Health** · ${match.fundamentacao.join(" · ")}`
      : "\n\n**Base Legal Health** — conteúdo próprio da plataforma.";
  return `${match.resposta.trim()}${fontes}`;
}

/** Bloco de contexto usado quando a base ajuda, mas não responde sozinha. */
export function contextoDaBase(match: BaseMatch): string {
  return [
    "Conteúdo curado da base própria da Legal Health sobre tema próximo ao perguntado.",
    "Use-o como fonte preferencial e mantenha as normas citadas:",
    `Pergunta da base: ${match.pergunta}`,
    `Resposta da base: ${match.resposta}`,
    match.fundamentacao.length > 0 ? `Normas: ${match.fundamentacao.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function registrarUsoBase(id: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("registrar_uso_legal_qa", { qa_id: id });
  if (error) console.error("legal_qa: falha ao registrar uso", error);
}

/** Guarda a pergunta que a base não cobriu, para curadoria posterior. */
export async function registrarLacuna(pergunta: string, origem: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("registrar_lacuna_legal_qa", {
    texto: pergunta.slice(0, 500),
    origem_in: origem,
  });
  if (error) console.error("legal_qa: falha ao registrar lacuna", error);
}

/**
 * Empacota um texto pronto no mesmo formato SSE do gateway de IA, para o
 * cliente consumir a resposta da base sem nenhuma mudança no parser.
 */
export function sseFromText(texto: string): Response {
  const encoder = new TextEncoder();
  const partes = texto.match(/[\s\S]{1,180}/g) ?? [texto];

  const stream = new ReadableStream({
    start(controller) {
      for (const parte of partes) {
        const payload = JSON.stringify({ choices: [{ delta: { content: parte } }] });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-legal-health-fonte": "base-propria",
    },
  });
}
