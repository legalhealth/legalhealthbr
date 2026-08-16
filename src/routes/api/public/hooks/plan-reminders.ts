import { createFileRoute } from "@tanstack/react-router";

/**
 * Rotina diária (pg_cron, 09:00 UTC): dispara lembretes das prioridades do
 * Plano de Ação com prazo vencendo em 7 e em 1 dia.
 *
 * Entrega in-app hoje (aparecem no Dashboard e na página Plano). Quando um
 * domínio de e-mail for configurado no projeto, basta enviar o e-mail no ponto
 * marcado abaixo — o restante da lógica (agenda, dedupe, respeito às
 * preferências do perfil) já está pronto.
 */
export const Route = createFileRoute("/api/public/hooks/plan-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayISO = today.toISOString().slice(0, 10);

        const { data: pending, error } = await supabaseAdmin
          .from("plan_reminders")
          .select("id, user_id, plan_id, priority_index, titulo, due_date, offset_days")
          .is("sent_at", null)
          .gte("due_date", todayISO)
          .limit(500);

        if (error) {
          console.error("plan-reminders query error", error.message);
          return new Response(JSON.stringify({ error: "query_failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const due = (pending ?? []).filter((reminder) => {
          const dueTime = new Date(`${reminder.due_date}T00:00:00Z`).getTime();
          const daysLeft = Math.round((dueTime - today.getTime()) / 86_400_000);
          return daysLeft <= reminder.offset_days;
        });

        let notified = 0;
        let skipped = 0;

        for (const reminder of due) {
          // Não incomoda quem já concluiu todas as ações da prioridade.
          const { data: planRow } = await supabaseAdmin
            .from("action_plans")
            .select("prioridades, status")
            .eq("id", reminder.plan_id)
            .maybeSingle();

          const prioridades = Array.isArray(planRow?.prioridades) ? planRow.prioridades : [];
          const prioridade = prioridades[reminder.priority_index] as
            | Record<string, unknown>
            | undefined;
          const acoes = Array.isArray(prioridade?.['acoes']) ? prioridade['acoes'] : [];

          const { data: doneItems } = await supabaseAdmin
            .from("action_items_done")
            .select("item_key, done")
            .eq("plan_id", reminder.plan_id);
          const doneCount = (doneItems ?? []).filter(
            (item) =>
              item.done && item.item_key.startsWith(`p${reminder.priority_index}-a`),
          ).length;

          const concluida = acoes.length > 0 && doneCount >= acoes.length;
          const arquivado = planRow?.status !== "ativo";

          if (concluida || arquivado) {
            await supabaseAdmin
              .from("plan_reminders")
              .update({ sent_at: new Date().toISOString(), channel: "dispensado" })
              .eq("id", reminder.id);
            skipped += 1;
            continue;
          }

          // Preferências de notificação do usuário.
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email_alerts, push")
            .eq("user_id", reminder.user_id)
            .maybeSingle();

          const channel = profile?.email_alerts ? "email" : profile?.push ? "push" : "app";

          // TODO(e-mail): com domínio de e-mail configurado, enviar aqui a
          // notificação de prazo antes de marcar como enviada.

          await supabaseAdmin
            .from("plan_reminders")
            .update({ sent_at: new Date().toISOString(), channel })
            .eq("id", reminder.id);
          notified += 1;
        }

        return new Response(
          JSON.stringify({ ok: true, checked: (pending ?? []).length, notified, skipped }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});