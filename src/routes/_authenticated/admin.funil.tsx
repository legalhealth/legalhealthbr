import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasRole } from "@/lib/roles";
import {
  ETAPAS_FUNIL,
  MOTIVOS_LABEL,
  useCandidaturasSalvas,
  useFunil,
  useMotivosAbandono,
  type FunilPeriodo,
  type FunilRota,
} from "@/lib/funil";

const TITLE = "Funil de candidatura | Legal Health";
const DESCRIPTION =
  "Quantas pessoas chegam ao formulário de candidatura e quantas concluem o envio, por período e por página.";

export const Route = createFileRoute("/_authenticated/admin/funil")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

const PERIODOS: FunilPeriodo[] = [7, 30, 90];
const ROTAS: { valor: FunilRota; label: string }[] = [
  { valor: "todas", label: "Todas as páginas" },
  { valor: "/", label: "Landing (/)" },
  { valor: "/embaixadores", label: "/embaixadores" },
];

function pct(parte: number, total: number) {
  if (!total) return "—";
  return `${Math.round((parte / total) * 100)}%`;
}

function Page() {
  const { has: isAdmin, isLoading: loadingRole } = useHasRole("admin");
  const [periodo, setPeriodo] = useState<FunilPeriodo>(30);
  const [rota, setRota] = useState<FunilRota>("todas");

  const { data: etapas, isLoading, isError } = useFunil(periodo, rota);
  const { data: motivos } = useMotivosAbandono(periodo, rota);
  const { data: salvas } = useCandidaturasSalvas(periodo);

  const porEtapa = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const linha of etapas ?? []) mapa.set(linha.etapa, linha.sessoes);
    return mapa;
  }, [etapas]);

  const linhas = ETAPAS_FUNIL.map((etapa, i) => {
    const sessoes = porEtapa.get(etapa.key) ?? 0;
    const anterior = i === 0 ? sessoes : (porEtapa.get(ETAPAS_FUNIL[i - 1]!.key) ?? 0);
    const topo = porEtapa.get(ETAPAS_FUNIL[0]!.key) ?? 0;
    return { ...etapa, sessoes, taxaEtapa: pct(sessoes, anterior), taxaTotal: pct(sessoes, topo) };
  });

  const topo = linhas[0]?.sessoes ?? 0;

  if (loadingRole) {
    return (
      <PageShell title="Funil de candidatura">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell
        title="Funil de candidatura"
        description="Esta área é restrita à equipe administradora da Legal Health."
      />
    );
  }

  return (
    <PageShell
      title="Funil de candidatura"
      description="Quantas pessoas chegam ao formulário e quantas concluem o envio. A medição é anônima: nenhum nome, e-mail ou texto digitado é registrado."
    >
      <div className="mt-8 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p}
            variant={periodo === p ? "default" : "outline"}
            className={
              periodo === p
                ? "gold-gradient h-10 rounded-xl px-4 text-primary-foreground"
                : "h-10 rounded-xl px-4"
            }
            onClick={() => setPeriodo(p)}
          >
            {p} dias
          </Button>
        ))}
        <span className="mx-1 hidden w-px bg-border md:block" aria-hidden="true" />
        {ROTAS.map((r) => (
          <Button
            key={r.valor}
            variant={rota === r.valor ? "secondary" : "outline"}
            className="h-10 rounded-xl px-4"
            onClick={() => setRota(r.valor)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {isError ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          Não foi possível carregar os dados do funil agora. Tente novamente em alguns minutos.
        </p>
      ) : isLoading ? (
        <div className="mt-8 space-y-3" aria-live="polite">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4">
            {linhas.map((linha) => (
              <div key={linha.key} className="glass-card rounded-2xl p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{linha.label}</p>
                  <p className="font-display text-2xl text-foreground">
                    {linha.sessoes}
                    <span className="ml-2 text-xs font-normal text-subtle">
                      {linha.taxaEtapa} da etapa anterior · {linha.taxaTotal} do total
                    </span>
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="gold-gradient h-full rounded-full"
                    style={{ width: topo ? `${Math.round((linha.sessoes / topo) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 glass-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">Candidaturas salvas no período</p>
            <p className="mt-1 font-display text-2xl text-foreground">{salvas ?? 0}</p>
            <p className="mt-2 text-xs text-subtle">
              Use este número para conferir os envios registrados acima.
            </p>
          </div>

          <div className="mt-6 glass-card rounded-2xl p-5">
            <h2 className="font-display text-xl text-foreground">O que bloqueia o envio</h2>
            {(motivos ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum bloqueio de validação registrado neste período.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {(motivos ?? []).map((m) => (
                  <li
                    key={m.motivo}
                    className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0"
                  >
                    <span className="text-muted-foreground">
                      {MOTIVOS_LABEL[m.motivo] ?? m.motivo}
                    </span>
                    <span className="text-foreground">{m.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
