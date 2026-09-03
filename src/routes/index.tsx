import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { CandidaturaForm } from "@/components/landing/candidatura-form";
import {
  Beneficios,
  ComoFunciona,
  CtaFinal,
  FaqSection,
  Hero,
  Limites,
  Plataforma,
  Problema,
  QuemPode,
  Responsabilidades,
  SerEmbaixador,
  TrustBar,
  Vantagens,
} from "@/components/landing/landing-sections";
import { track } from "@/lib/analytics";

const TITLE = "Legal Health | Programa de Embaixadores para profissionais da saúde";
const DESCRIPTION =
  "Use a Legal Health por três meses, organize os pontos de atenção jurídica da sua prática e participe da evolução da plataforma. Candidatura aberta ao programa piloto.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    track("landing_view", { secao: "home" });
  }, []);

  // Visitante vê a landing; usuário autenticado segue para o painel em /inicio.
  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (ativo && data.session) navigate({ to: "/inicio", replace: true });
    });
    return () => {
      ativo = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <Problema />
        <Plataforma />
        <SerEmbaixador />
        <Vantagens />
        <Beneficios />
        <ComoFunciona />
        <Responsabilidades />
        <QuemPode />
        <Limites />

        <section id="candidatura" className="scroll-mt-20 border-t border-border bg-card/30">
          <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-20">
            <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">Candidatura</p>
            <h2 className="mt-3 font-display text-[1.8rem] leading-tight tracking-tight text-foreground md:text-[2.3rem]">
              Envie seu interesse em ser Embaixador.
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
              Pedimos apenas contato e área de atuação. Não solicitamos CRM, número de conselho,
              dados de pacientes ou documentos sensíveis nesta etapa.
            </p>
            <div className="mt-8">
              <CandidaturaForm />
            </div>
          </div>
        </section>

        <FaqSection />
        <CtaFinal />
      </main>
      <PublicFooter />
    </div>
  );
}
