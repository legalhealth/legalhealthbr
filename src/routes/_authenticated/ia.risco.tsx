import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ScrollText, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contextSummary, useDiagnosticContext } from "@/lib/diagnostic-context";
import { saveHistoryItem } from "@/lib/ia-history";
import { tagLabel, useDocuments } from "@/lib/ia-documents";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/ia/risco")({
  validateSearch: (search: Record<string, unknown>): { doc?: string } =>
    typeof search['doc'] === "string" ? { doc: search['doc'] } : {},
  head: () => ({
    meta: [
      { title: "Análise de risco | Legal Health" },
      {
        name: "description",
        content:
          "Analise intimações e reclamações com leitura de riscos, prazos e estratégia baseada no seu Juriscore®.",
      },
      { property: "og:title", content: "Análise de risco | Legal Health" },
      {
        property: "og:description",
        content:
          "Analise intimações e reclamações com leitura de riscos, prazos e estratégia baseada no seu Juriscore®.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type Analysis = {
  nivel: string;
  cor: string;
  prazo: string;
  contexto: string;
  riscos: string[];
  estrategia: string[];
};

function Page() {
  const { data: ctx } = useDiagnosticContext();
  const { doc } = Route.useSearch();
  const { data: documents } = useDocuments();
  const queryClient = useQueryClient();
  const [prazo, setPrazo] = useState("");
  const [texto, setTexto] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedDoc = doc ? (documents ?? []).find((d) => d.id === doc) : undefined;

  useEffect(() => {
    if (!selectedDoc) return;
    setTexto((prev) =>
      prev.trim().length > 0
        ? prev
        : [
            `Documento anexado: ${selectedDoc.nome} (${tagLabel(selectedDoc.tag)}, enviado em ${new Date(
              selectedDoc.created_at,
            ).toLocaleDateString("pt-BR")}).`,
            "",
            selectedDoc.texto ??
              "Cole aqui o texto do documento ou descreva o seu conteúdo para a análise.",
          ].join("\n"),
    );
  }, [selectedDoc]);

  const handleAnalyze = () => {
    if (texto.trim().length < 20) {
      toast.error("Cole o conteúdo da intimação ou reclamação para analisar.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const score = ctx?.score ?? null;
      const nivel = score === null ? "Indeterminado" : score < 51 ? "Alto" : score < 76 ? "Médio" : "Contido";
      const cor =
        nivel === "Alto"
          ? "var(--color-danger)"
          : nivel === "Médio"
            ? "var(--color-warn)"
            : nivel === "Contido"
              ? "var(--color-success)"
              : "var(--color-info)";
      const result: Analysis = {
        nivel,
        cor,
        prazo: prazo || "Não informado — confirme na intimação",
        contexto: contextSummary(ctx),
        riscos: [
          ...(ctx?.weakest ?? []).map(
            (p) => `Fragilidade no pilar ${p.name} (${p.percent}%) pode ser explorada pela parte contrária.`,
          ),
          "Divergência entre o registro em prontuário e a versão apresentada pelo paciente.",
          "Ausência de comprovação de informação prévia sobre riscos do procedimento.",
        ].slice(0, 4),
        estrategia: [
          "Reunir prontuário completo, termos assinados e histórico de comunicação com o paciente.",
          "Registrar cronologia dos atendimentos com datas e profissionais envolvidos.",
          ctx?.hasDiagnostic
            ? `Priorizar as ações do Plano de Ação ligadas ao pilar ${ctx.weakest[0]?.name ?? "mais frágil"} antes da manifestação.`
            : "Fazer o Juriscore® para dimensionar a exposição antes de responder.",
          "Elaborar a manifestação na aba Redigir peça e submeter à revisão jurídica.",
        ],
      };
      setAnalysis(result);
      setLoading(false);

      const conteudo = [
        `Nível de risco: ${result.nivel}`,
        `Prazo: ${result.prazo}`,
        "",
        result.contexto,
        "",
        "Riscos identificados:",
        ...result.riscos.map((r) => `- ${r}`),
        "",
        "Estratégia sugerida:",
        ...result.estrategia.map((e, i) => `${i + 1}. ${e}`),
        "",
        "Documento analisado:",
        texto.trim(),
      ].join("\n");

      void saveHistoryItem({
        origem: "risco",
        tipo: `Risco ${result.nivel}`,
        titulo: `Análise de risco — nível ${result.nivel}`,
        conteudo,
        contexto: { score: ctx?.score ?? null, level: ctx?.level?.name ?? null },
      })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
          toast.success("Análise salva no histórico.");
        })
        .catch(() => toast.error("Análise gerada, mas não foi salva no histórico."));
    }, 900);
  };

  return (
    <div className="space-y-6">
      <DiagnosticContextCard
        ctx={ctx}
        note="O nível de risco da intimação é calibrado pelo seu score e pelos pilares em alerta."
      />

      {selectedDoc ? (
        <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5">
          <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">
            Documento em contexto
          </p>
          <p className="mt-2 text-sm text-foreground">{selectedDoc.nome}</p>
          <p className="mt-1 text-xs text-subtle">
            {tagLabel(selectedDoc.tag)} ·{" "}
            {new Date(selectedDoc.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <ScrollText className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h2 className="font-serif text-xl text-foreground">Análise de risco</h2>
            <p className="text-sm text-muted-foreground">Riscos, prazos e estratégia.</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="prazo">Prazo indicado no documento</Label>
            <Input
              id="prazo"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              placeholder="Ex.: 15 dias a partir de 12/08/2026"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="texto">Conteúdo da intimação ou reclamação</Label>
            <Textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole aqui o texto recebido..."
              className="min-h-[160px]"
            />
          </div>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-6 bg-gold text-background hover:bg-gold-light"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Analisando..." : "Analisar risco"}
        </Button>
      </section>

      {analysis ? (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">Nível de risco</p>
              <p className="mt-3 font-serif text-3xl leading-none" style={{ color: analysis.nivel === "Indeterminado" ? undefined : analysis.cor }}>
                {analysis.nivel}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">Prazo</p>
              <p className="mt-3 text-sm text-foreground">{analysis.prazo}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs leading-relaxed text-subtle">{analysis.contexto}</p>

            <h3 className="mt-5 font-serif text-lg text-foreground">Riscos identificados</h3>
            <ul className="mt-3 space-y-3">
              {analysis.riscos.map((risco) => (
                <li key={risco} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                  {risco}
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-serif text-lg text-foreground">Estratégia sugerida</h3>
            <ol className="mt-3 space-y-3">
              {analysis.estrategia.map((passo, i) => (
                <li key={passo} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-[0.7rem] text-gold">
                    {i + 1}
                  </span>
                  {passo}
                </li>
              ))}
            </ol>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-6 border-gold/40 bg-transparent text-gold hover:bg-gold/10"
            >
              <Link to="/ia/peca">Redigir manifestação</Link>
            </Button>
          </div>
        </section>
      ) : null}
      <AiDisclaimer />
    </div>
  );
}
