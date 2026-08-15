import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Legal Health | Inteligência Jurídica para Medicina" },
      {
        name: "description",
        content:
          "Plataforma de inteligência jurídica para médicos e clínicas no Brasil. Antecipe, decida e proteja sua prática.",
      },
      { property: "og:title", content: "Legal Health | Inteligência Jurídica para Medicina" },
      {
        property: "og:description",
        content:
          "Plataforma de inteligência jurídica para médicos e clínicas no Brasil. Antecipe, decida e proteja sua prática.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell
      title="Início"
      description="Plataforma de inteligência jurídica para médicos e clínicas no Brasil."
    />
  );
}
