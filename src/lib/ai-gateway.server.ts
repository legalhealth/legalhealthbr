import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export const DAILY_LIMIT = 30;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

export function supabaseForToken(token: string) {
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

type GuardOk = {
  ok: true;
  userId: string;
  apiKey: string;
  supabase: ReturnType<typeof supabaseForToken>;
};

/**
 * Valida o JWT do chamador, aplica o limite diário de uso e devolve a chave
 * de IA lida apenas dos secrets do servidor.
 */
export async function guardAiRequest(
  request: Request,
  endpoint: string,
): Promise<GuardOk | { ok: false; response: Response }> {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { ok: false, response: jsonError("Sessão não encontrada. Faça login novamente.", 401) };
  }

  const supabase = supabaseForToken(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const userId = userData?.user?.id;
  if (userError || !userId) {
    return {
      ok: false,
      response: jsonError("Sessão inválida ou expirada. Faça login novamente.", 401),
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (countError) {
    return {
      ok: false,
      response: jsonError("Não foi possível verificar seu limite de uso. Tente novamente.", 500),
    };
  }
  if ((count ?? 0) >= DAILY_LIMIT) {
    return {
      ok: false,
      response: jsonError(
        `Você atingiu o limite de ${DAILY_LIMIT} consultas de IA em 24 horas. O contador é liberado automaticamente conforme as consultas mais antigas completam 24 horas.`,
        429,
      ),
    };
  }

  const apiKey = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return {
      ok: false,
      response: jsonError("Serviço de IA não configurado. Contate o suporte.", 500),
    };
  }

  await supabase.from("ai_usage").insert({ user_id: userId, endpoint });

  return { ok: true, userId, apiKey, supabase };
}

/** Traduz os erros do gateway de IA em mensagens claras em PT-BR. */
export function upstreamError(status: number, endpoint: string, detail = ""): Response {
  if (status === 429) {
    return jsonError(
      "O serviço de IA está com muitas requisições neste momento. Aguarde alguns segundos e tente novamente.",
      429,
    );
  }
  if (status === 402) {
    return jsonError(
      "Os créditos de IA do projeto foram esgotados. Recarregue para continuar.",
      402,
    );
  }
  console.error(`${endpoint} upstream error`, status, detail);
  return jsonError("A IA não conseguiu responder agora. Tente novamente em instantes.", 502);
}

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function gatewayHeaders(apiKey: string) {
  return {
    "content-type": "application/json",
    "Lovable-API-Key": apiKey,
    Authorization: `Bearer ${apiKey}`,
    "X-Lovable-AIG-SDK": "fetch",
  };
}