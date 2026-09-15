import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TRILHA, useProgressoTrilha, type PassoTrilha } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/** Destino do passo, já com a aba certa quando ele abre a Biblioteca. */
function destino(passo: PassoTrilha) {
  return passo.to === "/biblioteca"
    ? ({ to: "/biblioteca", search: { cat: passo.cat ?? "minutas" } } as const)
    : ({ to: passo.to } as const);
}

/** Cartão fixo no Início: mostra em que ponto da trilha o profissional está. */
export function TrilhaProgresso() {
  const { data: progresso, isPending } = useProgressoTrilha();
  if (isPending || !progresso) return null;

  const feitos = TRILHA.filter((passo) => progresso[passo.id]).length;

  if (progresso.concluida) {
    return (
      <section className="rounded-2xl glass-card p-5 md:p-6">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <Sparkles className="h-4 w-4 text-gold" />
          Primeiros passos concluídos
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Juriscore® calculado, riscos priorizados, triagem por voz gravada e primeira minuta
          gerada. Agora acompanhe o plano de ação e mantenha os documentos atualizados.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl glass-card p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg text-foreground">Seus primeiros passos</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {feitos} de {TRILHA.length} concluídos — do Juriscore® à sua primeira minuta.
          </p>
        </div>
        {progresso.proximo ? (
          <Button
            asChild
            className="h-11 w-full shrink-0 gold-gradient text-background shadow-[var(--shadow-gold)] hover:brightness-105 sm:h-9 sm:w-auto"
          >
            <Link {...destino(progresso.proximo)}>
              {progresso.proximo.acao}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>

      <ol className="mt-5 space-y-4">
        {TRILHA.map((passo, index) => {
          const concluido = progresso[passo.id];
          const atual = progresso.proximo?.id === passo.id;
          return (
            <li key={passo.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  concluido
                    ? "border-success/40 bg-success/10 text-success"
                    : atual
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-border text-muted-foreground",
                )}
              >
                {concluido ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" />}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "break-words text-sm",
                    concluido ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {index + 1}. {passo.titulo}
                </p>
                <p className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground">
                  {passo.descricao}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Rodapé discreto ao fim de um passo, apontando o próximo da trilha. */
export function TrilhaRodape({ depoisDe }: { depoisDe: "juriscore" | "riscos" | "voz" }) {
  const { data: progresso } = useProgressoTrilha();
  if (!progresso || progresso.concluida) return null;
  const proximo = progresso.proximo;
  if (!proximo) return null;
  // Enquanto o passo atual for o próprio passo desta tela, nada a sugerir.
  if (proximo.id === depoisDe) return null;

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/5 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Próximo passo dos seus primeiros passos: {proximo.titulo.toLowerCase()}.
      </p>
      <Button
        asChild
        variant="outline"
        className="h-11 w-full shrink-0 border-gold/40 text-gold hover:bg-gold/10 sm:h-9 sm:w-auto"
      >
        <Link {...destino(proximo)}>
          {proximo.acao}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
