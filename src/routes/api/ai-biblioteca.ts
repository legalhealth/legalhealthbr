import { createFileRoute } from "@tanstack/react-router";

import { corsHeaders, guardAiRequest, jsonError, upstreamError } from "@/lib/ai-gateway.server";
import { systemPromptFor } from "@/lib/ai-prompts.server";
import { streamJuridico } from "@/lib/anthropic.server";

const FIELDS = [
  ["categoria", "Categoria"],
  ["documento", "Documento solicitado"],
  ["nome", "Nome do profissional"],
  ["crm", "CRM / UF"],
  ["especialidade", "Especialidade"],
  ["cidade", "Cidade / UF"],
  ["procedimento", "Procedimento"],
  ["contexto", "Contexto administrativo informado na triagem"],
] as const;

function buildUserPrompt(body: Record<string, unknown>): string {
  const lines = FIELDS.map(([key, label]) => {
    const raw = typeof body[key] === "string" ? (body[key] as string).trim().slice(0, 2000) : "";
    return `${label}: ${raw || "[NÃO INFORMADO]"}`;
  });
  return [
    "Gere o documento abaixo, completo e personalizado para este profissional.",
    "",
    ...lines,
    "",
    "Entregue apenas o texto final do documento, pronto para revisão do advogado responsável.",
  ].join("\n");
}

export const Route = createFileRoute("/api/ai-biblioteca")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const guard = await guardAiRequest(request, "ai-biblioteca");
        if (!guard.ok) return guard.response;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const documento = typeof body["documento"] === "string" ? body["documento"].trim() : "";
        if (!documento) {
          return jsonError("Escolha o documento que deseja gerar.", 400);
        }

        let upstream: Response;
        try {
          upstream = await streamJuridico({
            system: systemPromptFor("biblioteca"),
            user: buildUserPrompt(body),
            gatewayKey: guard.apiKey,
          });
        } catch {
          return jsonError("Falha de rede ao consultar a IA. Tente novamente.", 502);
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return upstreamError(upstream.status, "ai-biblioteca", detail);
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            ...corsHeaders,
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-store",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
