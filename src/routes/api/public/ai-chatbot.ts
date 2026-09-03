import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { systemPromptFor } from "@/lib/ai-prompts.server";

/** Mensagens por sessão na última hora. */
const SESSION_HOURLY_LIMIT = 25;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const bodySchema = z.object({
  sessionKey: z.string().min(8).max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(14),
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export const Route = createFileRoute("/api/public/ai-chatbot")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return jsonResponse({ error: "Requisição inválida." }, 400);
        }

        const apiKey = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return jsonResponse({ error: "Serviço de IA não configurado." }, 500);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "desconhecido";
        const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);

        // Sessão anônima (criada na primeira mensagem do visitante).
        const { data: existing } = await supabaseAdmin
          .from("chatbot_public_sessions")
          .select("id")
          .eq("session_key", parsed.sessionKey)
          .maybeSingle();

        let sessionId = existing?.id ?? null;
        if (!sessionId) {
          const { data: created, error: createError } = await supabaseAdmin
            .from("chatbot_public_sessions")
            .insert({
              session_key: parsed.sessionKey,
              user_agent: userAgent,
              ip_hash: await hashIp(ip),
            })
            .select("id")
            .single();
          if (createError || !created) {
            console.error("public chatbot session error", createError);
            return jsonResponse({ error: "Não foi possível iniciar a conversa." }, 500);
          }
          sessionId = created.id;
        }

        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("chatbot_public_messages")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId)
          .gte("created_at", since);

        if ((count ?? 0) >= SESSION_HOURLY_LIMIT) {
          return jsonResponse(
            {
              error:
                "Você atingiu o limite de mensagens desta conversa. Crie sua conta gratuita para continuar conversando com a IA.",
            },
            429,
          );
        }

        const lastUser = [...parsed.messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabaseAdmin
            .from("chatbot_public_messages")
            .insert({ session_id: sessionId, role: "user", content: lastUser.content });
        }

        // Base própria primeiro: respostas cobertas não dependem de créditos de IA.
        const { buscarNaBase, contextoDaBase, registrarLacuna, registrarUsoBase, respostaDaBase } =
          await import("@/lib/legal-qa.server");
        const { contextoDasFontes, recuperarFontes, registrarAuditoria, rodapeDeFontes } =
          await import("@/lib/legal-sources.server");

        const perguntaAtual = lastUser?.content ?? "";
        const base = await buscarNaBase(perguntaAtual);
        const fontes = await recuperarFontes(perguntaAtual);

        if (base.confianca === "alta" && base.match) {
          const answer = respostaDaBase(base.match) + rodapeDeFontes(fontes);
          await registrarUsoBase(base.match.id);
          await registrarAuditoria({
            origem: "chatbot_publico",
            pergunta: perguntaAtual,
            fonte: "base-propria",
            qaId: base.match.id,
            trechos: fontes.trechos,
            nivelRisco: fontes.nivelRisco,
            exigeAdvogado: fontes.exigeAdvogado,
          });
          await supabaseAdmin
            .from("chatbot_public_messages")
            .insert({ session_id: sessionId, role: "assistant", content: answer });
          return jsonResponse({ answer, fonte: "base-propria" });
        }
        if (base.confianca === "nenhuma" && perguntaAtual.trim().length >= 6) {
          await registrarLacuna(perguntaAtual, "chatbot_publico");
        }
        const contextoBase = [base.match ? contextoDaBase(base.match) : "", contextoDasFontes(fontes)]
          .filter(Boolean)
          .join("\n\n");

        await registrarAuditoria({
          origem: "chatbot_publico",
          pergunta: perguntaAtual,
          fonte: fontes.suficiente ? "base-fontes" : "ia",
          ...(base.match ? { qaId: base.match.id } : {}),
          trechos: fontes.trechos,
          nivelRisco: fontes.nivelRisco,
          exigeAdvogado: fontes.exigeAdvogado,
        });

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
              model: "google/gemini-3.7-flash",
              max_tokens: 600,
              messages: [
                {
                  role: "system",
                  content: contextoBase
                    ? `${systemPromptFor("chatbot_publico")}\n\n${contextoBase}`
                    : systemPromptFor("chatbot_publico"),
                },

                ...parsed.messages,
              ],
            }),
          });
        } catch {
          return jsonResponse({ error: "Falha de rede ao consultar a IA." }, 502);
        }

        if (upstream.status === 429) {
          return jsonResponse(
            { error: "Muitas requisições agora. Aguarde alguns segundos e tente novamente." },
            429,
          );
        }
        if (upstream.status === 402) {
          return jsonResponse(
            { error: "Os créditos de IA da plataforma foram esgotados. Tente novamente mais tarde." },
            402,
          );
        }
        if (upstream.status === 403) {
          return jsonResponse({ error: "O serviço de IA está indisponível neste momento." }, 403);
        }
        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error("public chatbot upstream error", upstream.status, detail);
          return jsonResponse({ error: "A IA não conseguiu responder agora." }, 502);
        }

        const payload = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const answer = payload.choices?.[0]?.message?.content?.trim() ?? "";
        if (!answer) {
          return jsonResponse({ error: "A IA não retornou conteúdo. Tente novamente." }, 502);
        }

        await supabaseAdmin
          .from("chatbot_public_messages")
          .insert({ session_id: sessionId, role: "assistant", content: answer });

        return jsonResponse({ answer: answer + rodapeDeFontes(fontes) });
      },
    },
  },
});
