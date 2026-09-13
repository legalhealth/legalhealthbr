import { createFileRoute } from "@tanstack/react-router";

import { DadosClinica } from "@/components/clinica/dados-clinica";
import { EquipeClinica } from "@/components/clinica/equipe-clinica";
import { PageShell } from "@/components/layout/page-shell";

export const Route = createFileRoute("/_authenticated/clinica")({
  head: () => ({
    meta: [
      { title: "Minha clínica — Legal Health" },
      {
        name: "description",
        content: "Dados da clínica, horários de atendimento e equipe com acesso compartilhado.",
      },
      { property: "og:title", content: "Minha clínica — Legal Health" },
      {
        property: "og:description",
        content: "Dados da clínica, horários de atendimento e equipe com acesso compartilhado.",
      },
    ],
  }),
  component: ClinicaPage,
});

function ClinicaPage() {
  return (
    <PageShell
      title="Minha clínica"
      description="Dados usados nos documentos, horários de atendimento e quem acessa a conta."
    >
      <div className="space-y-6">
        <DadosClinica />
        <EquipeClinica />
      </div>
    </PageShell>
  );
}
