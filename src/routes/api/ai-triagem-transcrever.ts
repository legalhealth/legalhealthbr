import { createFileRoute } from "@tanstack/react-router";

import { corsHeaders, guardAiRequest, jsonError, upstreamError } from "@/lib/ai-gateway.server";

const TRANSCRIBE_URL = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Recebe uma janela completa de WAV da triagem e devolve a transcrição em
 * streaming (SSE). A chave de IA fica apenas no servidor.
 */
export const Route = createFileRoute("/api/ai-triagem-transcrever")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const guard = await guardAiRequest(request, "ai-triagem-transcrever", {
          registrarUso: false,
          recurso: "triagem_voz",
        });
        if (!guard.ok) return guard.response;

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return jsonError("Áudio inválido para transcrição.", 400);
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) {
          return jsonError("Nenhum áudio recebido para transcrição.", 400);
        }
        if (file.size > MAX_BYTES) {
          return jsonError("O trecho de áudio é grande demais. Grave trechos mais curtos.", 413);
        }

        const upstreamForm = new FormData();
        upstreamForm.append("model", "google/gemini-3.5-transcribe");
        upstreamForm.append("file", file, "trecho.wav");
        upstreamForm.append("stream", "true");
        upstreamForm.append("language", "pt");

        let upstream: Response;
        try {
          upstream = await fetch(TRANSCRIBE_URL, {
            method: "POST",
            headers: { "Lovable-API-Key": guard.apiKey, "X-Lovable-AIG-SDK": "fetch" },
            body: upstreamForm,
          });
        } catch {
          return jsonError("Falha de rede ao transcrever o áudio. Tente novamente.", 502);
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return upstreamError(upstream.status, "ai-triagem-transcrever", detail);
        }

        return new Response(upstream.body, {
          headers: {
            ...corsHeaders,
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
