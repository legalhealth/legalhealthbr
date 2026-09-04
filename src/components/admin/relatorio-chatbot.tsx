import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { useRelatorioChatbot, type PeriodoDias } from "@/lib/admin-relatorios";

const FONTE_LABEL: Record<string, string> = {
  "base-qa": "Base própria de perguntas",
  "base-fontes": "Trechos oficiais das normas",
  ia: "Resposta gerada por IA",
};

export function RelatorioChatbot({ dias }: { dias: PeriodoDias }) {
  const { data, isLoading, isError } = useRelatorioChatbot(dias);

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Não foi possível carregar os dados do chatbot agora.
      </p>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const cartoes = [
    { label: "Conversas iniciadas", valor: data.conversas },
    { label: "Mensagens trocadas", valor: data.mensagens },
    { label: "Média por conversa", valor: data.mediaPorConversa },
    { label: "Conversas com mais de uma pergunta", valor: data.conversasComVariasPerguntas },
    { label: "Conversas de usuários com conta", valor: data.conversasLogadas },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartoes.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-lg text-foreground">Conversas por dia</h3>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.porDia}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="dia"
                tickFormatter={(v: string) => v.slice(8, 10) + "/" + v.slice(5, 7)}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
              />
              <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="total" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-lg text-foreground">Origem das respostas</h3>
          {data.origens.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma resposta registrada no período.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.origens.map((o) => (
                <li
                  key={o.fonte}
                  className="flex justify-between border-b border-border pb-2 last:border-0"
                >
                  <span className="text-muted-foreground">{FONTE_LABEL[o.fonte] ?? o.fonte}</span>
                  <span className="text-foreground">{o.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-lg text-foreground">Perguntas sem cobertura na base</h3>
          <p className="mt-1 text-xs text-subtle">
            Prioridade para ampliar a base própria de conhecimento.
          </p>
          {data.lacunas.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma lacuna registrada.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.lacunas.map((l) => (
                <li
                  key={l.pergunta}
                  className="flex gap-3 border-b border-border pb-2 last:border-0"
                >
                  <span className="flex-1 text-muted-foreground">{l.pergunta}</span>
                  <span className="text-foreground">{l.ocorrencias}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
