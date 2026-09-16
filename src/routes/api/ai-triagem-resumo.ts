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

type Resumo = {
  motivo: string;
  resumo: string[];
  urgencia: "alta" | "media" | "baixa";
  encaminhamento: string;
  documentos: { slug: string; label: string }[];
  pendencias: string[];
};

const VAZIO: Resumo = {
  motivo: "",
  resumo: [],
  urgencia: "media",
  encaminhamento: "",
  documentos: [],
  pendencias: [],
};

function normalizar(bruto: unknown): Resumo {
  const obj = (bruto ?? {}) as Record<string, unknown>;
  const lista = (valor: unknown): string[] =>
    Array.isArray(valor)
      ? valor.filter((v): v is string => typeof v === "string").slice(0, 12)
      : [];
  const urgenciaBruta = typeof obj["urgencia"] === "string" ? obj["urgencia"] : "media";
  const documentos = Array.isArray(obj["documentos"])
    ? obj["documentos"]
        .map((item) => {
          const doc = (item ?? {}) as Record<string, unknown>;
          return {
            slug: typeof doc["slug"] === "string" ? doc["slug"] : "",
            label: typeof doc["label"] === "string" ? doc["label"] : "",
          };
        })
        .filter((d) => d.slug && d.label)
        .slice(0, 4)
    : [];
  return {
    motivo: typeof obj["motivo"] === "string" ? obj["motivo"] : "",
    resumo: lista(obj["resumo"]),
    urgencia:
      urgenciaBruta === "alta" || urgenciaBruta === "baixa"
        ? (urgenciaBruta as "alta" | "baixa")
        : "media",
    encaminhamento: typeof obj["encaminhamento"] === "string" ? obj["encaminhamento"] : "",
    documentos,
    pendencias: lista(obj["pendencias"]),
  };
}

export const Route = createFileRoute("/api/ai-triagem-resumo")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const guard = await guardAiRequest(request, "ai-triagem-resumo", {
          recurso: "triagem_voz",
        });
        if (!guard.ok) return guard.response;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const transcricao =
          typeof body["transcricao"] === "string" ? body["transcricao"].trim().slice(0, 30000) : "";
        if (transcricao.length < 20) {
          return jsonError(
            "A transcrição ficou curta demais para gerar a triagem. Grave novamente.",
            400,
          );
        }

        let upstream: Response;
        try {
          upstream = await fetch(AI_GATEWAY_URL, {
            method: "POST",
            headers: gatewayHeaders(guard.apiKey),
            body: JSON.stringify({
              model: "google/gemini-3.6-flash",
              messages: [
                { role: "system", content: systemPromptFor("triagem") },
                {
                  role: "user",
                  content: `Transcrição do atendimento:\n\n${transcricao}\n\nDevolva apenas o JSON da triagem.`,
                },
              ],
            }),
          });
        } catch {
          return jsonError("Falha de rede ao consultar a IA. Tente novamente.", 502);
        }

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          return upstreamError(upstream.status, "ai-triagem-resumo", detail);
        }

        const payload = (await upstream.json().catch(() => null)) as {
          choices?: { message?: { content?: string } }[];
        } | null;
        const texto = payload?.choices?.[0]?.message?.content ?? "";
        const limpo = texto
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/, "")
          .trim();

        let resumo = VAZIO;
        try {
          resumo = normalizar(JSON.parse(limpo));
        } catch {
          const inicio = limpo.indexOf("{");
          const fim = limpo.lastIndexOf("}");
          if (inicio >= 0 && fim > inicio) {
            try {
              resumo = normalizar(JSON.parse(limpo.slice(inicio, fim + 1)));
            } catch {
              return jsonError(
                "A IA não devolveu a triagem em formato válido. Tente novamente.",
                502,
              );
            }
          } else {
            return jsonError(
              "A IA não devolveu a triagem em formato válido. Tente novamente.",
              502,
            );
          }
        }

        return new Response(JSON.stringify({ resumo }), {
          headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});
