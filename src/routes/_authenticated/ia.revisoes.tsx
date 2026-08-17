import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSignature, MessageSquare, Paperclip, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AiDisclaimer } from "@/components/ia/ai-disclaimer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { tagLabel, useDocuments } from "@/lib/ia-documents";
import { formatDateTime, useIaHistory } from "@/lib/ia-history";
import {
  REVISAO_STATUS_META,
  revisaoStatusMeta,
  useAdicionarComentario,
  useAtualizarRevisaoStatus,
  useRevisaoComentarios,
  useRevisoes,
  type Revisao,
  type RevisaoStatus,
} from "@/lib/ia-revisoes";

export const Route = createFileRoute("/_authenticated/ia/revisoes")({
  head: () => ({
    meta: [
      { title: "Revisões do advogado | Legal Health" },
      {
        name: "description",
        content:
          "Acompanhe as peças enviadas ao advogado responsável, com status de revisão, comentários e rastreabilidade.",
      },
      { property: "og:title", content: "Revisões do advogado | Legal Health" },
      {
        property: "og:description",
        content:
          "Acompanhe as peças enviadas ao advogado responsável, com status de revisão, comentários e rastreabilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: revisoes, isLoading } = useRevisoes();
  const { data: history } = useIaHistory();
  const { data: documents } = useDocuments();
  const updateStatus = useAtualizarRevisaoStatus();
  const [openId, setOpenId] = useState<string | null>(null);

  const docTitle = (docId: string) =>
    history?.find((h) => h.id === docId)?.titulo ?? "Peça removida do histórico";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl glass-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
            <ShieldCheck className="h-5 w-5 text-gold" />
          </span>
          <div>
            <h2 className="font-display text-xl text-foreground">Revisão do advogado</h2>
            <p className="text-sm text-muted-foreground">
              Peças enviadas para revisão jurídica, com status, comentários e anexos.
            </p>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : (revisoes ?? []).length === 0 ? (
        <section className="rounded-2xl glass-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma peça enviada para revisão. Gere uma peça e use “Enviar ao advogado” para iniciar
            o fluxo de revisão.
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-5 border-gold/40 bg-transparent text-gold hover:bg-gold/10"
          >
            <Link to="/ia/peca">
              <FileSignature className="mr-2 h-4 w-4" />
              Redigir peça
            </Link>
          </Button>
        </section>
      ) : (
        <ul className="space-y-3">
          {(revisoes ?? []).map((revisao) => {
            const meta = revisaoStatusMeta(revisao.status);
            const anexos = (documents ?? []).filter((d) => revisao.document_ids.includes(d.id));
            return (
              <li key={revisao.id} className="rounded-2xl glass-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[0.7rem] ${meta.className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <h3 className="mt-2 font-display text-lg leading-snug text-foreground">
                      {docTitle(revisao.doc_id)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {revisao.advogado_nome}
                      {revisao.advogado_oab ? ` · ${revisao.advogado_oab}` : ""} ·{" "}
                      {revisao.advogado_email}
                    </p>
                    <p className="mt-1 text-xs text-subtle">
                      Enviada em {formatDateTime(revisao.enviado_em)}
                      {revisao.concluido_em
                        ? ` · aprovada em ${formatDateTime(revisao.concluido_em)}`
                        : ""}
                    </p>
                  </div>

                  <Select
                    value={revisao.status}
                    onValueChange={(value) =>
                      updateStatus.mutate(
                        { revisao, status: value as RevisaoStatus },
                        {
                          onSuccess: () => toast.success("Status de revisão atualizado."),
                          onError: () => toast.error("Não foi possível atualizar o status."),
                        },
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-[210px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REVISAO_STATUS_META).map(([value, m]) => (
                        <SelectItem key={value} value={value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {anexos.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {anexos.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
                      >
                        <Paperclip className="h-3 w-3 text-gold" />
                        {doc.nome} · {tagLabel(doc.tag)}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-border bg-transparent text-muted-foreground hover:text-foreground"
                  onClick={() => setOpenId(openId === revisao.id ? null : revisao.id)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {openId === revisao.id ? "Ocultar comentários" : "Comentários e histórico"}
                </Button>

                {openId === revisao.id ? <Comentarios revisao={revisao} /> : null}
              </li>
            );
          })}
        </ul>
      )}
      <AiDisclaimer />
    </div>
  );
}

function Comentarios({ revisao }: { revisao: Revisao }) {
  const { data: comentarios, isLoading } = useRevisaoComentarios(revisao.id);
  const addComment = useAdicionarComentario();
  const [texto, setTexto] = useState("");
  const [papel, setPapel] = useState<"medico" | "advogado">("advogado");

  const submit = () => {
    if (texto.trim().length < 3) {
      toast.error("Escreva o comentário antes de salvar.");
      return;
    }
    addComment.mutate(
      {
        revisaoId: revisao.id,
        autor: papel === "advogado" ? revisao.advogado_nome : "Você",
        papel,
        conteudo: texto.trim(),
      },
      {
        onSuccess: () => {
          setTexto("");
          toast.success("Comentário registrado.");
        },
        onError: () => toast.error("Não foi possível salvar o comentário."),
      },
    );
  };

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border bg-background p-4">
      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : (comentarios ?? []).length === 0 ? (
        <p className="text-sm text-subtle">Nenhum comentário registrado nesta revisão.</p>
      ) : (
        <ul className="space-y-3">
          {(comentarios ?? []).map((c) => (
            <li key={c.id} className="rounded-xl glass-card px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-foreground">{c.autor}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase ${
                    c.papel === "advogado"
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-info/40 bg-info/10 text-info"
                  }`}
                >
                  {c.papel === "advogado" ? "Advogado" : "Médico"}
                </span>
                <span className="text-xs text-subtle">{formatDateTime(c.created_at)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.conteudo}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["advogado", "medico"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPapel(value)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                papel === value
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-border bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "advogado" ? "Parecer do advogado" : "Minha observação"}
            </button>
          ))}
        </div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Registre o parecer recebido, ajustes solicitados ou o andamento da revisão."
          className="min-h-[90px]"
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={addComment.isPending}
          className="gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
        >
          {addComment.isPending ? "Salvando..." : "Registrar comentário"}
        </Button>
      </div>
    </div>
  );
}
