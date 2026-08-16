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

/** 15 MB de arquivo ≈ 20 MB de base64. */
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_DATAURL_CHARS = Math.ceil((MAX_BYTES * 4) / 3) + 200;

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 30);
}

function normalize(raw: unknown) {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const pontos = Array.isArray(obj["pontos_criticos"]) ? obj["pontos_criticos"] : [];
  const prazos = Array.isArray(obj["prazos"]) ? obj["prazos"] : [];
  return {
    tipo_documento:
      typeof obj["tipo_documento"] === "string"
        ? obj["tipo_documento"]
        : "[NÃO IDENTIFICADO NO DOCUMENTO]",
    partes_envolvidas: asStringArray(obj["partes_envolvidas"]),
    transcricao_essencial: asStringArray(obj["transcricao_essencial"]),
    pontos_criticos: pontos.slice(0, 20).map((item) => {
      const p = (item ?? {}) as Record<string, unknown>;
      const risco = p["risco"];
      return {
        titulo: typeof p["titulo"] === "string" ? p["titulo"] : "Ponto crítico",
        descricao: typeof p["descricao"] === "string" ? p["descricao"] : "",
        risco: risco === "alto" || risco === "medio" || risco === "baixo" ? risco : "medio",
      };
    }),
    prazos: prazos.slice(0, 20).map((item) => {
      const p = (item ?? {}) as Record<string, unknown>;
      const urgencia = p["urgencia"];
      return {
        descricao: typeof p["descricao"] === "string" ? p["descricao"] : "Prazo",
        data_ou_contagem:
          typeof p["data_ou_contagem"] === "string" ? p["data_ou_contagem"] : "[VERIFICAR]",
        urgencia:
          urgencia === "alta" || urgencia === "media" || urgencia === "baixa" ? urgencia : "media",
      };
    }),
    proximo_passo:
      typeof obj["proximo_passo"] === "string"
        ? obj["proximo_passo"]
        : "Encaminhe o documento ao advogado responsável para conferência.",
  };
}

export const Route = createFileRoute("/api/ai-documento-leitura")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const guard = await guardAiRequest(request, "ai-documento-leitura");
        if (!guard.ok) return guard.response;

        let body: { name?: unknown; mime?: unknown; dataUrl?: unknown; texto?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const name = typeof body.name === "string" ? body.name.slice(0, 200) : "documento";
        const mime = typeof body.mime === "string" ? body.mime : "application/octet-stream";
        const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
        const texto = typeof body.texto === "string" ? body.texto.slice(0, 40000) : "";

        const blocks: ContentBlock[] = [
          {
            type: "text",
            text: `Faça a leitura técnica completa do documento "${name}" e devolva apenas o JSON no formato definido.`,
          },
        ];

        if (texto.trim()) {
          blocks.push({ type: "text", text: `Conteúdo do documento:\n\n${texto}` });
        } else if (!dataUrl.startsWith("data:")) {
          return jsonError("Envie um arquivo válido para leitura.", 400);
        } else if (dataUrl.length > MAX_DATAURL_CHARS) {
          return jsonError("O arquivo excede o limite de 15 MB.", 413);
        } else if (mime.startsWith("image/")) {
          blocks.push({ type: "image_url", image_url: { url: dataUrl } });
        } else if (mime === "application/pdf") {
          blocks.push({ type: "file", file: { filename: name, file_data: dataUrl } });
        } else {
          return jsonError("Formato não suportado. Envie PDF, JPG, PNG ou WEBP.", 415);
        }

        let upstream: Response;
        try {
          upstream = await fetch(AI_GATEWAY_URL, {
            method: "POST",
            headers: gatewayHeaders(guard.apiKey),
            body: JSON.stringify({
              model: "google/gemini-3.6-flash",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: systemPromptFor("documento") },
                { role: "user", content: blocks },
              ],
            }),
          });
        } catch {
          return jsonError("Falha de rede ao consultar a IA. Tente novamente.", 502);
        }

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          return upstreamError(upstream.status, "ai-documento-leitura", detail);
        }

        const payload = (await upstream.json().catch(() => null)) as {
          choices?: { message?: { content?: string } }[];
        } | null;
        const content = payload?.choices?.[0]?.message?.content ?? "";
        const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          return jsonError("A IA devolveu um formato inesperado. Tente novamente.", 502);
        }

        return new Response(JSON.stringify({ analise: normalize(parsed) }), {
          status: 200,
          headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
        });
      },
    },
  },
});