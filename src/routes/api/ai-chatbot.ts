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

export const Route = createFileRoute("/api/ai-chatbot")({
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

        let body: { messages?: unknown; contexto?: unknown };
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
          .slice(-14)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 6000) }));

        if (messages.length === 0) return jsonError("Envie ao menos uma mensagem.", 400);

        const contexto = typeof body.contexto === "string" ? body.contexto.slice(0, 3000) : "";

        // Base própria primeiro: respostas cobertas não consomem créditos de IA.
        const {
          buscarNaBase,
          contextoDaBase,
          registrarLacuna,
          registrarUsoBase,
          respostaDaBase,
          sseFromText,
        } = await import("@/lib/legal-qa.server");
        const {
          contextoDasFontes,
          recuperarFontes,
          registrarAuditoria,
          respostaDasFontes,
          rodapeDeFontes,
        } = await import("@/lib/legal-sources.server");

        const ultimaPergunta = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const base = await buscarNaBase(ultimaPergunta);
        const fontes = await recuperarFontes(ultimaPergunta);

        if (base.confianca === "alta" && base.match) {
          await registrarUsoBase(base.match.id);
          await registrarAuditoria({
            userId,
            origem: "chatbot",
            pergunta: ultimaPergunta,
            fonte: "base-propria",
            qaId: base.match.id,
            trechos: fontes.trechos,
            nivelRisco: fontes.nivelRisco,
            exigeAdvogado: fontes.exigeAdvogado,
          });
          return sseFromText(respostaDaBase(base.match) + rodapeDeFontes(fontes));
        }
        if (base.confianca === "nenhuma" && ultimaPergunta.trim().length >= 6) {
          await registrarLacuna(ultimaPergunta, "chatbot");
        }
        const contextoBase = [
          base.match ? contextoDaBase(base.match) : "",
          contextoDasFontes(fontes),
        ]
          .filter(Boolean)
          .join("\n\n");

        await registrarAuditoria({
          userId,
          origem: "chatbot",
          pergunta: ultimaPergunta,
          fonte: fontes.suficiente ? "base-fontes" : "ia",
          ...(base.match ? { qaId: base.match.id } : {}),
          trechos: fontes.trechos,
          nivelRisco: fontes.nivelRisco,
          exigeAdvogado: fontes.exigeAdvogado,
        });



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
        if (!apiKey) return jsonError("Serviço de IA não configurado. Contate o suporte.", 500);

        await supabase.from("ai_usage").insert({ user_id: userId, endpoint: "ai-chatbot" });

        const system = [
          systemPromptFor("chatbot"),
          contexto ? `Contexto do usuário atual:\n${contexto}` : "",
          contextoBase,
        ]
          .filter(Boolean)
          .join("\n\n");


        const responderPelasFontes = (motivo: string) => {
          if (!fontes.suficiente) return null;
          console.warn("ai-chatbot: fallback pelas fontes", motivo);
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
              model: "google/gemini-3.7-flash",
              stream: true,
              messages: [{ role: "system", content: system }, ...messages],
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
              "O serviço de IA está com muitas requisições agora. Aguarde alguns segundos e tente novamente.",
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
        if (upstream.status === 403) {
          return (
            responderPelasFontes("403") ??
            jsonError("O serviço de IA está bloqueado nas configurações do projeto.", 403)
          );
        }
        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error("ai-chatbot upstream error", upstream.status, detail);
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
