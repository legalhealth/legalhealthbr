import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  baixarCsvCandidaturas,
  STATUS_CANDIDATURA,
  useAtualizarStatusCandidatura,
  useCandidaturas,
  type PeriodoDias,
} from "@/lib/admin-relatorios";

const STATUS_LABEL = new Map(STATUS_CANDIDATURA.map((s) => [s.valor as string, s.label]));

function contar(valores: (string | null)[]) {
  const mapa = new Map<string, number>();
  for (const v of valores) {
    const chave = v?.trim() || "Não informado";
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([rotulo, total]) => ({ rotulo, total }))
    .sort((a, b) => b.total - a.total);
}

export function RelatorioCandidaturas({ dias }: { dias: PeriodoDias }) {
  const { data, isLoading, isError } = useCandidaturas(dias);
  const atualizar = useAtualizarStatusCandidatura();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todas");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      const okStatus = status === "todas" || c.status === status;
      const okBusca =
        !termo || c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo);
      return okStatus && okBusca;
    });
  }, [data, busca, status]);

  const porProfissao = useMemo(() => contar((data ?? []).map((c) => c.profissao)), [data]);
  const porEstado = useMemo(() => contar((data ?? []).map((c) => c.estado)), [data]);
  const aceiteContato = useMemo(() => {
    const lista = data ?? [];
    if (lista.length === 0) return 0;
    return Math.round((lista.filter((c) => c.consentimento_contato).length / lista.length) * 100);
  }, [data]);

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar as candidaturas agora.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Candidaturas no período</p>
          <p className="mt-1 font-display text-2xl text-foreground">{(data ?? []).length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Aceitaram receber contato</p>
          <p className="mt-1 font-display text-2xl text-foreground">{aceiteContato}%</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Estados representados</p>
          <p className="mt-1 font-display text-2xl text-foreground">{porEstado.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Input
            aria-label="Buscar por nome ou e-mail"
            placeholder="Buscar por nome ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={status === "todas" ? "secondary" : "outline"}
          className="h-10 rounded-xl px-4"
          onClick={() => setStatus("todas")}
        >
          Todas
        </Button>
        {STATUS_CANDIDATURA.map((s) => (
          <Button
            key={s.valor}
            variant={status === s.valor ? "secondary" : "outline"}
            className="h-10 rounded-xl px-4"
            onClick={() => setStatus(s.valor)}
          >
            {s.label}
          </Button>
        ))}
        <Button
          variant="outline"
          className="h-10 rounded-xl px-4"
          onClick={() => {
            baixarCsvCandidaturas(filtradas);
            toast.info("Planilha baixada. O arquivo contém dados pessoais: guarde com cuidado.");
          }}
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Exportar planilha
        </Button>
      </div>

      {filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma candidatura encontrada com esses filtros.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((c) => (
            <li key={c.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-foreground">{c.nome}</p>
                  <p className="text-sm text-muted-foreground">{c.email}</p>
                  <p className="mt-1 text-xs text-subtle">
                    {c.profissao} · {c.estado}
                    {c.cidade ? ` · ${c.cidade}` : ""}
                    {c.tipo_atuacao ? ` · ${c.tipo_atuacao}` : ""}
                  </p>
                  {c.comunidade_tamanho ? (
                    <p className="text-xs text-subtle">Comunidade: {c.comunidade_tamanho}</p>
                  ) : null}
                  {c.link_profissional ? (
                    <a
                      href={c.link_profissional}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs text-gold underline underline-offset-4"
                    >
                      Link informado
                    </a>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xs text-subtle">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-foreground">
                    {STATUS_LABEL.get(c.status) ?? c.status}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_CANDIDATURA.map((s) => (
                  <Button
                    key={s.valor}
                    variant={c.status === s.valor ? "default" : "outline"}
                    disabled={atualizar.isPending || c.status === s.valor}
                    className={
                      c.status === s.valor
                        ? "gold-gradient h-9 rounded-xl px-3 text-xs text-primary-foreground"
                        : "h-9 rounded-xl px-3 text-xs"
                    }
                    onClick={() =>
                      atualizar.mutate(
                        { id: c.id, status: s.valor },
                        {
                          onSuccess: () => toast.success(`Situação alterada para ${s.label}.`),
                          onError: () => toast.error("Não foi possível alterar a situação."),
                        },
                      )
                    }
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-lg text-foreground">Por profissão</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {porProfissao.map((p) => (
              <li
                key={p.rotulo}
                className="flex justify-between border-b border-border pb-2 last:border-0"
              >
                <span className="text-muted-foreground">{p.rotulo}</span>
                <span className="text-foreground">{p.total}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-lg text-foreground">Por estado</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {porEstado.map((p) => (
              <li
                key={p.rotulo}
                className="flex justify-between border-b border-border pb-2 last:border-0"
              >
                <span className="text-muted-foreground">{p.rotulo}</span>
                <span className="text-foreground">{p.total}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
