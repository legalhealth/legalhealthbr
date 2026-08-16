import { createFileRoute } from "@tanstack/react-router";

import {
  AI_GATEWAY_URL,
  corsHeaders,
  gatewayHeaders,
  guardAiRequest,
  jsonError,
  upstreamError,
} from "@/lib/ai-gateway.server";
import { systemPromptFor } from "@/lib/ai-prompts.server";

const FIELDS = [
  ["tipo", "Tipo de peça"],
  ["cliente", "Cliente representado"],
  ["contraria", "Parte contrária"],
  ["orgao", "Órgão de destino"],
  ["fatos", "Fatos do caso"],
  ["objetivo", "Objetivo e pedidos"],
  ["provas", "Provas disponíveis"],
  ["contexto", "Contexto de conformidade (Juriscore®)"],
] as const;

function buildUserPrompt(body: Record<string, unknown>): string {
  const lines = FIELDS.map(([key, label]) => {
    const raw = typeof body[key] === "string" ? (body[key] as string).trim().slice(0, 8000) : "";
    return `${label}: ${raw || "[NÃO INFORMADO]"}`;
  });
  return [
    "Redija a peça completa com base nos dados abaixo.",
    "",
    ...lines,
    "",
    "Entregue apenas o texto da peça, pronto para revisão do advogado responsável.",
  ].join("\n");
}

export const Route = createFileRoute("/api/ai-peca")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const guard = await guardAiRequest(request, "ai-peca");
        if (!guard.ok) return guard.response;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const fatos = typeof body["fatos"] === "string" ? body["fatos"].trim() : "";
        if (fatos.length < 20) {
          return jsonError("Descreva os fatos do caso com mais detalhes.", 400);
        }

        let upstream: Response;
        try {
          upstream = await fetch(AI_GATEWAY_URL, {
            method: "POST",
            headers: gatewayHeaders(guard.apiKey),
            body: JSON.stringify({
              model: "google/gemini-3.6-flash",
              stream: true,
              messages: [
                { role: "system", content: systemPromptFor("peca") },
                { role: "user", content: buildUserPrompt(body) },
              ],
            }),
          });
        } catch {
          return jsonError("Falha de rede ao consultar a IA. Tente novamente.", 502);
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return upstreamError(upstream.status, "ai-peca", detail);
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