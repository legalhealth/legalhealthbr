import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";

const TITLE = "Retenção de Dados | Legal Health";
const DESCRIPTION =
  "Documento sobre prazos e critérios de retenção de dados da Legal Health, em elaboração e revisão jurídica.";

export const Route = createFileRoute("/retencao-de-dados")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RetencaoPage,
});

function RetencaoPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">
        <span className="gold-rule mb-6 block" aria-hidden="true" />
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">
          Documento em elaboração
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Retenção de Dados
        </h1>
        <div className="mt-8 space-y-6 text-[0.95rem] leading-relaxed text-muted-foreground">
          <p>
            Este documento está em elaboração e revisão jurídica. Ainda não publicamos prazos
            definitivos de retenção, responsáveis formais nem certificações — não afirmamos nada que
            não esteja confirmado.
          </p>
          <p>
            Enquanto isso, o tratamento de dados vigente está descrito na{" "}
            <Link
              to="/privacidade"
              className="text-gold underline underline-offset-4 hover:text-gold-light"
            >
              Política de Privacidade
            </Link>
            , incluindo a seção de retenção e o{" "}
            <Link
              to="/canal-de-privacidade"
              className="text-gold underline underline-offset-4 hover:text-gold-light"
            >
              canal de privacidade
            </Link>{" "}
            para pedidos de titulares.
          </p>
          <p>
            Se você já tem conta, a política de retenção aplicada à sua clínica e o contrato de
            tratamento de dados ficam em{" "}
            <Link
              to="/conformidade"
              className="text-gold underline underline-offset-4 hover:text-gold-light"
            >
              Biblioteca › Conformidade
            </Link>
            , com versão para anexar ao e-mail do seu advogado.
          </p>
          <p>
            Dúvidas ou solicitações:{" "}
            <a
              href="mailto:privacidade@legalhealthbr.app"
              className="text-gold underline underline-offset-4 hover:text-gold-light"
            >
              privacidade@legalhealthbr.app
            </a>
            .
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
