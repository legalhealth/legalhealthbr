import { AI_GATEWAY_URL, gatewayHeaders } from "@/lib/ai-gateway.server";

export const CLAUDE_MODEL = "claude-opus-5-5";
const FALLBACK_MODEL = "google/gemini-3.6-flash";

export type ClaudeAttachment = { nome: string; mime: string; base64: string };

export const CLAUDE_DOC_MIMES = ["application/pdf"];
export const CLAUDE_IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const enc = new TextEncoder();
const sse = (obj: unknown) => enc.encode(`data: ${JSON.stringify(obj)}\n\n`);

/**
 * Converte o SSE nativo da Anthropic no formato `choices[0].delta.content`
 * lido pelo navegador. Emite antes um evento `{provider}`; recusas viram
 * um evento terminal `{error}`.
 */
function anthropicToOpenAiSse(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      start(controller) {
        controller.enqueue(sse({ provider: "claude" }));
      },
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
              delta?: { type?: string; text?: string; stop_reason?: string };
              error?: { type?: string; message?: string };
            };
            if (
              ev.type === "content_block_delta" &&
              ev.delta?.type === "text_delta" &&
              ev.delta.text
            ) {
              controller.enqueue(sse({ choices: [{ delta: { content: ev.delta.text } }] }));
            } else if (ev.type === "message_delta" && ev.delta?.stop_reason === "refusal") {
              controller.enqueue(
                sse({ error: "A IA recusou redigir este conteúdo. Revise o caso com o advogado." }),
              );
            } else if (ev.type === "error") {
              controller.enqueue(
                sse({ error: "A redação foi interrompida pela IA. Tente novamente em instantes." }),
              );
            } else if (ev.type === "message_stop") {
              controller.enqueue(enc.encode("data: [DONE]\n\n"));
            }
          } catch {
            /* fragmento incompleto */
          }
        }
      },
    }),
  );
}

function withProviderPrefix(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      start(controller) {
        controller.enqueue(sse({ provider: "fallback" }));
      },
    }),
  );
}

/**
 * Gera texto em streaming com o Claude Opus (lendo os anexos originais);
 * se a chave não existir ou a Anthropic falhar antes de começar, usa o
 * modelo padrão do app apenas com o texto. Recusas/403 não caem no fallback.
 */
export async function streamJuridico(opts: {
  system: string;
  user: string;
  gatewayKey: string;
  maxTokens?: number;
  attachments?: ClaudeAttachment[];
  signal?: AbortSignal;
}): Promise<Response> {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (key) {
    const content: unknown[] = [];
    for (const a of opts.attachments ?? []) {
      if (CLAUDE_DOC_MIMES.includes(a.mime)) {
        content.push({
          type: "document",
          title: a.nome.slice(0, 200),
          source: { type: "base64", media_type: a.mime, data: a.base64 },
        });
      } else if (CLAUDE_IMAGE_MIMES.includes(a.mime)) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: a.mime, data: a.base64 },
        });
      }
    }
    content.push({ type: "text", text: opts.user });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: opts.signal,
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: opts.maxTokens ?? 16000,
          stream: true,
          system: opts.system,
          messages: [{ role: "user", content }],
        }),
      });
      if (res.ok && res.body) {
        return new Response(anthropicToOpenAiSse(res.body), { status: 200 });
      }
      const detail = await res.text().catch(() => "");
      console.error("anthropic error", res.status, detail.slice(0, 500));
      if (res.status === 403) {
        return new Response(
          JSON.stringify({ error: "Acesso ao Claude negado para esta solicitação." }),
          { status: 403 },
        );
      }
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      console.error("anthropic network error", err);
    }
  }
  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    signal: opts.signal,
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
  if (res.ok && res.body) {
    return new Response(withProviderPrefix(res.body), { status: 200 });
  }
  return res;
}
