import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { abs, paginaLdScript } from "@/lib/seo";

const TITLE = "Política de Privacidade | Legal Health";
const DESCRIPTION =
  "Como a Legal Health trata dados pessoais, prazos de retenção e o canal de privacidade para titulares.";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content: "Tratamento de dados, retenção e canal de privacidade da Legal Health.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: abs("/privacidade") },
    ],
    links: [{ rel: "canonical", href: abs("/privacidade") }],
    scripts: [
      paginaLdScript({
        path: "/privacidade",
        name: TITLE,
        description: DESCRIPTION,
        breadcrumbLabel: "Política de Privacidade",
      }),
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">
        <span className="gold-rule mb-6 block" aria-hidden="true" />
        <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-subtle">
          Versão preliminar em revisão jurídica. Última atualização: setembro de 2026.
        </p>

        <div className="mt-8 space-y-8 text-[0.95rem] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-xl text-foreground">Dados que tratamos</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Conta:</strong> e-mail, nome e preferências de
                uso da plataforma.
              </li>
              <li>
                <strong className="text-foreground">Candidatura ao programa:</strong> nome, e-mail,
                profissão, cidade, estado, tipo de atuação, link profissional opcional e motivo do
                interesse.
              </li>
              <li>
                <strong className="text-foreground">Uso da plataforma:</strong> respostas do
                diagnóstico, documentos que você envia e histórico das interações com a IA.
              </li>
              <li>
                <strong className="text-foreground">Métricas:</strong> eventos agregados de
                navegação, sem dados pessoais, respostas de candidatura ou dados de saúde.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">Dados que não pedimos</h2>
            <p className="mt-3">
              Na candidatura não solicitamos CRM, número de inscrição em conselho, documentos de
              identidade nem qualquer dado de paciente. Não insira informações de terceiros nos
              campos abertos.
            </p>
          </section>

          <section id="retencao" className="scroll-mt-24">
            <h2 className="font-display text-xl text-foreground">Retenção de dados</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Candidaturas não selecionadas: até 12 meses após a análise.</li>
              <li>Candidaturas aprovadas: durante o programa e por 12 meses após o término.</li>
              <li>
                Documentos enviados para análise: mantidos enquanto a conta estiver ativa e
                removidos em até 30 dias após solicitação de exclusão.
              </li>
              <li>Links seguros de revisão enviados ao advogado: expiram em 7 dias.</li>
              <li>Registros técnicos e de auditoria: pelo prazo legal aplicável.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">Seus direitos</h2>
            <p className="mt-3">
              Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade,
              anonimização ou eliminação dos seus dados, além de revogar o consentimento de contato
              sobre o programa a qualquer momento.
            </p>
          </section>

          <section id="canal" className="scroll-mt-24">
            <h2 className="font-display text-xl text-foreground">Canal de Privacidade</h2>
            <p className="mt-3">
              Solicitações de titulares:{" "}
              <a
                className="text-gold hover:text-gold-light"
                href="mailto:privacidade@legalhealthbr.app"
              >
                privacidade@legalhealthbr.app
              </a>
              . Responderemos conforme os prazos da LGPD. Se a solicitação envolver exclusão de
              conta, confirme o pedido pelo e-mail cadastrado.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
