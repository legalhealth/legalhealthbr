import { createFileRoute } from "@tanstack/react-router";

import { DocumentoConformidade } from "@/components/conformidade/documento-conformidade";

const TITLE = "Política de Retenção de Dados | Legal Health";
const DESCRIPTION =
  "O que a plataforma guarda, por quanto tempo, quem acessa e como apagar definitivamente os dados de um paciente.";

export const Route = createFileRoute("/_authenticated/conformidade/retencao")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <DocumentoConformidade slug="retencao" />,
});
