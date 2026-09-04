import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const TTL_MS = 2 * 60 * 1000;

export type StatusPedido = "pending" | "approved" | "denied" | "expired" | "consumed";

export type PedidoCriado = {
  code: string;
  secret: string;
  expiresAt: string;
  url: string;
};

export type ConsultaPedido =
  { status: "pending" | "denied" | "expired" } | { status: "approved"; tokenHash: string };

export type DetalhesPedido = {
  code: string;
  navegador: string;
  criadoEm: string;
  expiraEm: string;
  status: StatusPedido;
};

function randomString(length: number, alphabet: string) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizarCodigo(value: unknown) {
  const code = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (code.length !== CODE_LENGTH) throw new Error("Código inválido.");
  return code;
}

/** Resumo legível do navegador que pediu o acesso (sem dados pessoais). */
function descreverNavegador(ua: string | null | undefined) {
  if (!ua) return "Navegador desconhecido";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : "Navegador";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Linux/.test(ua)
        ? "Linux"
        : /Android/.test(ua)
          ? "Android"
          : /iPhone|iPad/.test(ua)
            ? "iOS"
            : "sistema desconhecido";
  return `${browser} em ${os}`;
}

/** Cria um pedido de entrada por QR-Code (chamado pelo computador, sem login). */
export const criarPedidoLogin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const request = getRequest();
  const ua = request?.headers?.get("user-agent") ?? null;
  const ip =
    request?.headers?.get("cf-connecting-ip") ??
    request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  const secret = randomString(32, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  let code = "";
  let inserido = false;
  for (let tentativa = 0; tentativa < 5 && !inserido; tentativa += 1) {
    code = randomString(CODE_LENGTH, CODE_ALPHABET);
    const { error } = await supabaseAdmin.from("device_login_requests").insert({
      code,
      verifier_hash: await sha256(secret),
      user_agent: ua ? ua.slice(0, 300) : null,
      ip_hash: ip ? await sha256(ip) : null,
      expires_at: expiresAt,
    });
    if (!error) inserido = true;
    else if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  }
  if (!inserido) throw new Error("Não foi possível gerar o código. Tente novamente.");

  // Limpeza oportunista dos pedidos antigos.
  await supabaseAdmin
    .from("device_login_requests")
    .delete()
    .lt("expires_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  const origin = request?.headers?.get("origin") ?? "";
  return {
    code,
    secret,
    expiresAt,
    url: `${origin}/entrar/${code}`,
  } satisfies PedidoCriado;
});

/** O computador consulta se o pedido já foi autorizado; entrega o passe uma única vez. */
export const consultarPedido = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; secret: string }) => ({
    code: normalizarCodigo(input?.code),
    secret: String(input?.secret ?? ""),
  }))
  .handler(async ({ data }): Promise<ConsultaPedido> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pedido } = await supabaseAdmin
      .from("device_login_requests")
      .select("id, verifier_hash, status, session_token_hash, expires_at")
      .eq("code", data.code)
      .maybeSingle();

    if (!pedido) return { status: "expired" };
    if (pedido.verifier_hash !== (await sha256(data.secret))) return { status: "expired" };
    if (pedido.status === "denied") return { status: "denied" };
    if (pedido.status === "consumed") return { status: "expired" };
    if (new Date(pedido.expires_at).getTime() < Date.now() && pedido.status !== "approved") {
      return { status: "expired" };
    }
    if (pedido.status !== "approved" || !pedido.session_token_hash) return { status: "pending" };

    await supabaseAdmin
      .from("device_login_requests")
      .update({ status: "consumed", session_token_hash: null })
      .eq("id", pedido.id);

    return { status: "approved", tokenHash: pedido.session_token_hash };
  });

/** Dados do pedido para a tela de confirmação no celular. */
export const detalhesPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => ({ code: normalizarCodigo(input?.code) }))
  .handler(async ({ data }): Promise<DetalhesPedido> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pedido } = await supabaseAdmin
      .from("device_login_requests")
      .select("code, status, user_agent, created_at, expires_at")
      .eq("code", data.code)
      .maybeSingle();

    if (!pedido) throw new Error("Pedido não encontrado ou já expirado.");
    const expirado = new Date(pedido.expires_at).getTime() < Date.now();
    return {
      code: pedido.code,
      navegador: descreverNavegador(pedido.user_agent),
      criadoEm: pedido.created_at,
      expiraEm: pedido.expires_at,
      status: expirado && pedido.status === "pending" ? "expired" : (pedido.status as StatusPedido),
    };
  });

/** O celular autoriza a entrada no computador. */
export const autorizarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => ({ code: normalizarCodigo(input?.code) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pedido } = await supabaseAdmin
      .from("device_login_requests")
      .select("id, status, expires_at")
      .eq("code", data.code)
      .maybeSingle();

    if (!pedido) throw new Error("Pedido não encontrado.");
    if (pedido.status !== "pending") throw new Error("Este pedido já foi respondido.");
    if (new Date(pedido.expires_at).getTime() < Date.now()) throw new Error("O código expirou.");

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    const email = userData?.user?.email;
    if (userError || !email) throw new Error("Conta sem e-mail para liberar o acesso.");

    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      throw new Error(linkError?.message ?? "Não foi possível liberar o acesso.");
    }

    const { error } = await supabaseAdmin
      .from("device_login_requests")
      .update({
        status: "approved",
        user_id: context.userId,
        session_token_hash: tokenHash,
        approved_at: new Date().toISOString(),
        // O passe vale por pouco tempo depois da autorização.
        expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      })
      .eq("id", pedido.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** O celular recusa a entrada no computador. */
export const recusarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => ({ code: normalizarCodigo(input?.code) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("device_login_requests")
      .update({ status: "denied", session_token_hash: null })
      .eq("code", data.code)
      .eq("status", "pending");
    return { ok: true };
  });
