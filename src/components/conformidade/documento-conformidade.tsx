import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, FileDown, Printer } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { useClinica } from "@/lib/clinica";
import {
  CONFORMIDADE_AVISO,
  CONFORMIDADE_VERSAO,
  abrirImpressao,
  baixarWord,
  camposFaltantes,
  docPorSlug,
  type ConformidadeDoc,
} from "@/lib/conformidade-docs";

/** Página de leitura de uma minuta de conformidade, com versão para anexar ao e-mail. */
export function DocumentoConformidade({ slug }: { slug: ConformidadeDoc["slug"] }) {
  const { data } = useClinica();
  const clinica = data?.clinica ?? null;
  const doc = docPorSlug(slug, clinica);
  const faltando = camposFaltantes(clinica);

  return (
    <PageShell title={doc.titulo} description={doc.resumo}>
      <div className="mt-8 space-y-6 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+4.5rem)] lg:pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="outline" size="sm" className="h-11 w-full sm:h-9 sm:w-auto">
            <Link to="/conformidade">
              <ArrowLeft aria-hidden="true" />
              Conformidade
            </Link>
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="sm"
              className="gold-gradient h-11 w-full sm:h-9 sm:w-auto"
              onClick={() => baixarWord(doc)}
            >
              <FileDown aria-hidden="true" />
              Baixar em Word
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 w-full sm:h-9 sm:w-auto"
              onClick={() => {
                if (!abrirImpressao(doc)) {
                  toast.error(
                    "O navegador bloqueou a abertura da versão para impressão. Libere as janelas pop-up ou use o arquivo em Word.",
                  );
                }
              }}
            >
              <Printer aria-hidden="true" />
              Baixar em PDF
            </Button>
          </div>
        </div>

        {faltando.length > 0 ? (
          <div className="rounded-2xl border border-[#D9A648]/40 bg-[#D9A648]/10 p-5">
            <p className="flex items-center gap-2 text-sm text-[#D9A648]">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Faltam dados da clínica neste documento
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Aparecem como [preencher]: {faltando.join(", ")}.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 h-11 sm:h-9">
              <Link to="/clinica">Completar dados da clínica</Link>
            </Button>
          </div>
        ) : null}

        <article className="rounded-2xl glass-card p-5 md:p-8">
          <p className="text-[0.62rem] tracking-[0.28em] text-gold uppercase">
            Legal Health · Inteligência jurídica para saúde
          </p>
          <h2 className="mt-3 font-display text-2xl text-foreground">{doc.titulo}</h2>
          <p className="mt-2 text-xs text-muted-foreground">{CONFORMIDADE_VERSAO}</p>
          <p className="mt-1 text-xs text-subtle">{CONFORMIDADE_AVISO}</p>

          {doc.blocos.map((bloco) => (
            <section key={bloco.titulo} className="mt-7">
              <h3 className="text-sm font-medium text-foreground">{bloco.titulo}</h3>
              <div className="mt-2 space-y-2">
                {bloco.paragrafos.map((p, i) => (
                  <p key={i} className="text-[0.95rem] leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </PageShell>
  );
}
