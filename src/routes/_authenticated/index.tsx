import { createFileRoute } from "@tanstack/react-router";
import { Shield, Scale, MessageSquare, Gavel } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início | Legal Health" },
      {
        name: "description",
        content:
          "Plataforma de inteligência jurídica para médicos e clínicas no Brasil. Antecipe, decida e proteja sua prática.",
      },
      { property: "og:title", content: "Início | Legal Health" },
      {
        property: "og:description",
        content:
          "Plataforma de inteligência jurídica para médicos e clínicas no Brasil. Antecipe, decida e proteja sua prática.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const quickCards = [
  {
    title: "Juriscore®",
    description: "Veja sua pontuação de risco jurídico e ações prioritárias.",
    icon: Shield,
    href: "/juriscore",
  },
  {
    title: "IA Jurídica",
    description: "Converse com o assistente sobre dúvidas e documentos.",
    icon: MessageSquare,
    href: "/ia",
  },
  {
    title: "Biblioteca",
    description: "Acesse modelos, pareceres e normas essenciais.",
    icon: Gavel,
    href: "/biblioteca",
  },
  {
    title: "Plano de Proteção",
    description: "Acompanhe seu plano de ação preventiva e prazos.",
    icon: Scale,
    href: "/plano",
  },
];

function Index() {
  return (
    <PageShell
      title="Início"
      description="Plataforma de inteligência jurídica para médicos e clínicas no Brasil."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickCards.map((card) => (
          <Card
            key={card.title}
            className="group border border-border bg-card rounded-2xl shadow-none transition-colors hover:border-gold/50"
          >
            <CardHeader className="pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
                <card.icon className="h-5 w-5 text-gold" />
              </div>
              <CardTitle className="text-base font-medium text-foreground group-hover:text-gold-light transition-colors">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-lg font-medium text-foreground">Resumo da semana</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhuma atualização crítica identificada. Seu Juriscore® está estável e não há alertas
          pendentes.
        </p>
      </div>
    </PageShell>
  );
}
