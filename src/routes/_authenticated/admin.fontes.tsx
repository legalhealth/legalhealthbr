import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, ExternalLink, History, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { PainelIngestao } from "@/components/admin/painel-ingestao";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  NIVEL_AUTORIDADE_LABEL,
  STATUS_LABEL,
  useAtualizarFonte,
  useAuditoriaRespostas,
  useBloquearFonte,
  useLegalAlertas,
  useLegalFontes,
  useLegalVersoes,
  type LegalFonte,
} from "@/lib/legal-fontes";
import { useHasRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/fontes")({
  head: () => ({
    meta: [
      { title: "Governança da base jurídica | Legal Health" },
      {
        name: "description",
        content:
          "Fontes oficiais, versionamento de vigência, responsáveis, alertas de revisão e auditoria das respostas da IA.",
      },
      { property: "og:title", content: "Governança da base jurídica | Legal Health" },
      {
        property: "og:description",
        content:
          "Fontes oficiais, versionamento de vigência, responsáveis, alertas de revisão e auditoria das respostas da IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

const STATUS_COR: Record<string, string> = {
  vigente: "text-[#2FBF7B]",
  alterada: "text-[#D9A648]",
  em_revisao: "text-[#D9A648]",
  suspensa: "text-[#E0655F]",
  revogada: "text-[#E0655F]",
};

function Page() {
  const { has: isAdmin, isLoading: loadingRole } = useHasRole("admin");
  const { data: fontes, isLoading } = useLegalFontes();
  const { data: alertas } = useLegalAlertas();
  const { data: auditoria } = useAuditoriaRespostas();
  const [aberta, setAberta] = useState<string | null>(null);

  const alertasPorFonte = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const a of alertas ?? []) {
      mapa.set(a.source_uuid, [...(mapa.get(a.source_uuid) ?? []), a.alerta]);
    }
    return mapa;
  }, [alertas]);

  if (loadingRole) {
    return (
      <PageShell title="Governança da base jurídica">
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell
        title="Governança da base jurídica"
        description="Esta área é restrita aos responsáveis pela curadoria jurídica da plataforma."
      >
        <p className="mt-6 rounded-2xl glass-card px-5 py-4 text-sm text-muted-foreground">
          Sua conta não possui o papel de administrador. Fale com o responsável jurídico da Legal
          Health para receber acesso.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Governança da base jurídica"
      description="Fontes oficiais com metadados completos, versionamento de vigência, responsáveis por revisão e auditoria das respostas geradas."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Indicador titulo="Fontes cadastradas" valor={fontes?.length ?? 0} />
        <Indicador titulo="Alertas abertos" valor={alertas?.length ?? 0} tom="risco" />
        <Indicador titulo="Respostas auditadas" valor={auditoria?.length ?? 0} />
      </div>

      {(alertas ?? []).length > 0 ? (
        <div className="mt-6 rounded-2xl glass-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle className="size-4 text-[#D9A648]" /> Alertas de governança
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {(alertas ?? []).slice(0, 20).map((a, i) => (
              <li key={`${a.source_uuid}-${i}`}>
                <span className="text-foreground">{a.title}</span> — {a.alerta}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <h2 className="mt-10 text-sm tracking-[0.2em] text-primary uppercase">Fontes</h2>
      {isLoading ? (
        <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
      ) : (
        <div className="mt-4 space-y-3">
          {(fontes ?? []).map((fonte) => (
            <FonteCard
              key={fonte.id}
              fonte={fonte}
              alertas={alertasPorFonte.get(fonte.id) ?? []}
              aberta={aberta === fonte.id}
              onToggle={() => setAberta(aberta === fonte.id ? null : fonte.id)}
            />
          ))}
        </div>
      )}

      <PainelIngestao />

      <h2 className="mt-10 text-sm tracking-[0.2em] text-primary uppercase">

        Auditoria de respostas
      </h2>
      <div className="mt-4 space-y-2">
        {(auditoria ?? []).length === 0 ? (
          <p className="rounded-2xl glass-card px-5 py-4 text-sm text-muted-foreground">
            Nenhuma resposta registrada ainda.
          </p>
        ) : (
          (auditoria ?? []).slice(0, 20).map((item) => (
            <div key={item.id} className="rounded-2xl glass-card px-5 py-4 text-sm">
              <p className="text-foreground">{item.pergunta}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString("pt-BR")} · origem {item.origem} · fonte{" "}
                {item.fonte}
                {item.nivel_risco ? ` · risco ${item.nivel_risco}` : ""}
                {item.exige_advogado ? " · exige advogado" : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}

function Indicador({
  titulo,
  valor,
  tom,
}: {
  titulo: string;
  valor: number;
  tom?: "risco";
}) {
  return (
    <div className="rounded-2xl glass-card px-5 py-4">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{titulo}</p>
      <p
        className={`mt-2 font-display text-3xl ${tom === "risco" && valor > 0 ? "text-[#D9A648]" : "text-foreground"}`}
      >
        {valor}
      </p>
    </div>
  );
}

function FonteCard({
  fonte,
  alertas,
  aberta,
  onToggle,
}: {
  fonte: LegalFonte;
  alertas: string[];
  aberta: boolean;
  onToggle: () => void;
}) {
  const { data: versoes } = useLegalVersoes(aberta ? fonte.id : null);
  const atualizar = useAtualizarFonte();
  const bloquear = useBloquearFonte();
  const [responsavel, setResponsavel] = useState(fonte.responsavel_juridico ?? "");
  const [observacao, setObservacao] = useState("");

  return (
    <div className="rounded-2xl glass-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.95rem] text-foreground">
            {fonte.title}
            {fonte.number ? ` · ${fonte.number}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {fonte.issuing_body} · {NIVEL_AUTORIDADE_LABEL[fonte.authority_level]} ·{" "}
            <span className={STATUS_COR[fonte.status] ?? "text-muted-foreground"}>
              {STATUS_LABEL[fonte.status]}
            </span>
            {fonte.pilar ? ` · pilar ${fonte.pilar}` : ""}
          </p>
          <p className="mt-1 text-xs text-subtle">
            Última conferência:{" "}
            {fonte.last_checked_at
              ? new Date(fonte.last_checked_at).toLocaleDateString("pt-BR")
              : "nunca"}
            {fonte.responsavel_juridico ? ` · jurídico: ${fonte.responsavel_juridico}` : ""}
          </p>
          {alertas.length > 0 ? (
            <p className="mt-2 text-xs text-[#D9A648]">{alertas.join(" · ")}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {fonte.official_url ? (
            <a
              href={fonte.official_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-11 items-center gap-1 text-xs text-primary"
            >
              <ExternalLink className="size-3.5" /> Fonte oficial
            </a>
          ) : null}
          <Button variant="outline" size="sm" onClick={onToggle}>
            <History className="mr-1 size-4" /> {aberta ? "Fechar" : "Versões"}
          </Button>
        </div>
      </div>

      {aberta ? (
        <div className="mt-5 space-y-4 border-t border-border/60 pt-5">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Histórico de versões
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {(versoes ?? []).map((v) => (
                <li key={v.id}>
                  v{v.version} · {STATUS_LABEL[v.status]} · vigência{" "}
                  {v.effective_from ?? "não definida"}
                  {v.effective_until ? ` até ${v.effective_until}` : ""} ·{" "}
                  {v.published ? "publicada" : "não publicada"} · hash{" "}
                  {v.content_hash.slice(0, 8)}
                  {v.reviewed_by ? ` · revisão de ${v.reviewed_by}` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground" htmlFor={`resp-${fonte.id}`}>
                Responsável jurídico
              </label>
              <Input
                id={`resp-${fonte.id}`}
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome do advogado responsável"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground" htmlFor={`obs-${fonte.id}`}>
                Observação de revisão
              </label>
              <Textarea
                id={`obs-${fonte.id}`}
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Limitações, interpretação ou ponto de atenção"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                atualizar.mutate(
                  {
                    id: fonte.id,
                    responsavel_juridico: responsavel.trim() || null,
                    marcarConferida: true,
                  },
                  {
                    onSuccess: () => toast.success("Fonte conferida e responsável registrado."),
                    onError: () => toast.error("Não foi possível salvar a conferência."),
                  },
                )
              }
              disabled={atualizar.isPending}
            >
              <BadgeCheck className="mr-1 size-4" /> Registrar conferência
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bloquear.mutate(
                  { sourceUuid: fonte.id, situacao: "suspensa" },
                  {
                    onSuccess: () =>
                      toast.success("Fonte suspensa: deixou de ser usada nas respostas."),
                    onError: () => toast.error("Não foi possível suspender a fonte."),
                  },
                )
              }
              disabled={bloquear.isPending || fonte.status === "suspensa"}
            >
              <ShieldOff className="mr-1 size-4" /> Suspender
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bloquear.mutate(
                  { sourceUuid: fonte.id, situacao: "revogada" },
                  {
                    onSuccess: () =>
                      toast.success("Fonte marcada como revogada; histórico preservado."),
                    onError: () => toast.error("Não foi possível marcar como revogada."),
                  },
                )
              }
              disabled={bloquear.isPending || fonte.status === "revogada"}
            >
              Marcar como revogada
            </Button>
          </div>
          <p className="text-xs text-subtle">
            Versões anteriores nunca são apagadas: ao suspender ou revogar, a versão vigente recebe
            fim de vigência e deixa de ser recuperada pela IA, mas continua disponível para auditar
            respostas antigas.
          </p>
        </div>
      ) : null}
    </div>
  );
}
