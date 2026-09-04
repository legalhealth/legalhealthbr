import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/layout/page-shell";
import { RelatorioCandidaturas } from "@/components/admin/relatorio-candidaturas";
import { RelatorioChatbot } from "@/components/admin/relatorio-chatbot";
import { RelatorioJuriscore } from "@/components/admin/relatorio-juriscore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PERIODOS, useCandidaturas, useRelatorioChatbot, useRelatorioJuriscore, type PeriodoDias } from "@/lib/admin-relatorios";
import { useFunil } from "@/lib/funil";
import { useHasRole } from "@/lib/roles";

const TITLE = "Painel do time | Legal Health";
const DESCRIPTION =
  "Relatórios do programa Legal Health: candidaturas de Embaixadores, uso do chatbot e resultados do Juriscore.";

export const Route = createFileRoute("/_authenticated/admin/")({
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

type Aba = "visao" | "candidaturas" | "chatbot" | "juriscore";

const ABAS: { valor: Aba; label: string }[] = [
  { valor: "visao", label: "Visão geral" },
  { valor: "candidaturas", label: "Candidaturas" },
  { valor: "chatbot", label: "Chatbot" },
  { valor: "juriscore", label: "Juriscore®" },
];

function VisaoGeral({ dias }: { dias: PeriodoDias }) {
  const { data: candidaturas } = useCandidaturas(dias);
  const { data: chatbot } = useRelatorioChatbot(dias);
  const { data: juriscore } = useRelatorioJuriscore(dias);
  const { data: funil } = useFunil(dias, "todas");

  const chegaramFormulario =
    funil?.find((e) => e.etapa === "application_form_view")?.sessoes ?? 0;

  const cartoes = [
    { label: "Candidaturas recebidas", valor: candidaturas?.length ?? 0 },
    { label: "Chegaram ao formulário", valor: chegaramFormulario },
    { label: "Conversas no chatbot", valor: chatbot?.conversas ?? 0 },
    { label: "Diagnósticos Juriscore®", valor: juriscore?.diagnosticos ?? 0 },
    { label: "Score médio", valor: juriscore?.scoreMedio ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartoes.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-lg text-foreground">Outros relatórios</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-10 rounded-xl px-4">
            <Link to="/admin/funil">Funil da landing</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl px-4">
            <Link to="/admin/fontes">Base jurídica</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const { has: isAdmin, isLoading } = useHasRole("admin");
  const [dias, setDias] = useState<PeriodoDias>(30);
  const [aba, setAba] = useState<Aba>("visao");

  if (isLoading) {
    return (
      <PageShell title="Painel do time">
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell
        title="Painel do time"
        description="Esta área é restrita à equipe administradora da Legal Health."
      />
    );
  }

  return (
    <PageShell
      title="Painel do time"
      description="Acompanhe o programa: candidaturas de Embaixadores, uso do chatbot e resultados do Juriscore®. As conversas e as respostas individuais de diagnóstico não são exibidas."
    >
      <div className="mt-8 flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p}
            variant={dias === p ? "default" : "outline"}
            className={
              dias === p
                ? "gold-gradient h-10 rounded-xl px-4 text-primary-foreground"
                : "h-10 rounded-xl px-4"
            }
            onClick={() => setDias(p)}
          >
            {p} dias
          </Button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Relatórios">
        {ABAS.map((a) => (
          <Button
            key={a.valor}
            role="tab"
            aria-selected={aba === a.valor}
            variant={aba === a.valor ? "secondary" : "outline"}
            className="h-10 rounded-xl px-4"
            onClick={() => setAba(a.valor)}
          >
            {a.label}
          </Button>
        ))}
      </div>

      <div className="mt-8">
        {aba === "visao" ? <VisaoGeral dias={dias} /> : null}
        {aba === "candidaturas" ? <RelatorioCandidaturas dias={dias} /> : null}
        {aba === "chatbot" ? <RelatorioChatbot dias={dias} /> : null}
        {aba === "juriscore" ? <RelatorioJuriscore dias={dias} /> : null}
      </div>
    </PageShell>
  );
}
