import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ScanLine, Upload } from "lucide-react";
import { toast } from "sonner";

import { DiagnosticContextCard } from "@/components/ia/diagnostic-context-card";
import { Button } from "@/components/ui/button";
import { useDiagnosticContext } from "@/lib/diagnostic-context";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);

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

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center transition-colors hover:border-gold/50"
        >
          <Upload className="h-6 w-6 text-gold" />
          <span className="text-sm text-foreground">Selecionar arquivos</span>
          <span className="text-xs text-subtle">PDF, JPG ou PNG · até 10 MB por arquivo</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []).map((f) => ({
              name: f.name,
              size: f.size,
            }));
            if (selected.length === 0) return;
            setFiles((prev) => [...prev, ...selected]);
            toast.success(`${selected.length} arquivo(s) na fila de leitura.`);
          }}
        />

        {files.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
              >
                <FileText className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto shrink-0 text-xs text-subtle">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-5 text-xs leading-relaxed text-subtle">
          A extração automática de texto será ativada em breve. Enquanto isso, cole o conteúdo em{" "}
          <Link to="/ia/risco" className="text-gold hover:text-gold-light">
            Análise de risco
          </Link>{" "}
          para avaliação imediata.
        </p>
      </section>
    </div>
  );
}
