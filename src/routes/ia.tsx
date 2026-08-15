import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "IA Jurídica | Legal Health" },
      { name: "description", content: "Assistente de inteligência jurídica para médicos e clínicas no Brasil." },
      { property: "og:title", content: "IA Jurídica | Legal Health" },
      { property: "og:description", content: "Assistente de inteligência jurídica para médicos e clínicas no Brasil." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageShell title="IA" description="Assistente de inteligência jurídica para médicos e clínicas no Brasil." />;
}
