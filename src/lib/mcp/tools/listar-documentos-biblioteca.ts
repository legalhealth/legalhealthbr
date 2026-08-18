import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_documentos_gerados",
  title: "Listar documentos gerados",
  description:
    "Lista os documentos do histórico do usuário logado (Biblioteca, peças e análises de risco), do mais recente para o mais antigo.",
  inputSchema: {
    origem: z
      .enum(["biblioteca", "peca", "risco"])
      .optional()
      .describe("Filtra pela origem do documento."),
    limite: z.number().int().min(1).max(50).optional().describe("Padrão: 10."),
    incluir_conteudo: z.boolean().optional().describe("Inclui o texto completo de cada documento."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ origem, limite, incluir_conteudo }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("generated_docs")
      .select("id, origem, tipo, titulo, conteudo, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limite ?? 10);
    if (origem) query = query.eq("origem", origem);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const itens = (data ?? []).map((d) => ({
      ...d,
      conteudo: incluir_conteudo ? d.conteudo : (d.conteudo ?? "").slice(0, 280),
    }));
    const texto = itens.length
      ? itens
          .map(
            (d) =>
              `- ${d.titulo ?? d.tipo ?? "Documento"} (${d.origem ?? "-"}, ${d.status}) — ${new Date(d.created_at).toLocaleString("pt-BR")}\n  id: ${d.id}`,
          )
          .join("\n")
      : "Nenhum documento encontrado.";

    return { content: [{ type: "text", text: texto }], structuredContent: { itens } };
  },
});
