import { useEffect, useState } from "react";
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

const TIPOS = [
  { value: "defesa-conselho", label: "Defesa em processo ético (conselho)" },
  { value: "defesa-consumidor", label: "Defesa em reclamação de consumidor" },
  { value: "contestacao", label: "Contestação em ação de indenização" },
  { value: "notificacao", label: "Notificação extrajudicial a paciente" },
  { value: "resposta", label: "Resposta formal a paciente ou familiar" },
];

function Page() {
  const { data: ctx } = useDiagnosticContext();
  const queryClient = useQueryClient();
  const { data: recommendations } = useRecommendations();
  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);
  const [tipo, setTipo] = useState("defesa-conselho");
  const [destinatario, setDestinatario] = useState("");
  const [fatos, setFatos] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (ctx?.hasDiagnostic && !fatos) {
      setFatos(
        `Contexto automático — pilares frágeis: ${ctx.weakest
          .map((p) => `${p.name} (${p.percent}%)`)
          .join(", ")}. Descreva aqui os fatos: procedimento realizado, datas, documentos existentes e o que o paciente alega.`,
      );
    }
  }, [ctx]);

  const handleGenerate = () => {
    if (fatos.trim().length < 20) {
      toast.error("Descreva os fatos com mais detalhes para gerar a peça.");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      const tipoLabel = TIPOS.find((t) => t.value === tipo)?.label ?? "Peça";
      const recTexts = (recommendations ?? [])
        .filter((r) => selectedRecs.includes(r.id))
        .map((r) => r.content);
      const text = [
          `${tipoLabel.toUpperCase()}`,
          destinatario ? `Ao(À) ${destinatario}` : "",
          "",
          contextSummary(ctx),
          "",
          "I — DOS FATOS",
          fatos.trim(),
          "",
          "II — DA DEFESA TÉCNICA",
          ctx?.hasDiagnostic
            ? `A conduta observou os deveres de informação e documentação. Ressalta-se que o programa de conformidade em curso identificou os pilares ${ctx.weakest
                .map((p) => p.name)
                .join(" e ")} como frentes de reforço, com medidas já em implementação.`
            : "A conduta observou os deveres de informação, documentação e diligência exigidos da atividade médica.",
          ...(recTexts.length > 0
            ? [
                "",
                "II.a — MEDIDAS RECOMENDADAS EM ANDAMENTO",
                ...recTexts.map((r, i) => `${i + 1}. ${r}`),
              ]
            : []),
          "",
          "III — DOS PEDIDOS",
          "Requer-se o acolhimento integral desta manifestação, com o arquivamento do feito.",
          "",
          "(Rascunho gerado pela IA Jurídica — revise com seu advogado antes do protocolo.)",
        ]
          .filter((line) => line !== undefined)
        .join("\n");
      setDraft(text);
      setGenerating(false);

      void saveHistoryItem({
        origem: "peca",
        tipo: tipoLabel,
        titulo: destinatario ? `${tipoLabel} — ${destinatario}` : tipoLabel,
        conteudo: text,
        contexto: { score: ctx?.score ?? null, level: ctx?.level?.name ?? null },
      })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
          toast.success("Rascunho salvo no histórico.");
        })
        .catch(() => toast.error("Rascunho gerado, mas não foi salvo no histórico."));
    }, 900);
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
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destinatario">Destinatário</Label>
            <Input
              id="destinatario"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="Ex.: Conselho Regional de Medicina do Ceará"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="fatos">Fatos e documentos</Label>
          <Textarea
            id="fatos"
            value={fatos}
            onChange={(e) => setFatos(e.target.value)}
            className="min-h-[160px]"
          />
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
          onClick={handleGenerate}
          disabled={generating}
          className="mt-6 bg-gold text-background hover:bg-gold-light"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {generating ? "Gerando rascunho..." : "Gerar rascunho"}
        </Button>
      </section>

      {draft ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-serif text-lg text-foreground">Rascunho</h3>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
            {draft}
          </pre>
          <Button
            variant="outline"
            size="sm"
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
