import { Link } from "@tanstack/react-router";
import { ArrowRight, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, type DiagnosticContext } from "@/lib/diagnostic-context";
import { pillarTextClass } from "@/lib/juriscore";

export function DiagnosticContextCard({
  ctx,
  note,
}: {
  ctx: DiagnosticContext | undefined;
  note: string;
}) {
  if (!ctx || !ctx.hasDiagnostic) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-info/40 bg-info/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Gauge className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div>
            <p className="text-sm font-medium text-info">Sem contexto de diagnóstico</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Faça o Juriscore® para que esta ferramenta use seus pilares mais frágeis
              automaticamente.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 border-info/40 bg-transparent text-info hover:bg-info/10"
        >
          <Link to="/juriscore">Fazer diagnóstico</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-serif text-3xl leading-none" style={{ color: ctx.level?.color }}>
              {ctx.score}
            </p>
            <p className="mt-1 text-[0.6rem] tracking-[0.2em] text-subtle">DE 100</p>
          </div>
          <div>
            <p className="text-[0.7rem] tracking-[0.2em] text-subtle uppercase">
              Contexto do diagnóstico
            </p>
            <p className="mt-1 text-sm text-foreground">
              Nível <span style={{ color: ctx.level?.color }}>{ctx.level?.name}</span>
              {ctx.createdAt ? ` · ${formatDate(ctx.createdAt)}` : ""}
            </p>
          </div>
        </div>
        <Link
          to="/juriscore"
          className="inline-flex items-center gap-2 text-xs text-gold transition-colors hover:text-gold-light"
        >
          Ver diagnóstico completo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ctx.weakest.map((pillar) => (
          <span
            key={pillar.id}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
          >
            {pillar.name}{" "}
            <span className={pillarTextClass(pillar.percent)}>{pillar.percent}%</span>
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-subtle">{note}</p>
    </div>
  );
}
