import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, FileText, ScanLine, ScrollText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiagnosticContext } from "@/lib/diagnostic-context";
import {
  DOC_TAGS,
  documentSignedUrl,
  formatSize,
  tagLabel,
  useDeleteDocument,
  useDocuments,
  useUpdateDocumentTag,
  useUploadDocuments,
  type DocTag,
} from "@/lib/ia-documents";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/ia/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos | Legal Health" },
      {
        name: "description",
        content:
          "Envie prontuários, termos e intimações para leitura assistida por IA com foco nos seus pilares de risco.",
      },
      { property: "og:title", content: "Documentos | Legal Health" },
      {
        property: "og:description",
        content:
          "Envie prontuários, termos e intimações para leitura assistida por IA com foco nos seus pilares de risco.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: ctx } = useDiagnosticContext();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState<DocTag>("prontuario");
  const { data: documents, isLoading } = useDocuments();
  const upload = useUploadDocuments();
  const updateTag = useUpdateDocumentTag();
  const removeDoc = useDeleteDocument();

  return (
    <div className="space-y-6">
      <DiagnosticContextCard
        ctx={ctx}
        note="A leitura dos documentos destaca lacunas relacionadas aos seus pilares mais frágeis."
      />

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <ScanLine className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h2 className="font-serif text-xl text-foreground">Escanear documento</h2>
            <p className="text-sm text-muted-foreground">Upload e leitura assistida (OCR).</p>
          </div>
        </div>

        <div className="mt-6 max-w-xs space-y-2">
          <label className="text-sm text-muted-foreground">Etiqueta dos próximos envios</label>
          <Select value={tag} onValueChange={(value) => setTag(value as DocTag)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TAGS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="mt-5 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center transition-colors hover:border-gold/50 disabled:opacity-60"
        >
          <Upload className="h-6 w-6 text-gold" />
          <span className="text-sm text-foreground">
            {upload.isPending ? "Enviando..." : "Selecionar arquivos"}
          </span>
          <span className="text-xs text-subtle">PDF, JPG ou PNG · até 10 MB por arquivo</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (selected.length === 0) return;
            const tooBig = selected.find((f) => f.size > 10 * 1024 * 1024);
            if (tooBig) {
              toast.error(`"${tooBig.name}" excede 10 MB.`);
              return;
            }
            upload.mutate(
              { files: selected, tag },
              {
                onSuccess: () => toast.success(`${selected.length} documento(s) enviado(s).`),
                onError: () => toast.error("Falha no envio do documento."),
              },
            );
          }}
        />

        <p className="mt-5 text-xs leading-relaxed text-subtle">
          A extração automática de texto será ativada em breve. Enquanto isso, cole o conteúdo em{" "}
          <Link to="/ia/risco" className="text-gold hover:text-gold-light">
            Análise de risco
          </Link>{" "}
          para avaliação imediata.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-serif text-lg text-foreground">Meus documentos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Etiquetas, datas de envio e uso direto na Análise de risco.
        </p>

        {isLoading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (documents ?? []).length === 0 ? (
          <p className="mt-5 text-sm text-subtle">Nenhum documento enviado ainda.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {(documents ?? []).map((doc) => (
              <li key={doc.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{doc.nome}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-gold">
                          {tagLabel(doc.tag)}
                        </span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>· {formatSize(doc.size_bytes)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={doc.tag}
                      onValueChange={(value) =>
                        updateTag.mutate(
                          { id: doc.id, tag: value as DocTag },
                          {
                            onSuccess: () => toast.success("Etiqueta atualizada."),
                            onError: () => toast.error("Não foi possível atualizar."),
                          },
                        )
                      }
                    >
                      <SelectTrigger className="h-9 w-[190px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TAGS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Abrir documento"
                      className="text-subtle hover:text-foreground"
                      onClick={() => {
                        void documentSignedUrl(doc.storage_path).then((url) => {
                          if (url) window.open(url, "_blank", "noopener");
                          else toast.error("Não foi possível abrir o arquivo.");
                        });
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover documento"
                      className="text-subtle hover:text-danger"
                      onClick={() =>
                        removeDoc.mutate(doc, {
                          onSuccess: () => toast.success("Documento removido."),
                          onError: () => toast.error("Não foi possível remover."),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-gold/40 bg-transparent text-gold hover:bg-gold/10"
                  onClick={() => {
                    void navigate({ to: "/ia/risco", search: { doc: doc.id } });
                  }}
                >
                  <ScrollText className="mr-2 h-4 w-4" />
                  Usar na Análise de risco
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AiDisclaimer />
    </div>
  );
}
