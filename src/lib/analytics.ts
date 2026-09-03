/**
 * Camada mínima de analytics para a landing pública.
 * Regra: nunca enviar dados pessoais, respostas de candidatura ou dados de saúde.
 * Apenas nomes de eventos e metadados não identificáveis (seção, origem, variante).
 */

export type ConversionEvent =
  | "landing_view"
  | "hero_cta_click"
  | "platform_cta_click"
  | "ambassador_section_view"
  | "application_start"
  | "application_submit"
  | "faq_open"
  | "login_click"
  | "diagnostic_start";

type SafeProps = Record<string, string | number | boolean>;

const ALLOWED_KEYS = new Set(["secao", "origem", "variante", "posicao", "id"]);

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

export function track(event: ConversionEvent, props?: SafeProps) {
  if (typeof window === "undefined") return;
  const payload = { event, ...sanitize(props) };
  const w = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("lh:analytics", { detail: payload }));
}
