import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { categoriaLabel, docsDaCategoria } from "@/lib/biblioteca-catalogo";
import { systemPromptFor } from "@/lib/ai-prompts.server";
import { aiApiKey, supabaseForUser } from "../supabase";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export default defineTool({
  name: "gerar_documento_biblioteca",
  title: "Gerar documento da Biblioteca Inteligente",
  description:
    "Gera com IA uma minuta, protocolo ou checklist da Biblioteca Inteligente personalizado para o profissional e salva o resultado no histórico do usuário logado.",
  inputSchema: {
    categoria: z.enum(["minutas", "protocolos", "checklists"]),
    documento: z
      .string()
      .min(1)
      .describe("Identificador do modelo, obtido em listar_modelos_biblioteca."),
    nome: z.string().trim().optional().describe("Nome do profissional."),
    crm: z.string().trim().optional().describe("CRM / UF."),
    especialidade: z.string().trim().optional(),
    cidade: z.string().trim().optional().describe("Cidade / UF."),
    procedimento: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }

    const doc = docsDaCategoria(input.categoria).find((d) => d.value === input.documento);
    if (!doc) {
      throw new ToolError(
        `Modelo "${input.documento}" não existe na categoria ${input.categoria}. Use listar_modelos_biblioteca.`,
      );
    }

    const supabase = supabaseForUser(ctx);
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, crm, especialidade, cidade")
      .maybeSingle();

    const campos = {
      Categoria: categoriaLabel(input.categoria),
      "Documento solicitado": doc.label,
      "Nome do profissional": input.nome || profile?.nome || "",
      "CRM / UF": input.crm || profile?.crm || "",
      Especialidade: input.especialidade || profile?.especialidade || "",
      "Cidade / UF": input.cidade || profile?.cidade || "",
      Procedimento: input.procedimento ?? "",
    };

    const userPrompt = [
      "Gere o documento abaixo, completo e personalizado para este profissional.",
      "",
      ...Object.entries(campos).map(([label, value]) => `${label}: ${value || "[NÃO INFORMADO]"}`),
      "",
      "Entregue apenas o texto final do documento, pronto para revisão do advogado responsável.",
    ].join("\n");

    const apiKey = aiApiKey();
    const upstream = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: systemPromptFor("biblioteca") },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      throw new ToolError(
        upstream.status === 429
          ? "O serviço de IA está sobrecarregado. Tente novamente em instantes."
          : `A IA não conseguiu gerar o documento (${upstream.status}). ${detail.slice(0, 200)}`,
      );
    }

    const payload = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const conteudo = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!conteudo) throw new ToolError("A IA devolveu uma resposta vazia. Tente novamente.");

    const titulo = `${categoriaLabel(input.categoria)} — ${doc.label}`;
    const { data: saved, error } = await supabase
      .from("generated_docs")
      .insert({
        user_id: ctx.getUserId()!,
        origem: "biblioteca",
        tipo: doc.label,
        titulo,
        conteudo,
        status: "rascunho",
      })
      .select("id")
      .single();

    const aviso =
      "\n\n⚠️ Conteúdo gerado por IA — sujeito à revisão do advogado responsável antes do uso.";

    return {
      content: [
        {
          type: "text",
          text:
            `${titulo}\n\n${conteudo}` +
            (error ? `\n\n(Não foi possível salvar no histórico: ${error.message})` : "") +
            aviso,
        },
      ],
      structuredContent: { id: saved?.id ?? null, titulo, conteudo },
    };
  },
});
