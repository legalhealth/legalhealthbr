import { AI_GATEWAY_URL, gatewayHeaders } from "@/lib/ai-gateway.server";

export const CLAUDE_MODEL = "claude-opus-5-5";
const FALLBACK_MODEL = "google/gemini-3.6-flash";

/**
 * Converte o SSE nativo da Anthropic (content_block_delta) no formato
 * `choices[0].delta.content` lido pelo navegador.
 */
function anthropicToOpenAiSse(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(t.slice(5).trim()) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
              const out = { choices: [{ delta: { content: ev.delta.text } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
            } else if (ev.type === "message_stop") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          } catch {
            /* fragmento incompleto */
          }
        }
      },
    }),
  );
}

/**
 * Gera texto em streaming com o Claude Opus; se a chave não existir ou a
 * Anthropic falhar antes de começar, usa o modelo padrão do app.
 */
export async function streamJuridico(opts: {
  system: string;
  user: string;
  gatewayKey: string;
  maxTokens?: number;
}): Promise<Response> {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (key) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: opts.maxTokens ?? 8000,
          stream: true,
          system: opts.system,
          messages: [{ role: "user", content: opts.user }],
        }),
      });
      if (res.ok && res.body) {
        return new Response(anthropicToOpenAiSse(res.body), { status: 200 });
      }
      console.error("anthropic error", res.status, await res.text().catch(() => ""));
    } catch (err) {
      console.error("anthropic network error", err);
    }
  }
  return fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: gatewayHeaders(opts.gatewayKey),
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      stream: true,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
}
