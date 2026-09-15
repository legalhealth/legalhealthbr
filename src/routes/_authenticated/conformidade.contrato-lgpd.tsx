import { createFileRoute } from "@tanstack/react-router";

import { DocumentoConformidade } from "@/components/conformidade/documento-conformidade";

const TITLE = "Contrato de Tratamento de Dados (LGPD) | Legal Health";
const DESCRIPTION =
  "Minuta do contrato entre a clínica e a plataforma: papéis, finalidades, segurança, incidentes e encerramento do tratamento.";

export const Route = createFileRoute("/_authenticated/conformidade/contrato-lgpd")({
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
  component: () => <DocumentoConformidade slug="contrato-lgpd" />,
});
