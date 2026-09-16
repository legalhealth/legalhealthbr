import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { abs, paginaLdScript } from "@/lib/seo";

const TITLE = "Canal de Privacidade | Legal Health";
const DESCRIPTION =
  "Como enviar pedidos sobre dados pessoais à Legal Health. Documento em elaboração, com canal de contato ativo.";

export const Route = createFileRoute("/canal-de-privacidade")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: abs("/canal-de-privacidade") },
    ],
    links: [{ rel: "canonical", href: abs("/canal-de-privacidade") }],
    scripts: [
      paginaLdScript({
        path: "/canal-de-privacidade",
        name: TITLE,
        description: DESCRIPTION,
        breadcrumbLabel: "Canal de Privacidade",
        tipo: "ContactPage",
      }),
    ],
  }),
  component: CanalPage,
});

function CanalPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">
        <span className="gold-rule mb-6 block" aria-hidden="true" />
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">
          Documento em elaboração
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Canal de Privacidade
        </h1>
        <div className="mt-8 space-y-6 text-[0.95rem] leading-relaxed text-muted-foreground">
          <p>
            A política formal deste canal está em elaboração e revisão jurídica. Não divulgamos
            ainda prazos de resposta garantidos nem a designação formal de encarregado.
          </p>
          <p>
            O canal de contato já funciona: envie pedidos de acesso, correção, revogação de
            consentimento ou exclusão de dados para{" "}
            <a
              href="mailto:privacidade@legalhealthbr.app"
              className="text-gold underline underline-offset-4 hover:text-gold-light"
            >
              privacidade@legalhealthbr.app
            </a>
            .
          </p>
          <p>
            O tratamento de dados atualmente descrito está na{" "}
            <Link
              to="/privacidade"
              className="text-gold underline underline-offset-4 hover:text-gold-light"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
