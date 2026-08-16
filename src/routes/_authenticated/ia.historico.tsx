import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSignature, History, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STATUS_META,
  formatDateTime,
  origemLabel,
  statusMeta,
  useDeleteHistoryItem,
  useIaHistory,
  useUpdateHistoryStatus,
  type HistoryStatus,
} from "@/lib/ia-history";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";

export const Route = createFileRoute("/_authenticated/ia/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de IA | Legal Health" },
      {
        name: "description",
        content:
          "Revise suas análises de risco e peças geradas, com data e status de cada item.",
      },
      { property: "og:title", content: "Histórico de IA | Legal Health" },
      {
        property: "og:description",
        content:
          "Revise suas análises de risco e peças geradas, com data e status de cada item.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "risco", label: "Análises de risco" },
  { value: "peca", label: "Peças geradas" },
] as const;

function Page() {
  const { data, isLoading } = useIaHistory();
  const updateStatus = useUpdateHistoryStatus();
  const removeItem = useDeleteHistoryItem();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const items = (data ?? []).filter((item) =>
    filter === "todos" ? true : item.origem === filter,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <History className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h2 className="font-serif text-xl text-foreground">Histórico</h2>
            <p className="text-sm text-muted-foreground">
              Análises de risco e peças geradas, com data e status.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                filter === f.value
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum item registrado ainda. Gere uma peça ou faça uma análise de risco para
            começar seu histórico.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
            >
              <Link to="/ia/peca">
                <FileSignature className="mr-2 h-4 w-4" />
                Redigir peça
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border bg-transparent text-muted-foreground hover:text-foreground"
            >
              <Link to="/ia/risco">
                <ScrollText className="mr-2 h-4 w-4" />
                Analisar intimação
              </Link>
            </Button>
          </div>
        </section>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = statusMeta(item.status);
            const isOpen = openId === item.id;
            return (
              <li key={item.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">
                        {origemLabel(item.origem)}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[0.7rem] ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <h3 className="mt-2 font-serif text-lg leading-snug text-foreground">
                      {item.titulo ?? "Documento sem título"}
                    </h3>
                    <p className="mt-1 text-xs text-subtle">
                      Criado em {formatDateTime(item.created_at)}
                      {item.updated_at !== item.created_at
                        ? ` · atualizado em ${formatDateTime(item.updated_at)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={item.status}
                      onValueChange={(value) =>
                        updateStatus.mutate(
                          { id: item.id, status: value as HistoryStatus },
                          {
                            onSuccess: () => toast.success("Status atualizado."),
                            onError: () => toast.error("Não foi possível atualizar."),
                          },
                        )
                      }
                    >
                      <SelectTrigger className="h-9 w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_META).map(([value, m]) => (
                          <SelectItem key={value} value={value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-subtle hover:text-danger"
                      onClick={() =>
                        removeItem.mutate(item.id, {
                          onSuccess: () => toast.success("Item removido."),
                          onError: () => toast.error("Não foi possível remover."),
                        })
                      }
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                  >
                    {isOpen ? "Ocultar conteúdo" : "Ver conteúdo"}
                  </Button>
                  {item.conteudo ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
                      onClick={() => {
                        void navigator.clipboard.writeText(item.conteudo ?? "");
                        toast.success("Conteúdo copiado.");
                      }}
                    >
                      Copiar
                    </Button>
                  ) : null}
                </div>

                {isOpen ? (
                  <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-border bg-background p-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                    {item.conteudo ?? "Sem conteúdo salvo."}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <AiDisclaimer />
    </div>
  );
}