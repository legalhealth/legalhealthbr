import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { IA_TOOLS } from "@/components/ia/ia-tools";
import { useDiagnosticContext } from "@/lib/diagnostic-context";

export const Route = createFileRoute("/_authenticated/ia/")({
  head: () => ({
    meta: [
      { title: "IA Jurídica | Legal Health" },
      {
        name: "description",
        content:
          "Ferramentas de IA jurídica para médicos: redigir peças, analisar riscos, ler documentos e tirar dúvidas.",
      },
      { property: "og:title", content: "IA Jurídica | Legal Health" },
      {
        property: "og:description",
        content:
          "Ferramentas de IA jurídica para médicos: redigir peças, analisar riscos, ler documentos e tirar dúvidas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: ctx } = useDiagnosticContext();

  return (
    <div className="space-y-8">
      <DiagnosticContextCard
        ctx={ctx}
        note="Esse contexto é aplicado em todas as ferramentas abaixo, sem você repetir informações."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {IA_TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-gold/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
              <tool.icon className="h-5 w-5 text-gold" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground transition-colors group-hover:text-gold-light">
              {tool.label}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs text-gold">
              Abrir <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
