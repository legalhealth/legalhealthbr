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
};

/** Só administradores acionam a coleta oficial. */
async function garantirAdmin(supabase: {
  from: (t: string) => {
    select: (c: string) => {
      eq: (c: string, v: string) => { limit: (n: number) => Promise<{ data: unknown[] | null }> };
    };
  };
}, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).limit(20);
  const roles = (data ?? []) as { role?: string }[];
  if (!roles.some((r) => r.role === "admin")) {
    throw new Error("Apenas administradores podem executar a coleta da base jurídica.");
  }
}

/** Catálogo curado de fontes oficiais rastreadas pelo pipeline. */
export const listarCatalogoIngestao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CatalogoItem[]> => {
    await garantirAdmin(context.supabase as never, context.userId);
    const { CATALOGO } = await import("@/lib/legal-ingest.server");
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
    }));
  });

/** Coleta e indexa as fontes escolhidas (ou o catálogo completo). */
export const executarIngestao = createServerFn({ method: "POST" })
  .inputValidator((input: { sourceIds?: string[] } | undefined) => ({
    sourceIds: Array.isArray(input?.sourceIds) ? input!.sourceIds.map(String).slice(0, 30) : [],
  }))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await garantirAdmin(context.supabase as never, context.userId);
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
    await garantirAdmin(context.supabase as never, context.userId);
    const { data } = await (context.supabase as never as {
      from: (t: string) => {
        select: (c: string) => {
          order: (c: string, o: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: IngestRun[] | null }>;
          };
        };
      };
    })
      .from("legal_ingest_runs")
      .select("id, source_id, official_url, resultado, version, chunks, tamanho_texto, mensagem, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
