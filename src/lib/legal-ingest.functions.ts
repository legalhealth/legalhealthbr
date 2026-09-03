import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CatalogoItem = {
  sourceId: string;
  title: string;
  number: string | null;
  issuingBody: string;
  officialUrl: string;
  formato: "html" | "pdf";
  temas: string[];
  pilar: string | null;
  authorityLevel: number;
  artigos: string[];
  /** PDF com texto já conferido pela curadoria jurídica e pronto para indexar. */
  curado: boolean;
};

type Ctx = { supabase: ReturnType<typeof identity>; userId: string };
function identity() {
  return null as unknown as import("@supabase/supabase-js").SupabaseClient<
    import("@/integrations/supabase/types").Database
  >;
}

/** Só administradores acionam a coleta oficial. */
async function garantirAdmin(context: Ctx) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (!(data ?? []).some((r) => r.role === "admin")) {
    throw new Error("Apenas administradores podem executar a coleta da base jurídica.");
  }
}

/** Catálogo curado de fontes oficiais rastreadas pelo pipeline. */
export const listarCatalogoIngestao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CatalogoItem[]> => {
    await garantirAdmin(context as unknown as Ctx);
    const { CATALOGO } = await import("@/lib/legal-ingest.server");
    const { temTextoCurado } = await import("@/lib/legal-curadoria-cfm.server");
    return CATALOGO.map((f) => ({
      sourceId: f.sourceId,
      title: f.title,
      number: f.number,
      issuingBody: f.issuingBody,
      officialUrl: f.officialUrl,
      formato: f.formato,
      temas: f.temas,
      pilar: f.pilar,
      authorityLevel: f.authorityLevel,
      artigos: f.artigos,
      curado: temTextoCurado(f.sourceId),
    }));
  });

/** Coleta e indexa as fontes escolhidas (ou o catálogo completo). */
export const executarIngestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sourceIds?: string[] } | undefined) => ({
    sourceIds: Array.isArray(input?.sourceIds) ? input!.sourceIds.map(String).slice(0, 30) : [],
  }))
  .handler(async ({ data, context }) => {
    await garantirAdmin(context as unknown as Ctx);
    const { ingerirCatalogo } = await import("@/lib/legal-ingest.server");
    const resultados = await ingerirCatalogo(context.userId, data.sourceIds);
    return { resultados };
  });

export type IngestRun = {
  id: string;
  source_id: string;
  official_url: string | null;
  resultado: string;
  version: number | null;
  chunks: number;
  tamanho_texto: number;
  mensagem: string | null;
  created_at: string;
};

/** Histórico de coletas para auditoria da base. */
export const historicoIngestao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IngestRun[]> => {
    const ctx = context as unknown as Ctx;
    await garantirAdmin(ctx);
    const { data } = await ctx.supabase
      .from("legal_ingest_runs")
      .select(
        "id, source_id, official_url, resultado, version, chunks, tamanho_texto, mensagem, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as IngestRun[];
  });
