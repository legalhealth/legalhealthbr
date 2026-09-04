import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useRelatorioJuriscore, type PeriodoDias } from "@/lib/admin-relatorios";
import { PILLARS } from "@/lib/juriscore";

const PILAR_LABEL = new Map(PILLARS.map((p) => [p.id, p.short]));

export function RelatorioJuriscore({ dias }: { dias: PeriodoDias }) {
  const { data, isLoading, isError } = useRelatorioJuriscore(dias);

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar os dados do Juriscore agora.
      </p>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const cartoes = [
    { label: "Diagnósticos concluídos", valor: data.diagnosticos },
    { label: "Score médio", valor: data.scoreMedio },
    { label: "Planos de ação gerados", valor: data.planosGerados },
    { label: "Ações concluídas", valor: data.itensConcluidos },
  ];

  const radar = data.porPilar.map((p) => ({
    pilar: PILAR_LABEL.get(p.pilar) ?? p.pilar,
    media: p.media,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-lg text-foreground">Distribuição por faixa</h3>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.porFaixa}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="faixa" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                  }}
                />
                <Bar dataKey="total" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-lg text-foreground">Média por pilar</h3>
          <p className="mt-1 text-xs text-subtle">Quanto menor, maior a exposição do grupo.</p>
          <div className="mt-4 h-56 w-full">
            {radar.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem diagnósticos no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="75%">
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="pilar" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Radar
                    dataKey="media"
                    stroke="var(--color-gold)"
                    fill="var(--color-gold)"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-lg text-foreground">Diagnósticos por dia</h3>
        <div className="mt-4 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.porDia}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="dia"
                tickFormatter={(v: string) => v.slice(8, 10) + "/" + v.slice(5, 7)}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
              />
              <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="total" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
