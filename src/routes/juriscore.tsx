import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/juriscore")({
  head: () => ({
    meta: [
      { title: "Juriscore® | Legal Health" },
      { name: "description", content: "Índice de risco jurídico da sua prática médica, atualizado continuamente." },
      { property: "og:title", content: "Juriscore® | Legal Health" },
      { property: "og:description", content: "Índice de risco jurídico da sua prática médica, atualizado continuamente." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageShell title="Juriscore®" description="Índice de risco jurídico da sua prática médica, atualizado continuamente." />;
}
