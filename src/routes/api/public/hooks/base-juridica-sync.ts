import { createFileRoute } from "@tanstack/react-router";

/**
 * Rotina automática da base jurídica (pg_cron, semanal).
 *
 * Reconfere todas as fontes oficiais do catálogo, cria nova versão quando o
 * órgão emissor altera o texto (preservando a anterior), marca a norma como
 * revogada/suspensa quando o próprio portal oficial informa isso, registra os
 * alertas em `legal_change_alerts` e avisa os administradores por e-mail.
 *
 * Nenhuma coleta manual é necessária: o disparo vem do cron do banco.
 */
export const Route = createFileRoute("/api/public/hooks/base-juridica-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const segredo = process.env["LEGAL_SYNC_SECRET"];
        const enviado =
          request.headers.get("x-legal-sync-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!segredo || enviado !== segredo) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { ingerirCatalogo, CATALOGO } = await import("@/lib/legal-ingest.server");

        const resultados = await ingerirCatalogo(null, []);

        type Alerta = {
          tipo: "alterada" | "revogada" | "falha";
          title: string;
          number: string | null;
          issuingBody: string | null;
          version: number | null;
          mensagem: string;
          officialUrl: string | null;
          sourceId: string;
        };
        const alertas: Alerta[] = [];

        for (const r of resultados) {
          const fonte = CATALOGO.find((f) => f.sourceId === r.sourceId);
          const comum = {
            title: r.title,
            number: fonte?.number ?? null,
            issuingBody: fonte?.issuingBody ?? null,
            officialUrl: fonte?.officialUrl ?? null,
            sourceId: r.sourceId,
          };

          if (r.revogacao) {
            // O portal oficial informa revogação/suspensão: a norma sai da
            // recuperação vigente da IA até a curadoria confirmar.
            const { data: fonteRow } = await supabaseAdmin
              .from("legal_sources")
              .select("id")
              .eq("source_id", r.sourceId)
              .maybeSingle();

            if (fonteRow?.id) {
              await supabaseAdmin
                .from("legal_sources")
                .update({ status: "revogada", last_checked_at: new Date().toISOString() })
                .eq("id", fonteRow.id);
              await supabaseAdmin
                .from("legal_source_versions")
                .update({ status: "revogada", published: false })
                .eq("source_uuid", fonteRow.id)
                .eq("status", "vigente");
            }

            alertas.push({
              ...comum,
              tipo: "revogada",
              version: r.version,
              mensagem: `O texto oficial indica revogação/suspensão: "${r.revogacao}". A norma foi bloqueada da recuperação vigente e aguarda confirmação da curadoria jurídica.`,
            });
            continue;
          }

          if (r.resultado === "nova_versao" && (r.version ?? 1) > 1) {
            alertas.push({
              ...comum,
              tipo: "alterada",
              version: r.version,
              mensagem: `O órgão emissor alterou o texto oficial. ${r.mensagem} A versão anterior foi preservada no histórico como "alterada".`,
            });
            continue;
          }

          if (r.resultado === "erro") {
            alertas.push({
              ...comum,
              tipo: "falha",
              version: null,
              mensagem: `A conferência automática falhou: ${r.mensagem}`,
            });
          }
        }

        if (alertas.length > 0) {
          await supabaseAdmin.from("legal_change_alerts").insert(
            alertas.map((a) => ({
              source_id: a.sourceId,
              title: a.title,
              tipo: a.tipo,
              version: a.version,
              mensagem: a.mensagem,
              official_url: a.officialUrl,
            })),
          );
        }

        // Aviso aos administradores — mudança de norma exige triagem humana.
        let avisados = 0;
        if (alertas.length > 0) {
          try {
            const { data: admins } = await supabaseAdmin
              .from("user_roles")
              .select("user_id")
              .eq("role", "admin");

            const emails: string[] = [];
            for (const admin of admins ?? []) {
              const { data } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
              const email = data?.user?.email;
              if (email) emails.push(email);
            }

            if (emails.length > 0) {
              const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
              const executadoEm = new Date().toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              });
              for (const email of emails) {
                try {
                  await sendTemplateEmail("base-juridica-alerta", email, {
                    templateData: { executadoEm, alertas },
                    idempotencyKey: `base-juridica-${new Date().toISOString().slice(0, 13)}-${email}`,
                  });
                  avisados += 1;
                } catch (e) {
                  console.error("base-juridica-sync email", (e as Error).message);
                }
              }
              if (avisados > 0) {
                await supabaseAdmin
                  .from("legal_change_alerts")
                  .update({ notified_at: new Date().toISOString() })
                  .is("notified_at", null);
              }
            }
          } catch (e) {
            console.error("base-juridica-sync notify", (e as Error).message);
          }
        }

        return new Response(
          JSON.stringify({
            ok: true,
            fontes: resultados.length,
            novasVersoes: resultados.filter((r) => r.resultado === "nova_versao").length,
            semMudanca: resultados.filter((r) => r.resultado === "sem_mudanca").length,
            alertas: alertas.length,
            avisados,
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
