import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { abs, paginaLdScript } from "@/lib/seo";

const TITLE = "Termos de Uso | Legal Health";
const DESCRIPTION =
  "Termos de uso da plataforma Legal Health e do programa de Embaixadores para profissionais da saúde.";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content: "Condições de uso da plataforma Legal Health e do programa de Embaixadores.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: abs("/termos") },
    ],
    links: [{ rel: "canonical", href: abs("/termos") }],
    scripts: [
      paginaLdScript({
        path: "/termos",
        name: TITLE,
        description: DESCRIPTION,
        breadcrumbLabel: "Termos de Uso",
      }),
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">
        <span className="gold-rule mb-6 block" aria-hidden="true" />
        <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Termos de Uso
        </h1>
        <p className="mt-3 text-sm text-subtle">
          Versão preliminar em revisão jurídica. Última atualização: setembro de 2026.
        </p>

        <div className="mt-8 space-y-8 text-[0.95rem] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-xl text-foreground">1. Objeto</h2>
            <p className="mt-3">
              A Legal Health é uma plataforma de organização de riscos jurídicos preventivos
              voltada a profissionais da saúde. Os recursos oferecem apoio informativo e
              organizacional. A plataforma não presta serviços de advocacia, não constitui
              aconselhamento jurídico individual e não substitui advogado.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">2. Uso responsável</h2>
            <p className="mt-3">
              O usuário se compromete a utilizar a plataforma conforme as normas da própria
              categoria profissional, incluindo regras de publicidade, sigilo e documentação
              clínica. Não é permitido inserir dados de pacientes sem base legal adequada.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">
              3. Conteúdo gerado com apoio de inteligência artificial
            </h2>
            <p className="mt-3">
              Respostas, minutas e planos de ação são apoio à decisão. Cada conteúdo deve ser
              revisado por profissional habilitado antes de qualquer uso externo. Citações de
              normas indicam a fonte oficial consultada e a data de vigência registrada na base.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">
              4. Programa de Embaixadores
            </h2>
            <p className="mt-3">
              A participação depende de análise de critérios e disponibilidade. A candidatura não
              gera direito a aprovação, remuneração, comissão, desconto, certificação ou
              benefício automático. Os recursos liberados, o prazo e as condições de continuidade
              seguem o regulamento vigente do programa piloto.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">5. Limitação</h2>
            <p className="mt-3">
              A Legal Health não garante ausência de processos, sanções ou conformidade
              regulatória. O resultado do Juriscore® é um indicador de organização e atenção, não
              um parecer jurídico.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">6. Contato</h2>
            <p className="mt-3">
              Dúvidas sobre estes termos:{" "}
              <a className="text-gold hover:text-gold-light" href="mailto:contato@legalhealthbr.app">
                contato@legalhealthbr.app
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
