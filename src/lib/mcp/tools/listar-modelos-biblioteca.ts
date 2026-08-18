import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { BIBLIOTECA_CATEGORIAS } from "@/lib/biblioteca-catalogo";

export default defineTool({
  name: "listar_modelos_biblioteca",
  title: "Listar modelos da Biblioteca Inteligente",
  description:
    "Lista as categorias (Minutas, Protocolos, Checklists) e os modelos de documento disponíveis na Biblioteca Inteligente, com os identificadores usados para gerar cada documento.",
  inputSchema: {
    categoria: z
      .enum(["minutas", "protocolos", "checklists"])
      .optional()
      .describe("Filtra os modelos de uma única categoria."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ categoria }) => {
    const categorias = categoria
      ? BIBLIOTECA_CATEGORIAS.filter((c) => c.value === categoria)
      : BIBLIOTECA_CATEGORIAS;
    const texto = categorias
      .map(
        (c) =>
          `${c.label} (${c.value}):\n` +
          c.docs
            .map(
              (d) =>
                `  - ${d.value}: ${d.label}${d.procedimento ? " [requer o campo procedimento]" : ""}`,
            )
            .join("\n"),
      )
      .join("\n\n");
    return {
      content: [{ type: "text", text: texto }],
      structuredContent: { categorias },
    };
  },
});
