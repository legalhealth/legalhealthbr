import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { useClinica, useEhAssistente } from "@/lib/clinica";
import { docContratoLgpd, docRetencao, camposFaltantes } from "@/lib/conformidade-docs";

const TITLE = "Conformidade | Legal Health";
const DESCRIPTION =
  "Política de retenção de dados e contrato de tratamento de dados (LGPD) da sua clínica, prontos para anexar ao e-mail do advogado.";

export const Route = createFileRoute("/_authenticated/conformidade/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: ehAssistente } = useEhAssistente();
  const { data } = useClinica();
  const navigate = useNavigate();
  const clinica = data?.clinica ?? null;
  const faltando = camposFaltantes(clinica);

  useEffect(() => {
    if (ehAssistente) void navigate({ to: "/biblioteca" });
  }, [ehAssistente, navigate]);

  const itens = [
    { doc: docRetencao(clinica), to: "/conformidade/retencao" as const, Icone: ShieldCheck },
    { doc: docContratoLgpd(clinica), to: "/conformidade/contrato-lgpd" as const, Icone: FileText },
  ];

  return (
    <PageShell
      title="Conformidade"
      description="Documentos de proteção de dados da sua clínica, com os dados cadastrais já aplicados e versão para anexar ao e-mail formal."
    >
      <div className="mt-8 space-y-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+4.5rem)] lg:pb-24">
        {itens.map(({ doc, to, Icone }) => (
          <Link key={doc.slug} to={to} className="block rounded-2xl glass-card p-5 md:p-6">
            <p className="flex items-center gap-2 text-[0.95rem] text-foreground">
              <Icone className="size-4 text-gold" aria-hidden="true" />
              {doc.titulo}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{doc.resumo}</p>
            {faltando.length > 0 ? (
              <p className="mt-2 text-xs text-[#D9A648]">
                {faltando.length} dado(s) da clínica ainda para preencher
              </p>
            ) : null}
          </Link>
        ))}
        <p className="text-xs text-subtle">
          As duas minutas seguem para revisão do seu advogado antes de qualquer assinatura ou
          publicação.
        </p>
      </div>
    </PageShell>
  );
}
