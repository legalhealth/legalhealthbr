import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { systemPromptFor } from "@/lib/ai-prompts.server";
import { limiteDoPlano, mensagemLimiteDiario } from "@/lib/ai-gateway.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type IncomingMessage = { role: string; content: string };
type IncomingAttachment = { name?: unknown; mime?: unknown; dataUrl?: unknown; text?: unknown };

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

type OutgoingMessage =
  | { role: "user" | "assistant"; content: string }
  | { role: "user"; content: ContentBlock[] };

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_CHARS = 12 * 1024 * 1024; // ~8 MB em base64

/** Anexa os arquivos enviados à última mensagem do usuário, em blocos multimodais. */
function withAttachments(
  messages: { role: "user" | "assistant"; content: string }[],
  raw: unknown,
): OutgoingMessage[] {
  const list = Array.isArray(raw) ? (raw as IncomingAttachment[]).slice(0, MAX_ATTACHMENTS) : [];
  if (list.length === 0) return messages;

  const lastIndex = messages.length - 1;
  const last = messages[lastIndex];
  if (!last || last.role !== "user") return messages;

  const blocks: ContentBlock[] = [{ type: "text", text: last.content }];
  for (const item of list) {
    const name = typeof item.name === "string" ? item.name.slice(0, 200) : "documento";
    const mime = typeof item.mime === "string" ? item.mime : "application/octet-stream";
    if (typeof item.text === "string" && item.text.trim()) {
      blocks.push({
        type: "text",
        text: `Documento anexado "${name}":\n\n${item.text.slice(0, 40000)}`,
      });
      continue;
    }
    const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl : "";
    if (!dataUrl.startsWith("data:") || dataUrl.length > MAX_ATTACHMENT_CHARS) continue;
    if (mime.startsWith("image/")) {
      blocks.push({ type: "image_url", image_url: { url: dataUrl } });
    } else if (mime === "application/pdf") {
      blocks.push({ type: "file", file: { filename: name, file_data: dataUrl } });
    }
  }

  if (blocks.length === 1) return messages;
  return [...messages.slice(0, lastIndex), { role: "user", content: blocks }];
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

function supabaseForToken(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return jsonError("Sessão não encontrada. Faça login novamente.", 401);

        const supabase = supabaseForToken(token);
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        const userId = userData?.user?.id;
        if (userError || !userId) {
          return jsonError("Sessão inválida ou expirada. Faça login novamente.", 401);
        }

        let body: { messages?: unknown; task?: unknown; attachments?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const rawMessages = Array.isArray(body.messages) ? (body.messages as IncomingMessage[]) : [];
        const messages = rawMessages
          .filter(
            (m) =>
              m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"),
          )
          .slice(-20)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 12000) }));

        if (messages.length === 0) {
          return jsonError("Envie ao menos uma mensagem.", 400);
        }

        const task = typeof body.task === "string" ? body.task : "assistente";

        // Limite de uso conforme o plano, em janela de 24 horas.
        const plano = await limiteDoPlano(supabase, userId);
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabase
          .from("ai_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);

        if (countError) {
          return jsonError("Não foi possível verificar seu limite de uso. Tente novamente.", 500);
        }
        if (plano.limiteIaDia !== null && (count ?? 0) >= plano.limiteIaDia) {
          return jsonError(mensagemLimiteDiario(plano), 429);
        }

        const apiKey = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return jsonError("Serviço de IA não configurado. Contate o suporte.", 500);
        }

        await supabase.from("ai_usage").insert({ user_id: userId, endpoint: "ai-chat" });

        // Fundamentação obrigatória: fontes oficiais vigentes da base jurídica.
        const {
          contextoDasFontes,
          recuperarFontes,
          registrarAuditoria,
          respostaDasFontes,
          rodapeDeFontes,
        } = await import("@/lib/legal-sources.server");
        const { sseFromText } = await import("@/lib/legal-qa.server");
        const perguntaAtual =
          [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const fontes = await recuperarFontes(perguntaAtual);
        const contextoFontes = contextoDasFontes(fontes);

        await registrarAuditoria({
          userId,
          origem: `assistente:${task}`,
          pergunta: perguntaAtual,
          fonte: fontes.suficiente ? "base-fontes" : "ia",
          trechos: fontes.trechos,
          nivelRisco: fontes.nivelRisco,
          exigeAdvogado: fontes.exigeAdvogado,
        });

        /** Sem IA disponível, responde com o texto das normas recuperadas. */
        const responderPelasFontes = (motivo: string) => {
          if (!fontes.suficiente) return null;
          console.warn("ai-chat: fallback pelas fontes", motivo);
          return sseFromText(respostaDasFontes(fontes) + rodapeDeFontes(fontes));
        };

        let upstream: Response;
        try {
          upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Lovable-API-Key": apiKey,
              Authorization: `Bearer ${apiKey}`,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({
              model: "google/gemini-3.6-flash",
              stream: true,
              messages: [
                {
                  role: "system",
                  content: contextoFontes
                    ? `${systemPromptFor(task)}\n\n${contextoFontes}`
                    : systemPromptFor(task),
                },
                ...withAttachments(messages, body.attachments),
              ],
            }),
          });
        } catch {
          return (
            responderPelasFontes("falha de rede") ??
            jsonError(
              "Falha de rede ao consultar a IA. Verifique sua conexão e tente novamente.",
              502,
            )
          );
        }

        if (upstream.status === 429) {
          return (
            responderPelasFontes("429") ??
            jsonError(
              "O serviço de IA está com muitas requisições neste momento. Aguarde alguns segundos e tente novamente.",
              429,
            )
          );
        }
        if (upstream.status === 402) {
          return (
            responderPelasFontes("402") ??
            jsonError(
              "Os créditos de IA do projeto foram esgotados. Recarregue para continuar usando o assistente.",
              402,
            )
          );
        }
        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error("ai-chat upstream error", upstream.status, detail);
          return (
            responderPelasFontes(`upstream ${upstream.status}`) ??
            jsonError("A IA não conseguiu responder agora. Tente novamente em instantes.", 502)
          );
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