import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

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

export type PlanoLimite = {
  slug: string;
  nome: string;
  /** Consultas de IA por janela de 24h; null = sem teto (Enterprise). */
  limiteIaDia: number | null;
  triagemVoz: boolean;
};

const PLANO_FALLBACK: PlanoLimite = {
  slug: "free",
  nome: "Gratuito",
  limiteIaDia: 5,
  triagemVoz: false,
};

type SupabaseToken = ReturnType<typeof createClient<Database>>;

/** Lê o plano do usuário e os limites associados; em caso de erro, cai no menor plano. */
export async function limiteDoPlano(supabase: SupabaseToken, userId: string): Promise<PlanoLimite> {
  try {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("plano")
      .eq("user_id", userId)
      .maybeSingle();
    const slug = perfil?.plano || "free";
    const { data: limite } = await supabase
      .from("plan_limits")
      .select("slug, nome, limite_ia_dia, triagem_voz")
      .eq("slug", slug)
      .maybeSingle();
    if (!limite) return { ...PLANO_FALLBACK, slug };
    return {
      slug: limite.slug,
      nome: limite.nome,
      limiteIaDia: limite.limite_ia_dia,
      triagemVoz: limite.triagem_voz,
    };
  } catch {
    return PLANO_FALLBACK;
  }
}

/** Mensagem de bloqueio por limite diário, indicando o plano e o próximo degrau. */
export function mensagemLimiteDiario(plano: PlanoLimite): string {
  const base = `Você atingiu o limite de ${plano.limiteIaDia} consultas de IA em 24 horas do plano ${plano.nome}. O contador é liberado automaticamente conforme as consultas mais antigas completam 24 horas.`;
  const proximo =
    plano.slug === "free"
      ? " No Essential são 40 consultas por dia."
      : plano.slug === "essential"
        ? " No Professional são 150 consultas por dia."
        : "";
  return `${base}${proximo} Veja os planos em Perfil › Assinatura.`;
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
  options?: { registrarUso?: boolean; recurso?: "triagem_voz" },
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

  const plano = await limiteDoPlano(supabase, userId);

  if (options?.recurso === "triagem_voz" && !plano.triagemVoz) {
    return {
      ok: false,
      response: jsonError(
        `A triagem por voz está disponível a partir do plano Essential. Veja os planos em Perfil › Assinatura.`,
        403,
      ),
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
  if (plano.limiteIaDia !== null && (count ?? 0) >= plano.limiteIaDia) {
    return { ok: false, response: jsonError(mensagemLimiteDiario(plano), 429) };
  }

  const apiKey = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return {
      ok: false,
      response: jsonError("Serviço de IA não configurado. Contate o suporte.", 500),
    };
  }

  // Janelas de transcrição ao vivo são muitas por atendimento: elas respeitam o
  // limite diário, mas não consomem uma consulta cada.
  if (options?.registrarUso !== false) {
    await supabase.from("ai_usage").insert({ user_id: userId, endpoint });
  }

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
