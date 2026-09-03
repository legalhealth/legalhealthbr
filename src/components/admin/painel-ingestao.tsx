import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleAlert, Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  executarIngestao,
  historicoIngestao,
  listarCatalogoIngestao,
} from "@/lib/legal-ingest.functions";

const RESULTADO_LABEL: Record<string, string> = {
  nova_versao: "Nova versão indexada",
  sem_mudanca: "Sem alteração no texto oficial",
  manual: "Depende de curadoria manual (PDF)",
  erro: "Falha na coleta",
  ok: "Concluído",
};

const RESULTADO_COR: Record<string, string> = {
  nova_versao: "text-[#2FBF7B]",
  sem_mudanca: "text-muted-foreground",
  manual: "text-[#D9A648]",
  erro: "text-[#E0655F]",
};

/**
 * Pipeline de ingestão: coleta o texto das fontes oficiais, compara com o que já
 * está indexado e cria nova versão quando o órgão emissor altera a norma.
 */
export function PainelIngestao() {
  const listar = useServerFn(listarCatalogoIngestao);
  const historico = useServerFn(historicoIngestao);
  const executar = useServerFn(executarIngestao);
  const queryClient = useQueryClient();
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  const catalogo = useQuery({ queryKey: ["ingest-catalogo"], queryFn: () => listar({}) });
  const runs = useQuery({ queryKey: ["ingest-historico"], queryFn: () => historico({}) });

  const coleta = useMutation({
    mutationFn: (sourceIds: string[]) => executar({ data: { sourceIds } }),
    onSuccess: ({ resultados }) => {
      const novas = resultados.filter((r) => r.resultado === "nova_versao").length;
      const erros = resultados.filter((r) => r.resultado === "erro").length;
      toast.success(
        `Coleta concluída: ${novas} nova(s) versão(ões) indexada(s)${erros > 0 ? `, ${erros} com falha` : ""}.`,
      );
      setSelecionadas([]);
      void queryClient.invalidateQueries({ queryKey: ["ingest-historico"] });
      void queryClient.invalidateQueries({ queryKey: ["legal-fontes"] });
      void queryClient.invalidateQueries({ queryKey: ["legal-alertas"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao executar a coleta."),
  });

  const alternar = (id: string) =>
    setSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );

  return (
    <section>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.2em] text-primary uppercase">
            Pipeline de ingestão oficial
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A coleta lê o texto publicado pelo órgão emissor, compara o conteúdo com a versão já
            indexada e, quando há alteração, cria uma nova versão vigente preservando a anterior no
            histórico.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={coleta.isPending || selecionadas.length === 0}
            onClick={() => coleta.mutate(selecionadas)}
          >
            Coletar selecionadas ({selecionadas.length})
          </Button>
          <Button disabled={coleta.isPending} onClick={() => coleta.mutate([])}>
            {coleta.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Coletar catálogo
          </Button>
        </div>
      </div>

      {catalogo.isLoading ? (
        <Skeleton className="mt-4 h-48 w-full rounded-2xl" />
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(catalogo.data ?? []).map((fonte) => {
            const ativa = selecionadas.includes(fonte.sourceId);
            return (
              <button
                key={fonte.sourceId}
                type="button"
                onClick={() => alternar(fonte.sourceId)}
                className={`rounded-2xl glass-card p-5 text-left transition-colors ${
                  ativa ? "border-primary/60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-foreground">{fonte.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {fonte.issuingBody}
                      {fonte.number ? ` · ${fonte.number}` : ""} · autoridade{" "}
                      {fonte.authorityLevel}
                    </p>
                  </div>
                  {fonte.formato === "pdf" && fonte.curado ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[#2FBF7B]">
                      <FileText className="size-3.5" /> PDF curado
                    </span>
                  ) : fonte.formato === "pdf" ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[#D9A648]">
                      <FileText className="size-3.5" /> PDF pendente
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[#2FBF7B]">
                      <CheckCircle2 className="size-3.5" /> automática
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {fonte.formato === "pdf" && fonte.curado
                    ? "Texto do PDF oficial conferido pela curadoria jurídica e indexado com vigência e status."
                    : fonte.artigos.length > 0
                      ? `Recorte curado: ${fonte.artigos.join(", ")}`
                      : "Texto integral publicado em PDF pelo órgão emissor."}
                </p>
                <a
                  href={fonte.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Texto oficial <ExternalLink className="size-3" />
                </a>
              </button>
            );
          })}
        </div>
      )}

      <h3 className="mt-8 text-xs tracking-[0.18em] text-muted-foreground uppercase">
        Últimas coletas
      </h3>
      {runs.isLoading ? (
        <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
      ) : (runs.data ?? []).length === 0 ? (
        <p className="mt-3 rounded-2xl glass-card px-5 py-4 text-sm text-muted-foreground">
          Nenhuma coleta executada ainda.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {(runs.data ?? []).map((run) => (
            <div key={run.id} className="rounded-2xl glass-card px-5 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-foreground">{run.source_id}</p>
                <span
                  className={`flex items-center gap-1 text-xs ${RESULTADO_COR[run.resultado] ?? "text-muted-foreground"}`}
                >
                  {run.resultado === "erro" ? <CircleAlert className="size-3.5" /> : null}
                  {RESULTADO_LABEL[run.resultado] ?? run.resultado}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(run.created_at).toLocaleString("pt-BR")}
                {run.version ? ` · versão ${run.version}` : ""}
                {run.chunks > 0 ? ` · ${run.chunks} trechos` : ""}
              </p>
              {run.mensagem ? (
                <p className="mt-2 text-xs text-muted-foreground">{run.mensagem}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
