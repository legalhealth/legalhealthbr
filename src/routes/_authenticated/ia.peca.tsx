import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { contextSummary, useDiagnosticContext } from "@/lib/diagnostic-context";
import { saveHistoryItem } from "@/lib/ia-history";
import { useRecommendations } from "@/lib/ia-recommendations";
import { streamPeca, TIPOS_PECA, tipoPecaLabel } from "@/lib/ia-peca";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/ia/peca")({
  head: () => ({
    meta: [
      { title: "Redigir peça | Legal Health" },
      {
        name: "description",
        content:
          "Gere defesas, petições e notificações já contextualizadas pelo seu diagnóstico Juriscore®.",
      },
      { property: "og:title", content: "Redigir peça | Legal Health" },
      {
        property: "og:description",
        content:
          "Gere defesas, petições e notificações já contextualizadas pelo seu diagnóstico Juriscore®.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: ctx } = useDiagnosticContext();
  const queryClient = useQueryClient();
  const { data: recommendations } = useRecommendations();
  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);
  const [tipo, setTipo] = useState<string>("defesa-sindicancia");
  const [cliente, setCliente] = useState("");
  const [contraria, setContraria] = useState("");
  const [orgao, setOrgao] = useState("");
  const [fatos, setFatos] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [provas, setProvas] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const draftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ctx?.hasDiagnostic && !objetivo) {
      setObjetivo("");
    }
  }, [ctx, objetivo]);

  const handleGenerate = async () => {
    if (fatos.trim().length < 20) {
      toast.error("Descreva os fatos do caso com mais detalhes para gerar a peça.");
      return;
    }
    const tipoLabel = tipoPecaLabel(tipo);
    const recTexts = (recommendations ?? [])
      .filter((r) => selectedRecs.includes(r.id))
      .map((r, i) => `${i + 1}. ${r.content}`);
    const contexto = [
      contextSummary(ctx),
      ctx?.hasDiagnostic
        ? `Pilares frágeis: ${ctx.weakest.map((p) => `${p.name} (${p.percent}%)`).join(", ")}.`
        : "",
      recTexts.length > 0 ? `Medidas de conformidade em andamento:\n${recTexts.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setGenerating(true);
    setDraft("");
    try {
      const text = await streamPeca(
        { tipo, cliente, contraria, orgao, fatos, objetivo, provas, contexto },
        (chunk) => setDraft((prev) => (prev ?? "") + chunk),
      );
      try {
        await saveHistoryItem({
          origem: "peca",
          tipo: tipoLabel,
          titulo: cliente ? `${tipoLabel} — ${cliente}` : tipoLabel,
          conteudo: text,
          contexto: { score: ctx?.score ?? null, level: ctx?.level?.name ?? null },
        });
        void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
        toast.success("Peça gerada e salva no histórico.");
      } catch {
        toast.error("Peça gerada, mas não foi salva no histórico.");
      }
    } catch (error) {
      setDraft(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a peça.");
    } finally {
      setGenerating(false);
      draftRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      <DiagnosticContextCard
        ctx={ctx}
        note="A peça é redigida citando o nível de conformidade e os pilares frágeis do seu diagnóstico."
      />

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <FileSignature className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h2 className="font-serif text-xl text-foreground">Redigir peça</h2>
            <p className="text-sm text-muted-foreground">Defesa, petição ou notificação.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de peça</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PECA.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgao">Órgão de destino</Label>
            <Input
              id="orgao"
              value={orgao}
              onChange={(e) => setOrgao(e.target.value)}
              placeholder="Ex.: Conselho Regional de Medicina do Ceará"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente representado</Label>
            <Input
              id="cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ex.: Dr. João Silva, CRM/CE 12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contraria">Parte contrária</Label>
            <Input
              id="contraria"
              value={contraria}
              onChange={(e) => setContraria(e.target.value)}
              placeholder="Ex.: paciente, operadora ou denunciante"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="fatos">Fatos do caso</Label>
          <Textarea
            id="fatos"
            value={fatos}
            onChange={(e) => setFatos(e.target.value)}
            placeholder="Procedimento realizado, datas, evolução clínica, documentos existentes e o que se alega."
            className="min-h-[160px]"
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo e pedidos</Label>
            <Textarea
              id="objetivo"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex.: arquivamento da sindicância; improcedência dos pedidos; pagamento dos honorários."
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provas">Provas disponíveis</Label>
            <Textarea
              id="provas"
              value={provas}
              onChange={(e) => setProvas(e.target.value)}
              placeholder="Ex.: prontuário, termo de consentimento, exames, laudos, testemunhas, contrato."
              className="min-h-[120px]"
            />
          </div>
        </div>

        {(recommendations ?? []).length > 0 ? (
          <div className="mt-6 space-y-3">
            <Label>Recomendações salvas do Assistente</Label>
            <p className="text-xs text-subtle">
              Selecione as recomendações que devem constar como medidas em andamento na peça.
            </p>
            <ul className="space-y-2">
              {(recommendations ?? []).slice(0, 8).map((rec) => {
                const active = selectedRecs.includes(rec.id);
                return (
                  <li key={rec.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRecs((prev) =>
                          active ? prev.filter((id) => id !== rec.id) : [...prev, rec.id],
                        )
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                        active
                          ? "border-gold/60 bg-gold/10 text-foreground"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="line-clamp-2">{rec.content}</span>
                      <span className="mt-1 block text-xs text-subtle">
                        {new Date(rec.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <Button
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="mt-6 bg-gold text-background hover:bg-gold-light"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {generating ? "Redigindo peça..." : "Redigir peça"}
        </Button>
      </section>

      {draft !== null ? (
        <section ref={draftRef} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-serif text-lg text-foreground">
            {generating ? "Redigindo…" : "Peça redigida"}
          </h3>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
            {draft || "Aguardando a IA…"}
          </pre>
          <Button
            variant="outline"
            size="sm"
            disabled={generating || !draft}
            className="mt-5 border-gold/40 bg-transparent text-gold hover:bg-gold/10"
            onClick={() => {
              void navigator.clipboard.writeText(draft);
              toast.success("Rascunho copiado.");
            }}
          >
            Copiar texto
          </Button>
        </section>
      ) : null}
      <AiDisclaimer />
    </div>
  );
}
