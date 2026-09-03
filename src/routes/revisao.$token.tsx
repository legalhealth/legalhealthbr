import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, Loader2, Paperclip, ShieldCheck } from "lucide-react";

import { getLevel, pillarColor, type PillarScore } from "@/lib/juriscore";

type Payload = {
  revisao: {
    id: string;
    status: string;
    mensagem: string | null;
    enviado_em: string;
    advogado_nome: string;
    advogado_oab: string | null;
    parecer: string | null;
    parecer_em: string | null;
  };
  peca: { titulo: string; tipo: string | null; conteudo: string };
  medico: {
    nome: string;
    crm: string | null;
    especialidade: string | null;
    cidade: string | null;
    clinica: string | null;
  };
  juriscore: { score: number; by_pillar: unknown; created_at: string } | null;
  anexos: { nome: string; tag: string; url: string; texto: string | null }[];
  comentarios: { id: string; autor: string; papel: string; conteudo: string; created_at: string }[];
  expira_em: string;
};

export const Route = createFileRoute("/revisao/$token")({
  head: () => ({
    meta: [
      { title: "Revisão jurídica segura | Legal Health" },
      {
        name: "description",
        content:
          "Acesso seguro do advogado responsável à peça enviada, com a intimação anexada e o Juriscore do profissional.",
      },
      { property: "og:title", content: "Revisão jurídica segura | Legal Health" },
      {
        property: "og:description",
        content: "Peça, intimação anexada e Juriscore do profissional em acesso seguro por link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function Page() {
  const { token } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["revisao-publica", token],
    retry: false,
    queryFn: async (): Promise<Payload> => {
      const response = await fetch(`/api/public/revisao/${token}`);
      const payload = (await response.json()) as Payload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível abrir esta revisão.");
      return payload;
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <span className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Abrindo a revisão…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warn" />
          <h1 className="mt-4 font-display text-2xl text-foreground">Acesso indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Link inválido."}
          </p>
        </div>
      </div>
    );
  }

  const pilares = Array.isArray(data.juriscore?.by_pillar)
    ? (data.juriscore?.by_pillar as PillarScore[])
    : [];
  const nivel = data.juriscore ? getLevel(data.juriscore.score) : null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <header className="text-center">
        <p className="wordmark text-lg text-gold-light">Legal Health</p>
        <p className="mt-1 text-[0.6rem] uppercase tracking-[0.28em] text-gold">
          antecipe · decida · proteja
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-muted">
            <ShieldCheck className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h1 className="font-display text-xl text-foreground">{data.peca.titulo}</h1>
            <p className="text-sm text-muted-foreground">
              Enviado por {data.medico.nome}
              {data.medico.crm ? ` · CRM ${data.medico.crm}` : ""} em{" "}
              {formatDateTime(data.revisao.enviado_em)}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Protocolo</dt>
            <dd className="text-foreground">{data.revisao.id.slice(0, 8)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Advogado responsável</dt>
            <dd className="text-foreground">
              {data.revisao.advogado_nome}
              {data.revisao.advogado_oab ? ` — ${data.revisao.advogado_oab}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Situação</dt>
            <dd className="text-foreground">{data.revisao.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Link válido até</dt>
            <dd className="text-foreground">{formatDateTime(data.expira_em)}</dd>
          </div>
        </dl>
        {data.revisao.mensagem ? (
          <p className="mt-5 whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {data.revisao.mensagem}
          </p>
        ) : null}
      </section>

      {data.juriscore ? (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg text-foreground">Juriscore® do profissional</h2>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-4xl text-gold">{data.juriscore.score}</span>
            <span className="text-sm text-muted-foreground">
              /100 · {nivel?.name} · diagnóstico de {formatDateTime(data.juriscore.created_at)}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {pilares.map((pilar) => (
              <div key={pilar.id}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pilar.name}</span>
                  <span>{pilar.percent}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${pilar.percent}%`,
                      backgroundColor: pillarColor(pilar.percent),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <Paperclip className="h-4 w-4 text-gold" /> Intimação e documentos anexados (
          {data.anexos.length})
        </h2>
        {data.anexos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum documento anexado.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.anexos.map((anexo) => (
              <li key={anexo.nome} className="rounded-xl border border-border bg-muted/30 p-4">
                <a
                  href={anexo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-gold underline-offset-4 hover:underline"
                >
                  {anexo.nome}
                </a>
                {anexo.texto ? (
                  <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-muted-foreground">
                    {anexo.texto}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <FileText className="h-4 w-4 text-gold" /> Conteúdo da peça
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {data.peca.conteudo || "Peça sem conteúdo registrado."}
        </p>
      </section>

      {data.revisao.parecer ? (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg text-foreground">Parecer registrado</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {data.revisao.parecer}
          </p>
        </section>
      ) : null}

      <p className="mt-8 text-center text-xs text-subtle">
        Conteúdo gerado com apoio de inteligência artificial na plataforma Legal Health — sujeito a
        revisão e validação do advogado responsável. Acesso registrado para fins de auditoria.
      </p>
    </main>
  );
}
