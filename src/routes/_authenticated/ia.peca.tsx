import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, Paperclip, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { Button } from "@/components/ui/button";
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
import {
  formatSize,
  useAnalyzeDocument,
  useDocuments,
  useUploadDocuments,
  type DocumentRow,
} from "@/lib/ia-documents";
import {
  streamPeca,
  sugerirTipoPeca,
  TIPO_AUTO,
  TIPOS_PECA,
  tipoPecaLabel,
  type PecaDocumento,
} from "@/lib/ia-peca";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";
import { EnviarRevisaoDialog } from "@/components/ia/enviar-revisao-dialog";

export const Route = createFileRoute("/_authenticated/ia/peca")({
  head: () => ({
    meta: [
      { title: "Redigir peça | Legal Health" },
      {
        name: "description",
        content:
          "Anexe a intimação ou notificação recebida: a IA lê o documento e redige a defesa técnica completa.",
      },
      { property: "og:title", content: "Redigir peça | Legal Health" },
      {
        property: "og:description",
        content:
          "Anexe a intimação ou notificação recebida: a IA lê o documento e redige a defesa técnica completa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type AnexoLido = {
  doc: DocumentRow;
  dados: PecaDocumento;
  ilegivel: boolean;
};

function Page() {
  const { data: ctx } = useDiagnosticContext();
  const queryClient = useQueryClient();
  const { data: recommendations } = useRecommendations();
  const { refetch: refetchDocuments } = useDocuments();
  const upload = useUploadDocuments();
  const analyzeDoc = useAnalyzeDocument();

  const [selectedRecs, setSelectedRecs] = useState<string[]>([]);
  const [anexos, setAnexos] = useState<AnexoLido[]>([]);
  const [tipo, setTipo] = useState<string>(TIPO_AUTO);
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [complemento, setComplemento] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [docTitulo, setDocTitulo] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gerandoRef = useRef(false);
  const draftRef = useRef<HTMLDivElement>(null);

  const lendo = upload.isPending || analyzeDoc.isPending;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      await upload.mutateAsync({ files, tag: "intimacao" });
      const { data: fresh } = await refetchDocuments();
      const names = new Set(files.map((f) => f.name));
      const uploaded = (fresh ?? []).filter((d) => names.has(d.nome)).slice(0, files.length);
      toast.success("Documento anexado. A IA está lendo o conteúdo...");

      for (const docRow of uploaded) {
        try {
          const analise = await analyzeDoc.mutateAsync(docRow);
          const dados: PecaDocumento = {
            nome: docRow.nome,
            tipo_documento: analise.tipo_documento,
            partes: analise.partes_envolvidas,
            prazos: analise.prazos.map(
              (p) => `${p.descricao} — ${p.data_ou_contagem} (urgência ${p.urgencia})`,
            ),
            pontos: analise.pontos_criticos.map(
              (p) => `${p.titulo}: ${p.descricao} (risco ${p.risco})`,
            ),
            transcricao: analise.transcricao_essencial,
          };
          const ilegivel = dados.transcricao.length === 0;
          setAnexos((prev) => [
            { doc: docRow, dados, ilegivel },
            ...prev.filter((a) => a.doc.id !== docRow.id),
          ]);
          const sugerido = sugerirTipoPeca(analise.tipo_documento);
          if (sugerido) {
            setSugestao(sugerido);
            setTipo((prev) => (prev === TIPO_AUTO ? sugerido : prev));
          }
          if (ilegivel) {
            toast.error(
              `Não foi possível extrair o texto de ${docRow.nome}. Reenvie o arquivo com melhor qualidade ou descreva o caso abaixo.`,
            );
          }
        } catch {
          setAnexos((prev) => [
            {
              doc: docRow,
              dados: {
                nome: docRow.nome,
                tipo_documento: "[NÃO IDENTIFICADO]",
                partes: [],
                prazos: [],
                pontos: [],
                transcricao: [],
              },
              ilegivel: true,
            },
            ...prev.filter((a) => a.doc.id !== docRow.id),
          ]);
          toast.error(`A leitura de ${docRow.nome} falhou. Você pode descrever o caso abaixo.`);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao anexar o documento.");
    }
  };

  const legiveis = anexos.filter((a) => !a.ilegivel);
  const podeGerar = legiveis.length > 0 || complemento.trim().length >= 20;

  const handleGenerate = async () => {
    if (!podeGerar) {
      toast.error("Anexe o documento que originou o caso.");
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

    if (gerandoRef.current) return;
    gerandoRef.current = true;
    setGenerating(true);
    setDraft("");
    setDocId(null);
    try {
      const text = await streamPeca(
        {
          tipo,
          documentos: anexos.map((a) => a.dados),
          complemento: complemento.trim(),
          contexto,
        },
        (chunk) => setDraft((prev) => (prev ?? "") + chunk),
      );
      try {
        const base = anexos[0]?.doc.nome;
        const titulo = base ? `${tipoLabel} — ${base}` : tipoLabel;
        const savedId = await saveHistoryItem({
          origem: "peca",
          tipo: tipoLabel,
          titulo,
          conteudo: text,
          contexto: { score: ctx?.score ?? null, level: ctx?.level?.name ?? null },
        });
        setDocId(savedId);
        setDocTitulo(titulo);
        void queryClient.invalidateQueries({ queryKey: ["ia-history"] });
        toast.success("Defesa gerada e salva no histórico.");
      } catch {
        toast.error("Defesa gerada, mas não foi salva no histórico.");
      }
    } catch (error) {
      setDraft(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar a peça.");
    } finally {
      setGenerating(false);
      gerandoRef.current = false;
      draftRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      <DiagnosticContextCard
        ctx={ctx}
        note="A peça é redigida citando o nível de conformidade e os pilares frágeis do seu diagnóstico."
      />

      <section className="rounded-2xl glass-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <FileSignature className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h2 className="font-display text-xl text-foreground">Redigir defesa técnica</h2>
            <p className="text-sm text-muted-foreground">
              Anexe o documento recebido: a IA lê, identifica a peça cabível e redige a defesa.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              void handleFiles(files);
            }}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={lendo}
            className="gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            {lendo ? "Lendo documento..." : "Anexar documento do caso"}
          </Button>
          <p className="text-xs text-subtle">
            Intimação, notificação, sindicância do CRM, reclamação, glosa ou citação judicial. PDF ou
            imagem, até 15 MB por arquivo.
          </p>

          {anexos.length > 0 ? (
            <ul className="space-y-2">
              {anexos.map((a) => (
                <li
                  key={a.doc.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-gold" />
                  <span className="flex-1 text-sm text-foreground">
                    {a.doc.nome}
                    <span className="ml-2 text-xs text-subtle">
                      {formatSize(a.doc.size_bytes)}
                      {a.ilegivel ? " · texto não extraído" : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remover ${a.doc.nome}`}
                    onClick={() => {
                      setAnexos((prev) => prev.filter((x) => x.doc.id !== a.doc.id));
                    }}
                    className="text-subtle transition hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {legiveis.length > 0 ? (
            <div className="space-y-4 rounded-2xl border border-gold/40 bg-gold/5 p-4">
              <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">
                Leitura do documento
              </p>
              {legiveis.map((a) => (
                <div key={a.doc.id} className="space-y-2">
                  <p className="text-sm text-foreground">
                    {a.doc.nome} — <span className="text-gold">{a.dados.tipo_documento}</span>
                  </p>
                  {a.dados.partes.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Partes: {a.dados.partes.join("; ")}
                    </p>
                  ) : null}
                  {a.dados.prazos.length > 0 ? (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {a.dados.prazos.map((p) => (
                        <li key={p}>Prazo: {p}</li>
                      ))}
                    </ul>
                  ) : null}
                  <pre className="max-h-40 overflow-y-auto rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                    {a.dados.transcricao.join("\n")}
                  </pre>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de peça</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIPO_AUTO}>Definir automaticamente pela IA</SelectItem>
                {TIPOS_PECA.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-subtle">
              {sugestao
                ? `Sugerido pela leitura do documento: ${tipoPecaLabel(sugestao)}. Ajuste se necessário.`
                : "A IA identifica a peça cabível a partir do documento anexado."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complemento">O que a IA deve saber a mais sobre o caso?</Label>
            <Textarea
              id="complemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              placeholder="Opcional: sua versão dos fatos, provas disponíveis, evolução clínica ou objetivo desejado."
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
          disabled={generating || lendo || !podeGerar}
          className="mt-6 gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {generating ? "Redigindo defesa..." : "Redigir defesa técnica"}
        </Button>
        {!podeGerar ? (
          <p className="mt-2 text-xs text-subtle">Anexe o documento que originou o caso.</p>
        ) : null}
      </section>

      {draft !== null ? (
        <section ref={draftRef} className="rounded-2xl glass-card p-6">
          <h3 className="font-display text-lg text-foreground">
            {generating ? "Redigindo…" : "Defesa redigida"}
          </h3>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
            {draft || "Aguardando a IA…"}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={generating || !draft}
              className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
              onClick={() => {
                void navigator.clipboard.writeText(draft);
                toast.success("Rascunho copiado.");
              }}
            >
              Copiar texto
            </Button>
            {!generating && draft && docId ? (
              <EnviarRevisaoDialog docId={docId} titulo={docTitulo} conteudo={draft} />
            ) : null}
          </div>
        </section>
      ) : null}
      <AiDisclaimer />
    </div>
  );
}
