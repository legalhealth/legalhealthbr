import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatSize, tagLabel, useDocuments } from "@/lib/ia-documents";
import { anexosSignedUrls, buildMailto, useEnviarRevisao } from "@/lib/ia-revisoes";

type Props = {
  docId: string;
  titulo: string;
  conteudo: string;
  trigger?: React.ReactNode;
};

export function EnviarRevisaoDialog({ docId, titulo, conteudo, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [oab, setOab] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: documents } = useDocuments();
  const enviar = useEnviarRevisao();

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (nome.trim().length < 3) {
      toast.error("Informe o nome do advogado responsável.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    try {
      await enviar.mutateAsync({
        docId,
        docTitulo: titulo,
        advogadoNome: nome.trim(),
        advogadoEmail: email.trim(),
        advogadoOab: oab,
        mensagem,
        documentIds: selected,
      });

      const anexos = await anexosSignedUrls(
        (documents ?? []).filter((d) => selected.includes(d.id)),
      );
      const href = buildMailto({
        para: email.trim(),
        titulo,
        advogadoNome: nome.trim(),
        mensagem,
        conteudo,
        anexos,
      });
      window.location.href = href;

      toast.success("Revisão registrada e e-mail preparado para envio.");
      setOpen(false);
      setMensagem("");
      setSelected([]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar a revisão.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Enviar para revisão</DialogTitle>
          <DialogDescription>
            A peça e os documentos selecionados vão para o advogado responsável. O status e os
            comentários ficam registrados no histórico.
          </DialogDescription>
        </DialogHeader>

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
                      checked={selected.includes(doc.id)}
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

        <DialogFooter>
          <Button
            onClick={() => void handleSubmit()}
            disabled={enviar.isPending}
            className="bg-gold text-background hover:bg-gold-light"
          >
            <Send className="mr-2 h-4 w-4" />
            {enviar.isPending ? "Enviando..." : "Enviar para revisão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
