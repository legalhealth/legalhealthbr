import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { PILLARS } from "@/lib/juriscore";

const DAILY_LIMIT = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RISCOS = ["alto", "medio", "baixo"];
const PILAR_NAMES = PILLARS.map((p) => p.name);

type Prioridade = {
  titulo: string;
  pilar: string;
  risco: string;
  prazo: string;
  acoes: string[];
};

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

function jsonError(message: string, status: number) {
  return jsonResponse({ error: message }, status);
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

/** Valida a estrutura devolvida pela IA antes de qualquer gravação. */
function validatePlan(raw: string): { resumo: string; prioridades: Prioridade[] } | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;
  const resumo = typeof obj["resumo"] === "string" ? obj["resumo"].trim() : "";
  const list = Array.isArray(obj["prioridades"]) ? obj["prioridades"] : [];
  if (!resumo || list.length === 0) return null;

  const prioridades: Prioridade[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const titulo = typeof item["titulo"] === "string" ? item["titulo"].trim() : "";
    const acoes = Array.isArray(item["acoes"])
      ? item["acoes"].filter((a): a is string => typeof a === "string" && a.trim().length > 0)
      : [];
    if (!titulo || acoes.length === 0) continue;
    const pilar = typeof item["pilar"] === "string" ? item["pilar"].trim() : "";
    const risco = typeof item["risco"] === "string" ? item["risco"].trim().toLowerCase() : "";
    prioridades.push({
      titulo: titulo.slice(0, 160),
      pilar: PILAR_NAMES.includes(pilar) ? pilar : "Documental",
      risco: RISCOS.includes(risco) ? risco : "medio",
      prazo: typeof item["prazo"] === "string" && item["prazo"].trim() ? item["prazo"].trim() : "30 dias",
      acoes: acoes.slice(0, 6).map((a) => a.trim().slice(0, 400)),
    });
  }

  if (prioridades.length < 3) return null;
  return { resumo: resumo.slice(0, 1000), prioridades: prioridades.slice(0, 6) };
}

export const Route = createFileRoute("/api/ai-plano")({
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

        let body: { resultId?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonError("Requisição inválida.", 400);
        }

        const resultQuery = supabase
          .from("juriscore_results")
          .select("id, score, by_pillar")
          .eq("user_id", userId);
        const { data: result, error: resultError } =
          typeof body.resultId === "string"
            ? await resultQuery.eq("id", body.resultId).maybeSingle()
            : await resultQuery.order("created_at", { ascending: false }).limit(1).maybeSingle();

        if (resultError) return jsonError("Não foi possível ler seu diagnóstico.", 500);
        if (!result) {
          return jsonError("Faça o diagnóstico Juriscore® antes de gerar o plano.", 400);
        }

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabase
          .from("ai_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since);
        if (countError) {
          return jsonError("Não foi possível verificar seu limite de uso. Tente novamente.", 500);
        }
        if ((count ?? 0) >= DAILY_LIMIT) {
          return jsonError(
            `Você atingiu o limite de ${DAILY_LIMIT} consultas de IA em 24 horas. Tente novamente mais tarde.`,
            429,
          );
        }

        const apiKey = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
        if (!apiKey) return jsonError("Serviço de IA não configurado. Contate o suporte.", 500);

        const byPillar = (result.by_pillar ?? {}) as Record<string, unknown>;
        const pillarLines = PILLARS.map((pillar) => {
          const percent = Number(byPillar[pillar.id] ?? 0);
          return `- ${pillar.name} (${pillar.subtitle}): ${Number.isFinite(percent) ? Math.round(percent) : 0}% de conformidade`;
        }).join("\n");

        const prompt = `Diagnóstico Juriscore® (Legal Health Index) de um profissional/clínica de medicina no Brasil — score total ${result.score}/100, medido em 5 pilares:

${pillarLines}

Gere um Plano de Ação preventivo priorizando os pilares com menor conformidade. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois, no formato:

{"resumo": "diagnóstico executivo em 2 frases", "prioridades": [{"titulo": "...", "pilar": "Documental|Regulatório|Operacional|Histórico|Contextual", "risco": "alto|medio|baixo", "prazo": "ex: 15 dias", "acoes": ["ação prática 1", "ação prática 2", "ação prática 3"]}]}

Inclua de 4 a 6 prioridades, das mais urgentes às de manutenção. Ações devem ser concretas e executáveis por um gestor de clínica.`;

        await supabase.from("ai_usage").insert({ user_id: userId, endpoint: "ai-plano" });

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
              messages: [
                {
                  role: "system",
                  content:
                    "Você é a Legal Health AI, especialista em Direito Médico brasileiro e gestão de risco de clínicas. Responda apenas com JSON válido quando solicitado.",
                },
                { role: "user", content: prompt },
              ],
            }),
          });
        } catch {
          return jsonError("Falha de rede ao consultar a IA. Tente novamente.", 502);
        }

        if (upstream.status === 429) {
          return jsonError("O serviço de IA está sobrecarregado. Tente em alguns segundos.", 429);
        }
        if (upstream.status === 402) {
          return jsonError("Os créditos de IA do projeto foram esgotados.", 402);
        }
        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error("ai-plano upstream error", upstream.status, detail);
          return jsonError("A IA não conseguiu gerar o plano agora. Tente novamente.", 502);
        }

        const payload = (await upstream.json().catch(() => null)) as
          | { choices?: { message?: { content?: string } }[] }
          | null;
        const content = payload?.choices?.[0]?.message?.content ?? "";
        const plan = validatePlan(content);
        if (!plan) {
          return jsonError("A IA devolveu um plano inválido. Tente gerar novamente.", 502);
        }

        // Regenerar substitui o plano anterior e zera as marcações (cascata em action_items_done).
        await supabase.from("action_plans").delete().eq("user_id", userId);

        const { data: inserted, error: insertError } = await supabase
          .from("action_plans")
          .insert({
            user_id: userId,
            result_id: result.id,
            resumo: plan.resumo,
            prioridades: plan.prioridades,
          })
          .select("id")
          .single();

        if (insertError || !inserted) {
          return jsonError("Plano gerado, mas não foi possível salvar. Tente novamente.", 500);
        }

        return jsonResponse({ id: inserted.id, ...plan }, 200);
      },
    },
  },
});
