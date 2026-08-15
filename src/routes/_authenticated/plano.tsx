import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({
    meta: [
      { title: "Plano de Proteção | Legal Health" },
      { name: "description", content: "Seu plano de ação jurídica preventiva, com prioridades e prazos." },
      { property: "og:title", content: "Plano de Proteção | Legal Health" },
      { property: "og:description", content: "Seu plano de ação jurídica preventiva, com prioridades e prazos." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageShell title="Plano" description="Seu plano de ação jurídica preventiva, com prioridades e prazos." />;
}
