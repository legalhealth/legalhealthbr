/**
 * Camada mínima de analytics para a landing pública.
 * Regra: nunca enviar dados pessoais, respostas de candidatura ou dados de saúde.
 * Apenas nomes de eventos e metadados não identificáveis (seção, origem, variante).
 */

export type ConversionEvent =
  | "landing_view"
  | "hero_cta_click"
  | "platform_cta_click"
  | "benefits_view"
  | "ambassador_section_view"
  | "application_form_view"
  | "application_start"
  | "application_field_error"
  | "application_submit"
  | "faq_open"
  | "login_click"
  | "diagnostic_cta_click"
  | "diagnostic_start";

type SafeProps = Record<string, string | number | boolean>;

const ALLOWED_KEYS = new Set(["secao", "origem", "variante", "posicao", "id"]);

const STORAGE_KEY = "lh:funnel-session";
const ENDPOINT = "/api/public/landing-event";

/** Remove qualquer chave fora da allowlist e valores longos (possível PII). */
function sanitize(props?: SafeProps): SafeProps {
  if (!props) return {};
  const out: SafeProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value === "string" && (value.length > 40 || value.includes("@"))) continue;
    out[key] = value;
  }
  return out;
}

/** Identificador aleatório, só na sessão do navegador; não identifica a pessoa. */
function sessionKey(): string | null {
  try {
    const existente = sessionStorage.getItem(STORAGE_KEY);
    if (existente) return existente;
    const novo =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(STORAGE_KEY, novo);
    return novo;
  } catch {
    return null;
  }
}

/** Grava a etapa do funil em segundo plano, sem atrasar a interface. */
function persistir(event: ConversionEvent, props: SafeProps) {
  const key = sessionKey();
  if (!key) return;
  const body = JSON.stringify({
    sessionKey: key,
    event,
    rota: window.location.pathname.slice(0, 80),
    ...props,
  });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // medição nunca deve quebrar a página
  }
}

export function track(event: ConversionEvent, props?: SafeProps) {
  if (typeof window === "undefined") return;
  const limpo = sanitize(props);
  const payload = { event, ...limpo };
  const w = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("lh:analytics", { detail: payload }));
  persistir(event, limpo);
}
