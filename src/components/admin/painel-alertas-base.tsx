import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, BellRing, Check, ExternalLink, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listarAlertasMudanca, marcarAlertaLido } from "@/lib/legal-ingest.functions";

const TIPO = {
  alterada: { label: "Norma alterada", cor: "text-[#D9A648]", Icone: AlertTriangle },
  revogada: { label: "Norma revogada", cor: "text-[#E0655F]", Icone: ShieldOff },
  falha: { label: "Falha na coleta", cor: "text-[#9CA3AF]", Icone: AlertTriangle },
} as const;

/** Avisos da rotina automática: norma alterada, revogada ou fonte inacessível. */
export function PainelAlertasBase() {
  const listar = useServerFn(listarAlertasMudanca);
  const marcar = useServerFn(marcarAlertaLido);
  const queryClient = useQueryClient();

  const alertas = useQuery({
    queryKey: ["base-juridica-alertas"],
    queryFn: () => listar({}),
  });

  const lido = useMutation({
    mutationFn: (id: string) => marcar({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["base-juridica-alertas"] });
    },
  });

  const pendentes = (alertas.data ?? []).filter((a) => !a.read_at);

  return (
    <section className="mt-10 rounded-2xl border border-[#242424] bg-[#141414] p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl text-[#EDE3C8]">
            <BellRing className="h-4 w-4 text-[#C8A96A]" />
            Alertas da atualização automática
          </h2>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            A base jurídica é reconferida automaticamente nas fontes oficiais. Alterações,
            revogações e falhas de coleta aparecem aqui e são enviadas por e-mail aos
            administradores.
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.18em] text-[#6B7280]">
          {pendentes.length} pendente(s)
        </span>
      </header>

      {alertas.isLoading ? (
        <Skeleton className="mt-6 h-24 w-full rounded-xl" />
      ) : (alertas.data ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-[#6B7280]">
          Nenhuma mudança detectada até agora — todas as normas conferidas seguem idênticas ao texto
          oficial.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {(alertas.data ?? []).map((a) => {
            const meta = TIPO[a.tipo];
            const Icone = meta.Icone;
            return (
              <li
                key={a.id}
                className={`rounded-xl border border-[#242424] p-4 ${a.read_at ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`flex items-center gap-2 text-xs uppercase tracking-[0.18em] ${meta.cor}`}
                    >
                      <Icone className="h-3.5 w-3.5" />
                      {meta.label}
                    </p>
                    <p className="mt-1 text-sm text-[#F5F5F5]">
                      {a.title}
                      {a.version ? ` · versão ${a.version}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-[#9CA3AF]">{a.mensagem}</p>
                    <p className="mt-2 text-xs text-[#6B7280]">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                      {a.notified_at ? " · e-mail enviado" : " · e-mail não enviado"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.official_url ? (
                      <a
                        href={a.official_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#C8A96A]"
                      >
                        Fonte oficial <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {a.read_at ? null : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => lido.mutate(a.id)}
                        disabled={lido.isPending}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Tratado
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
