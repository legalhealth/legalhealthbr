import { createFileRoute } from "@tanstack/react-router";

import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { CandidaturaForm } from "@/components/landing/candidatura-form";

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
        <div className="mt-8">
          <CandidaturaForm />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
