import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil | Legal Health" },
      { name: "description", content: "Dados profissionais, especialidade e configurações da sua conta." },
      { property: "og:title", content: "Perfil | Legal Health" },
      { property: "og:description", content: "Dados profissionais, especialidade e configurações da sua conta." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageShell title="Perfil" description="Dados profissionais, especialidade e configurações da sua conta." />;
}
