import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Activity, ShieldCheck, Library, ArrowRight, Check } from "lucide-react";

import monograma from "@/assets/lh-monograma.png.asset.json";
import { markWelcomeSeen } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/bem-vindo")({
  head: () => ({
    meta: [
      { title: "Boas-vindas | Legal Health" },
      { name: "description", content: "Primeiros passos para usar a inteligência jurídica do Legal Health." },
      { property: "og:title", content: "Boas-vindas | Legal Health" },
      { property: "og:description", content: "Primeiros passos para usar a inteligência jurídica do Legal Health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const steps = [
  {
    icon: Activity,
    title: "Calcule seu Juriscore®",
    description: "Responda os critérios do painel e descubra o nível de risco jurídico da sua prática.",
  },
  {
    icon: Sparkles,
    title: "Converse com a IA jurídica",
    description: "Tire dúvidas sobre contratos, consentimento e jurisprudência médica em linguagem simples.",
  },
  {
    icon: ShieldCheck,
    title: "Siga seu plano de ação",
    description: "Receba prioridades objetivas para reduzir riscos e acompanhe o que já foi concluído.",
  },
  {
    icon: Library,
    title: "Use a Biblioteca",
    description: "Modelos, pareceres e normas do CFM, CREMESP e LGPD prontos para adaptar.",
  },
];

function Page() {
  const navigate = useNavigate();

  const finish = (to: "/inicio" | "/juriscore") => {
    markWelcomeSeen();
    navigate({ to, replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <div className="text-center">
        <img src={monograma.url} alt="Legal Health" className="mx-auto h-14 w-auto" />
        <h1 className="mt-6 font-display text-3xl font-light text-foreground md:text-4xl">
          Bem-vindo ao Legal Health
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Sua central de inteligência jurídica para saúde. Em poucos minutos você entende seus riscos e recebe
          orientações práticas. Veja como aproveitar a plataforma.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <Card key={title} className="glass-card rounded-2xl shadow-none">
            <CardContent className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <Icon className="h-4 w-4 text-gold" />
                </span>
                <span className="text-xs tracking-[0.2em] text-subtle">0{index + 1}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={() => finish("/juriscore")}
          className="h-11 rounded-xl gold-gradient px-6 font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
        >
          Começar pelo Juriscore®
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => finish("/inicio")}
          className="h-11 rounded-xl border-border px-6 hover:bg-accent hover:text-accent-foreground"
        >
          <Check className="h-4 w-4" />
          Ir para o início
        </Button>
      </div>

      <p className="mt-8 text-center text-xs tracking-[0.28em] text-subtle">ANTECIPE · DECIDA · PROTEJA</p>
    </div>
  );
}
