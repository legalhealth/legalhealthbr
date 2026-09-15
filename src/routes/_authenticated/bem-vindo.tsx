import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, Check, FileSignature, Mic, ShieldCheck } from "lucide-react";

import monograma from "@/assets/lh-monograma.png.asset.json";
import { markWelcomeSeen, TRILHA, useProgressoTrilha } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/bem-vindo")({
  head: () => ({
    meta: [
      { title: "Boas-vindas | Legal Health" },
      {
        name: "description",
        content: "Primeiros passos para usar a inteligência jurídica do Legal Health.",
      },
      { property: "og:title", content: "Boas-vindas | Legal Health" },
      {
        property: "og:description",
        content: "Primeiros passos para usar a inteligência jurídica do Legal Health.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const ICONES = [Activity, ShieldCheck, Mic, FileSignature];

function Page() {
  const navigate = useNavigate();
  const { data: progresso } = useProgressoTrilha();

  const proximo = progresso?.proximo ?? TRILHA[0]!;
  const comecou = Boolean(progresso && (progresso.juriscore || progresso.riscos));

  function seguir() {
    markWelcomeSeen();
    if (proximo.to === "/biblioteca") {
      void navigate({
        to: "/biblioteca",
        search: { cat: proximo.cat ?? "minutas" },
        replace: true,
      });
      return;
    }
    void navigate({ to: proximo.to, replace: true });
  }

  function depois() {
    markWelcomeSeen();
    void navigate({ to: "/inicio", replace: true });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <div className="text-center">
        <img src={monograma.url} alt="Legal Health" className="mx-auto h-14 w-auto" />
        <h1 className="mt-6 font-display text-3xl font-light text-foreground md:text-4xl">
          Bem-vindo ao Legal Health
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Em quatro passos você sai daqui com o seu nível de risco medido, as prioridades
          definidas, uma triagem por voz gravada e o primeiro documento pronto para revisar.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRILHA.map((passo, index) => {
          const Icon = ICONES[index] ?? Activity;
          const concluido = Boolean(progresso?.[passo.id]);
          return (
            <Card key={passo.id} className="glass-card rounded-2xl shadow-none">
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/30">
                    {concluido ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Icon className="h-4 w-4 text-gold" />
                    )}
                  </span>
                  <span className="text-xs tracking-[0.2em] text-subtle">0{index + 1}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{passo.titulo}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{passo.descricao}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={seguir}
          className="h-11 rounded-xl gold-gradient px-6 font-medium text-primary-foreground shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
        >
          {comecou ? "Continuar de onde parei" : "Começar agora"}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={depois}
          className="h-11 rounded-xl border-border px-6 hover:bg-accent hover:text-accent-foreground"
        >
          <Check className="h-4 w-4" />
          Ir para o início
        </Button>
      </div>

      <p className="mt-8 text-center text-xs tracking-[0.28em] text-subtle">
        ANTECIPE · DECIDA · PROTEJA
      </p>
    </div>
  );
}
