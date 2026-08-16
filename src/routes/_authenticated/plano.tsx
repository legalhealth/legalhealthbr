import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  Check,
  ClipboardList,
  Clock,
  GitCompareArrows,
  History,
  RefreshCw,
  Scale,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  daysUntil,
  diffPlans,
  itemKey,
  riscoMeta,
  useGeneratePlan,
  usePlanReminders,
  usePlanState,
  usePlanVersions,
  useToggleActionItem,
  type ActionPlan,
} from "@/lib/plano";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({
    meta: [
      { title: "Plano de Ação | Legal Health" },
      {
        name: "description",
        content:
          "Plano de ação preventivo gerado por IA a partir do seu Juriscore®, com prioridades, prazos e ações executáveis.",
      },
      { property: "og:title", content: "Plano de Ação | Legal Health" },
      {
        property: "og:description",
        content:
          "Plano de ação preventivo gerado por IA a partir do seu Juriscore®, com prioridades, prazos e ações executáveis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data, isLoading } = usePlanState();
  const { data: versions } = usePlanVersions();
  const { data: reminders } = usePlanReminders();
  const generate = useGeneratePlan();
  const toggleItem = useToggleActionItem();
  const [compareWith, setCompareWith] = useState<ActionPlan | null>(null);

  const doneSet = useMemo(() => new Set(data?.doneKeys ?? []), [data?.doneKeys]);
  const plan = data?.plan ?? null;

  const totals = useMemo(() => {
    if (!plan) return { total: 0, done: 0, percent: 0 };
    let total = 0;
    let done = 0;
    plan.prioridades.forEach((prioridade, pIndex) => {
      prioridade.acoes.forEach((_, aIndex) => {
        total += 1;
        if (doneSet.has(itemKey(pIndex, aIndex))) done += 1;
      });
    });
    return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [plan, doneSet]);

  const header = (
    <header className="space-y-3">
      <p className="text-[0.7rem] tracking-[0.22em] text-subtle uppercase">Plano de Proteção</p>
      <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
        Plano de ação
      </h1>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Prioridades preventivas geradas por IA a partir dos pilares do seu Juriscore®.
      </p>
    </header>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
        {header}
        <div className="mt-8 space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Sem diagnóstico: o plano nasce do Juriscore®.
  if (!data?.hasDiagnostic) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
        {header}
        <section className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gold/10">
            <ClipboardList className="h-5 w-5 text-gold" />
          </span>
          <h2 className="mt-5 font-serif text-xl text-foreground">
            Seu Plano de Ação vem do Juriscore®
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            O Plano de Ação é gerado a partir do seu diagnóstico Juriscore®: são os cinco pilares
            de conformidade que definem quais riscos precisam de atenção primeiro. Sem o
            diagnóstico, não há como priorizar.
          </p>
          <Button asChild className="mt-6 bg-gold text-background hover:bg-gold-light">
            <Link to="/juriscore">Descobrir meu Juriscore®</Link>
          </Button>
        </section>
      </div>
    );
  }

  const isGenerating = generate.isPending;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      {header}

      {!plan ? (
        <section className="mt-8 rounded-2xl border border-gold/30 bg-card p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gold/40 bg-gold/10">
            <Sparkles className="h-5 w-5 text-gold" />
          </span>
          <h2 className="mt-5 font-serif text-xl text-foreground">
            Gerar seu plano preventivo
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Score atual: {data.score}/100. A IA vai priorizar os pilares com menor conformidade e
            montar de 4 a 6 frentes de ação com prazos.
          </p>
          <Button
            className="mt-6 bg-gold text-background hover:bg-gold-light"
            disabled={isGenerating || !data.resultId}
            onClick={() =>
              data.resultId &&
              generate.mutate(data.resultId, {
                onSuccess: () => toast.success("Plano de ação gerado."),
                onError: (error) =>
                  toast.error(error instanceof Error ? error.message : "Não foi possível gerar."),
              })
            }
          >
            {isGenerating ? "Gerando plano..." : "Gerar plano de ação"}
          </Button>
        </section>
      ) : (
        <>
          {/* Diagnóstico executivo */}
          <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/[0.06] p-6">
            <p className="text-[0.7rem] tracking-[0.18em] text-gold uppercase">
              Diagnóstico executivo
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{plan.resumo}</p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {totals.done}/{totals.total} pendências concluídas ({totals.percent}%)
                </span>
                <span className="text-subtle">
                  Gerado em {new Date(plan.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-500"
                  style={{ width: `${totals.percent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Prioridades */}
          <ul className="mt-6 space-y-4">
            {plan.prioridades.map((prioridade, pIndex) => {
              const meta = riscoMeta(prioridade.risco);
              return (
                <li
                  key={`${prioridade.titulo}-${pIndex}`}
                  className="rounded-2xl border border-border bg-card p-5 md:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-serif text-sm text-gold">
                      {pIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-lg leading-snug text-foreground">
                        {prioridade.titulo}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <span className={`rounded-full border px-2.5 py-0.5 ${meta.className}`}>
                          {meta.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {prioridade.prazo}
                        </span>
                        <span className="text-subtle">Pilar {prioridade.pilar}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {prioridade.acoes.map((acao, aIndex) => {
                      const key = itemKey(pIndex, aIndex);
                      const done = doneSet.has(key);
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            aria-pressed={done}
                            onClick={() =>
                              toggleItem.mutate(
                                { planId: plan.id, key, done: !done },
                                {
                                  onError: () =>
                                    toast.error("Não foi possível salvar a marcação."),
                                },
                              )
                            }
                            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors ${
                              done
                                ? "border-success/40 bg-success/10 text-muted-foreground"
                                : "border-border bg-muted/20 text-foreground hover:border-gold/50"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border ${
                                done
                                  ? "border-success bg-success text-background"
                                  : "border-border bg-transparent"
                              }`}
                            >
                              {done ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className={done ? "line-through" : ""}>{acao}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-subtle">
              Ao regenerar, o plano é substituído e as marcações são zeradas.
            </p>
            <Button
              variant="outline"
              className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
              disabled={isGenerating || !data.resultId}
              onClick={() =>
                data.resultId &&
                generate.mutate(data.resultId, {
                  onSuccess: () => toast.success("Plano regenerado."),
                  onError: (error) =>
                    toast.error(error instanceof Error ? error.message : "Não foi possível gerar."),
                })
              }
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Regenerando..." : "Regenerar plano"}
            </Button>
          </div>
        </>
      )}

      <p className="mt-8 text-xs leading-relaxed text-subtle">
        ⚠️ Plano preventivo gerado por IA — não substitui parecer jurídico individualizado.
      </p>
    </div>
  );
}
