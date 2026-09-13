import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { AiDisclaimer } from "@/components/ia/ai-disclaimer";
import { TriagemVoz } from "@/components/pacientes/triagem-voz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarData, eventoLabel } from "@/lib/pacientes";
import {
  registrarAuditoria,
  useAtualizarPaciente,
  useCriarEvento,
  useDocumentosDoPaciente,
  useEventos,
  useExcluirEvento,
  useHistoricoCampos,
  usePaciente,
  type EventoTipo,
} from "@/lib/pacientes";

export const Route = createFileRoute("/_authenticated/paciente/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do paciente | Legal Health" },
      {
        name: "description",
        content:
          "Histórico documental e procedimental individualizado do paciente, com triagem por voz assistida por IA.",
      },
      { property: "og:title", content: "Ficha do paciente | Legal Health" },
      {
        property: "og:description",
        content:
          "Histórico documental e procedimental individualizado do paciente, com triagem por voz assistida por IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const TIPOS: { value: EventoTipo; label: string }[] = [
  { value: "atendimento", label: "Atendimento" },
  { value: "procedimento", label: "Procedimento" },
  { value: "documento", label: "Documento anexado" },
];

function Page() {
  const { id } = Route.useParams();
  const { data: paciente, isPending } = usePaciente(id);
  const { data: eventos } = useEventos(id);
  const { data: historico } = useHistoricoCampos(id);
  const { data: docs } = useDocumentosDoPaciente(id);
  const atualizar = useAtualizarPaciente();
  const criarEvento = useCriarEvento();
  const excluirEvento = useExcluirEvento();

  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [contato, setContato] = useState("");
  const [convenio, setConvenio] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [tipo, setTipo] = useState<EventoTipo>("atendimento");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (!paciente) return;
    setNome(paciente.nome);
    setNascimento(paciente.nascimento ?? "");
    setContato(paciente.contato ?? "");
    setConvenio(paciente.convenio ?? "");
    setResponsavel(paciente.responsavel_legal ?? "");
    setObservacoes(paciente.observacoes ?? "");
    void registrarAuditoria({
      patientId: paciente.id,
      entidade: "paciente",
      entidadeId: paciente.id,
      acao: "visualizacao",
    });
  }, [paciente]);

  async function salvar() {
    if (!paciente) return;
    try {
      await atualizar.mutateAsync({
        anterior: paciente,
        valores: {
          nome,
          nascimento: nascimento || null,
          contato: contato || null,
          convenio: convenio || null,
          responsavel_legal: responsavel || null,
          observacoes: observacoes || null,
        },
      });
      toast.success("Ficha atualizada. As alterações ficam registradas no histórico.");
    } catch {
      toast.error("Não foi possível salvar a ficha.");
    }
  }

  async function adicionarEvento() {
    if (titulo.trim().length < 2) {
      toast.error("Descreva o registro.");
      return;
    }
    try {
      await criarEvento.mutateAsync({
        patientId: id,
        tipo,
        titulo,
        ...(descricao ? { descricao } : {}),
      });
      setTitulo("");
      setDescricao("");
      toast.success("Registro adicionado ao histórico.");
    } catch {
      toast.error("Não foi possível adicionar o registro.");
    }
  }

  if (isPending) {
    return (
      <PageShell title="Ficha do paciente" description="Carregando…">
        <p className="mt-8 text-sm text-muted-foreground">Carregando ficha…</p>
      </PageShell>
    );
  }

  if (!paciente) {
    return (
      <PageShell title="Ficha do paciente" description="Paciente não encontrado.">
        <Button asChild variant="outline" size="sm" className="mt-8 border-border">
          <Link to="/biblioteca" search={{ cat: "pacientes" }}>
            Voltar para Pacientes
          </Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={paciente.nome}
      description="Histórico documental e procedimental individualizado, guardado sem prazo de expiração."
    >
      <div className="mt-8 space-y-6">
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link to="/biblioteca" search={{ cat: "pacientes" }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Pacientes
          </Link>
        </Button>

        <TriagemVoz patientId={id} />

        {/* Dados cadastrais */}
        <section className="rounded-2xl glass-card p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Dados do paciente</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="f-nome" className="text-xs text-muted-foreground">
                Nome
              </Label>
              <Input id="f-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-nasc" className="text-xs text-muted-foreground">
                Nascimento
              </Label>
              <Input
                id="f-nasc"
                type="date"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-contato" className="text-xs text-muted-foreground">
                Contato
              </Label>
              <Input id="f-contato" value={contato} onChange={(e) => setContato(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-conv" className="text-xs text-muted-foreground">
                Convênio
              </Label>
              <Input id="f-conv" value={convenio} onChange={(e) => setConvenio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-resp" className="text-xs text-muted-foreground">
                Responsável legal
              </Label>
              <Input
                id="f-resp"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="f-obs" className="text-xs text-muted-foreground">
              Observações
            </Label>
            <Textarea
              id="f-obs"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <Button
            onClick={() => void salvar()}
            disabled={atualizar.isPending}
            className="mt-5 gold-gradient text-background shadow-[var(--shadow-gold)] hover:brightness-105"
          >
            {atualizar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar ficha
          </Button>
        </section>

        {/* Histórico */}
        <section className="rounded-2xl glass-card p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Histórico do paciente</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as EventoTipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="ev-titulo" className="text-xs text-muted-foreground">
                Registro
              </Label>
              <Input
                id="ev-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: retorno pós-procedimento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-desc" className="text-xs text-muted-foreground">
                Detalhe
              </Label>
              <Input
                id="ev-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void adicionarEvento()}
            disabled={criarEvento.isPending}
            className="mt-4 border-gold/40 bg-transparent text-gold hover:bg-gold/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar ao histórico
          </Button>

          <div className="mt-6 space-y-3">
            {!eventos?.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro ainda. Triagens confirmadas e minutas geradas entram aqui
                automaticamente.
              </p>
            ) : (
              eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      {eventoLabel(evento.tipo)} · {formatarData(evento.ocorrido_em)}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{evento.titulo}</p>
                    {evento.descricao ? (
                      <p className="mt-1 text-xs text-muted-foreground">{evento.descricao}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir registro"
                    onClick={() => void excluirEvento.mutateAsync(evento)}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Documentos vinculados */}
        <section className="rounded-2xl glass-card p-5 md:p-6">
          <h2 className="font-display text-lg text-foreground">Documentos vinculados</h2>
          <div className="mt-4 space-y-3">
            {!docs?.minutas.length && !docs?.anexos.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhum documento vinculado. Gere uma minuta da Biblioteca com este paciente
                selecionado para vinculá-la à ficha.
              </p>
            ) : (
              <>
                {docs?.minutas.map((minuta) => (
                  <div key={minuta.id} className="rounded-xl border border-border p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      Minuta · {formatarData(minuta.created_at)}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {minuta.titulo ?? minuta.tipo ?? "Minuta"}
                    </p>
                  </div>
                ))}
                {docs?.anexos.map((anexo) => (
                  <div key={anexo.id} className="rounded-xl border border-border p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      Anexo · {formatarData(anexo.created_at)}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{anexo.nome}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Alterações da ficha */}
        {historico?.length ? (
          <section className="rounded-2xl glass-card p-5 md:p-6">
            <h2 className="font-display text-lg text-foreground">Alterações da ficha</h2>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {historico.map((linha) => (
                <li key={linha.id}>
                  {formatarData(linha.created_at)} —{" "}
                  <span className="text-foreground">{linha.campo}</span>:{" "}
                  {linha.valor_anterior || "vazio"} → {linha.valor_novo || "vazio"}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <AiDisclaimer />
      </div>
    </PageShell>
  );
}
