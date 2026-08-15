import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Trash2 } from "lucide-react";
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
  REC_STATUS_META,
  recStatusMeta,
  useDeleteRecommendation,
  useRecommendations,
  useUpdateRecommendationStatus,
  type RecommendationStatus,
} from "@/lib/ia-recommendations";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({
    meta: [
      { title: "Plano de Proteção | Legal Health" },
      { name: "description", content: "Seu plano de ação jurídica preventiva, com prioridades e prazos." },
      { property: "og:title", content: "Plano de Proteção | Legal Health" },
      { property: "og:description", content: "Seu plano de ação jurídica preventiva, com prioridades e prazos." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: recommendations, isLoading } = useRecommendations();
  const updateStatus = useUpdateRecommendationStatus();
  const removeRec = useDeleteRecommendation();

  const items = recommendations ?? [];
  const done = items.filter((r) => r.status === "concluida").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <header className="space-y-3">
        <p className="text-[0.7rem] tracking-[0.22em] text-subtle uppercase">Plano de Proteção</p>
        <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
          Plano de ação
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          As recomendações salvas no Assistente viram ações acompanhadas aqui.
          {items.length > 0 ? ` Concluídas: ${done}/${items.length}.` : ""}
        </p>
      </header>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted">
            <ClipboardList className="h-5 w-5 text-gold" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma ação no plano ainda. Converse com o Assistente e salve as recomendações que
            deseja acompanhar.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-5 bg-gold text-background hover:bg-gold-light"
          >
            <Link to="/ia/assistente">Falar com o Assistente</Link>
          </Button>
        </section>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((rec) => {
            const meta = recStatusMeta(rec.status);
            return (
              <li key={rec.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[0.7rem] ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {rec.content}
                    </p>
                    <p className="mt-2 text-xs text-subtle">
                      Salva em {new Date(rec.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={rec.status}
                      onValueChange={(value) =>
                        updateStatus.mutate(
                          { id: rec.id, status: value as RecommendationStatus },
                          {
                            onSuccess: () => toast.success("Ação atualizada."),
                            onError: () => toast.error("Não foi possível atualizar."),
                          },
                        )
                      }
                    >
                      <SelectTrigger className="h-9 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(REC_STATUS_META).map(([value, m]) => (
                          <SelectItem key={value} value={value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover ação"
                      className="text-subtle hover:text-danger"
                      onClick={() =>
                        removeRec.mutate(rec.id, {
                          onSuccess: () => toast.success("Ação removida."),
                          onError: () => toast.error("Não foi possível remover."),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
