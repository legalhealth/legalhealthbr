import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { DeferredSection } from "@/components/landing/deferred-section";

// Formulário (selects, checkbox, cliente do banco) sob demanda: o topo da página
// é HTML/CSS estático, o que mantém LCP e TBT baixos no mobile.
const CandidaturaForm = lazy(() =>
  import("@/components/landing/candidatura-form").then((m) => ({ default: m.CandidaturaForm })),
);

const TITLE = "Candidatura ao programa de Embaixadores | Legal Health";
const DESCRIPTION =
  "Envie seu interesse em participar do programa de Embaixadores Legal Health: três meses de experiência com a plataforma de prevenção jurídica na saúde.";

export const Route = createFileRoute("/embaixadores")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmbaixadoresPage,
});

function EmbaixadoresPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">
        <span className="gold-rule mb-6 block" aria-hidden="true" />
        <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
          Candidatura ao programa de Embaixadores
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
          Três meses para conhecer, usar e avaliar a Legal Health. Vagas, recursos liberados e
          condições de continuidade seguem o regulamento do programa piloto.
        </p>
        <DeferredSection
          minHeight="42rem"
          fallback={
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Carregando formulário de candidatura…
            </p>
          }
        >
          <div className="mt-8">
            <CandidaturaForm />
          </div>
        </DeferredSection>
      </main>
      <PublicFooter />
    </div>
  );
}
