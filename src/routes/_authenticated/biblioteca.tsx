import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca | Legal Health" },
      { name: "description", content: "Modelos, pareceres e normas essenciais para a prática médica." },
      { property: "og:title", content: "Biblioteca | Legal Health" },
      { property: "og:description", content: "Modelos, pareceres e normas essenciais para a prática médica." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageShell title="Biblioteca" description="Modelos, pareceres e normas essenciais para a prática médica." />;
}
