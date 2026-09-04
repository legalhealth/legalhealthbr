import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/** Eventos aceitos (mesma lista do CHECK da tabela). */
const EVENTOS = [
  "landing_view",
  "hero_cta_click",
  "platform_cta_click",
  "benefits_view",
  "ambassador_section_view",
  "application_form_view",
  "application_start",
  "application_field_error",
  "application_submit",
  "faq_open",
  "login_click",
  "diagnostic_cta_click",
  "diagnostic_start",
] as const;

/** Eventos por sessão na última hora (proteção simples contra abuso). */
const SESSION_HOURLY_LIMIT = 120;

const rotulo = z.string().trim().max(40).optional();

const bodySchema = z.object({
  sessionKey: z.string().min(8).max(64),
  event: z.enum(EVENTOS),
  rota: z.string().trim().max(80).optional(),
  secao: rotulo,
  origem: rotulo,
  posicao: rotulo,
  id: rotulo,
  variante: rotulo,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Nunca devolve dados: apenas 204, mesmo em erro, para não virar canal de leitura. */
const semConteudo = () => new Response(null, { status: 204, headers: corsHeaders });

export const Route = createFileRoute("/api/public/landing-event")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return semConteudo();
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { count } = await supabaseAdmin
            .from("landing_events")
            .select("id", { count: "exact", head: true })
            .eq("session_key", parsed.sessionKey)
            .gte("created_at", since);

          if ((count ?? 0) >= SESSION_HOURLY_LIMIT) return semConteudo();

          await supabaseAdmin.from("landing_events").insert({
            session_key: parsed.sessionKey,
            event: parsed.event,
            rota: parsed.rota ?? null,
            secao: parsed.secao ?? null,
            origem: parsed.origem ?? null,
            posicao: parsed.posicao ?? null,
            id_ref: parsed.id ?? null,
            variante: parsed.variante ?? null,
          });
        } catch (erro) {
          console.error("landing-event error", erro);
        }

        return semConteudo();
      },
    },
  },
});
