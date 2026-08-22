import { useEffect, useMemo, useState } from "react";
import { Check, Download, Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { formatSize, tagLabel, useDocuments } from "@/lib/ia-documents";
import { buildComprovante, useEnviarRevisao } from "@/lib/ia-revisoes";
import type { Revisao } from "@/lib/ia-revisoes";
import { enviarRevisaoEmail } from "@/lib/revisoes.functions";
import { useServerFn } from "@tanstack/react-start";

type Props = {
  docId: string;
  titulo: string;
  conteudo: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preselectedDocumentIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
};

export function EnviarRevisaoDialog({
  docId,
  titulo,
  conteudo,
  trigger,
  open: openProp,
  onOpenChange,
  preselectedDocumentIds,
  onSelectionChange,
}: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
  };
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [oab, setOab] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [selected, setSelected] = useState<string[]>(preselectedDocumentIds ?? []);
  const { data: documents } = useDocuments();
  const enviar = useEnviarRevisao();
  const enviarEmail = useServerFn(enviarRevisaoEmail);
  const [revisaoCriada, setRevisaoCriada] = useState<Revisao | null>(null);
  const [stage, setStage] = useState<
    "idle" | "enviando" | "processando" | "concluido" | "erro"
  >("idle");
  const [comprovante, setComprovante] = useState<{
    filename: string;
    content: string;
    anexos: { nome: string; tamanho: string }[];
    protocolo: string;
    enviadoEm: string;
  } | null>(null);

  const preselectedKey = (preselectedDocumentIds ?? []).join(",");

  // Ao abrir, sincroniza a seleção com os anexos ainda vigentes na tela de origem.
  useEffect(() => {
    if (!open) return;
    setSelected(preselectedDocumentIds ?? []);
    setComprovante(null);
    setStage("idle");
  }, [open, preselectedKey]);

  // Mantém apenas anexos que ainda existem na lista de documentos.
  const validSelected = useMemo(() => {
    if (!documents) return selected;
    const ids = new Set(documents.map((d) => d.id));
    return selected.filter((id) => ids.has(id));
  }, [documents, selected]);

  const selectedDocs = useMemo(
    () => (documents ?? []).filter((d) => validSelected.includes(d.id)),
    [documents, validSelected],
  );

  const applySelection = (next: string[]) => {
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggle = (id: string) =>
    applySelection(
      validSelected.includes(id)
        ? validSelected.filter((v) => v !== id)
        : [...validSelected, id],
    );

  const STAGE_META = {
    idle: { label: "", value: 0 },
    enviando: { label: "Registrando a revisão e preparando anexos...", value: 35 },
    processando: { label: "Enviando e-mail ao advogado...", value: 75 },
    concluido: { label: `Concluído — e-mail enviado para ${email.trim()}.`, value: 100 },
    erro: { label: "Revisão registrada, mas o e-mail não foi enviado.", value: 100 },
  } as const;

  const baixarComprovante = () => {
    if (!comprovante) return;
    const blob = new Blob([comprovante.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = comprovante.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const finalizar = (revisao: Revisao) => {
    const anexosResumo = selectedDocs.map((d) => ({
      nome: d.nome,
      tamanho: formatSize(d.size_bytes),
    }));
    const doc = buildComprovante({
      revisao,
      titulo,
      conteudo,
      anexos: anexosResumo,
    });
    setComprovante({
      ...doc,
      anexos: anexosResumo,
      protocolo: revisao.id,
      enviadoEm: new Date(revisao.enviado_em).toLocaleString("pt-BR"),
    });
  };

  const dispararEmail = async (revisao: Revisao) => {
    setStage("processando");
    const result = await enviarEmail({
      data: { revisaoId: revisao.id, titulo, conteudo },
    });
    if (!result.sent) {
      throw new Error(
        "O e-mail foi bloqueado para este destinatário (endereço com histórico de falha).",
      );
    }
    finalizar(revisao);
    setStage("concluido");
    toast.success(`E-mail enviado ao advogado (${result.destinatario}).`);
  };

  const handleSubmit = async () => {
    if (nome.trim().length < 3) {
      toast.error("Informe o nome do advogado responsável.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    let criada: Revisao | null = null;
    try {
      setStage("enviando");
      criada = await enviar.mutateAsync({
        docId,
        docTitulo: titulo,
        advogadoNome: nome.trim(),
        advogadoEmail: email.trim(),
        advogadoOab: oab,
        mensagem,
        documentIds: validSelected,
      });
      setRevisaoCriada(criada);

      await dispararEmail(criada);
      setMensagem("");
      applySelection([]);
    } catch (error) {
      setStage(criada ? "erro" : "idle");
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar a revisão.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger === null ? null : (
        <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="border-gold/40 bg-transparent text-gold hover:bg-gold/10"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar ao advogado
          </Button>
        )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Enviar para revisão</DialogTitle>
          <DialogDescription>
            A peça e os documentos selecionados vão para o advogado responsável. O status e os
            comentários ficam registrados no histórico.
          </DialogDescription>
        </DialogHeader>

        {comprovante ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/40 bg-success/10 p-4">
              <p className="flex items-center gap-2 text-sm text-success">
                <Check className="h-4 w-4" />
                Envio concluído
              </p>
              <p className="mt-2 text-xs text-subtle">
                Protocolo {comprovante.protocolo.slice(0, 8)} · {comprovante.enviadoEm}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">
                Resumo do envio
              </p>
              <p className="mt-2 text-sm text-foreground">{titulo}</p>
              <p className="mt-1 text-xs text-subtle">
                Para {nome.trim()} · {email.trim()}
              </p>
              <p className="mt-3 text-[0.7rem] tracking-[0.18em] text-subtle uppercase">
                Anexos ({comprovante.anexos.length})
              </p>
              {comprovante.anexos.length === 0 ? (
                <p className="mt-1 text-xs text-subtle">Nenhum anexo enviado.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {comprovante.anexos.map((a) => (
                    <li key={a.nome} className="flex items-center gap-2 text-sm text-foreground">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-gold" />
                      {a.nome}
                      <span className="text-xs text-subtle">{a.tamanho}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">Peça</p>
            <p className="mt-1 text-sm text-foreground">{titulo}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adv-nome">Advogado responsável</Label>
              <Input
                id="adv-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Dra. Marina Alves"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-oab">OAB (opcional)</Label>
              <Input
                id="adv-oab"
                value={oab}
                onChange={(e) => setOab(e.target.value)}
                placeholder="Ex.: OAB/CE 12345"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-email">E-mail do advogado</Label>
            <Input
              id="adv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="advogado@escritorio.com.br"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-msg">Mensagem ao advogado</Label>
            <Textarea
              id="adv-msg"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Contexto do caso, prazo desejado e pontos que precisam de atenção."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-gold" />
              Documentos anexos
            </Label>
            {selectedDocs.length > 0 ? (
              <div className="rounded-xl border border-gold/40 bg-gold/5 p-3">
                <p className="text-[0.7rem] tracking-[0.18em] text-subtle uppercase">
                  Serão enviados ({selectedDocs.length})
                </p>
                <ul className="mt-2 space-y-2">
                  {selectedDocs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0 text-gold" />
                      <span className="flex-1 text-sm text-foreground">
                        {doc.nome}
                        <span className="ml-2 text-xs text-subtle">
                          {formatSize(doc.size_bytes)}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${doc.nome} do envio`}
                        onClick={() => toggle(doc.id)}
                        className="text-subtle transition hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-subtle">
                Nenhum anexo selecionado — apenas a peça será enviada.
              </p>
            )}
            {(documents ?? []).length === 0 ? (
              <p className="text-xs text-subtle">
                Nenhum documento enviado ainda. Use a aba Documentos para anexar arquivos.
              </p>
            ) : (
              <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {(documents ?? []).map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2"
                  >
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={validSelected.includes(doc.id)}
                      onCheckedChange={() => toggle(doc.id)}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`doc-${doc.id}`} className="flex-1 cursor-pointer font-normal">
                      <span className="block text-sm text-foreground">{doc.nome}</span>
                      <span className="block text-xs text-subtle">
                        {tagLabel(doc.tag)} · {formatSize(doc.size_bytes)}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        )}

        <DialogFooter>
          {stage !== "idle" ? (
            <div className="mr-auto w-full space-y-2 sm:w-64">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {stage === "concluido" ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                )}
                <span>{STAGE_META[stage].label}</span>
              </div>
              <Progress value={STAGE_META[stage].value} className="h-1.5" />
            </div>
          ) : null}
          {comprovante ? (
            <>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-border bg-transparent"
              >
                Fechar
              </Button>
              <Button
                onClick={baixarComprovante}
                className="gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar comprovante
              </Button>
            </>
          ) : (
          <Button
            onClick={() => void handleSubmit()}
            disabled={enviar.isPending}
            className="gold-gradient text-background shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:brightness-105"
          >
            <Send className="mr-2 h-4 w-4" />
            {enviar.isPending ? "Enviando..." : "Enviar para revisão"}
          </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
