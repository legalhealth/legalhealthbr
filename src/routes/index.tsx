import { lazy, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { Hero, TrustBar } from "@/components/landing/landing-hero";
import { DeferredSection } from "@/components/landing/deferred-section";
import { track } from "@/lib/analytics";
import {
  ORG_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  abs,
  jsonLdScript,
  webPageLd,
} from "@/lib/seo";

// Seções abaixo da dobra (inclui formulário, accordion e selects) em chunk próprio.
const LandingBelowFold = lazy(() => import("@/components/landing/landing-below-fold"));

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
      { property: "og:url", content: abs("/") },
    ],
    links: [{ rel: "canonical", href: abs("/") }],
    scripts: [
      jsonLdScript([
        webPageLd({ path: "/", name: TITLE, description: DESCRIPTION }),
        {
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}/#aplicativo`,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          description: SITE_DESCRIPTION,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "pt-BR",
          provider: { "@id": ORG_ID },
          audience: {
            "@type": "Audience",
            audienceType: "Profissionais e clínicas de saúde no Brasil",
            geographicArea: { "@type": "Country", name: "Brasil" },
          },
        },
      ]),
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
  // O cliente de autenticação entra por import dinâmico para não pesar no LCP.
  useEffect(() => {
    let ativo = true;
    void import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.auth.getSession().then(({ data }) => {
        if (ativo && data.session) navigate({ to: "/inicio", replace: true });
      }),
    );
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
        <DeferredSection minHeight="120rem">
          <LandingBelowFold />
        </DeferredSection>
      </main>
      <PublicFooter />
    </div>
  );
}
