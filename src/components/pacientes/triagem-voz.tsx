import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { abrirWhatsApp } from "@/lib/whatsapp";
import {
  AUDIO_RETENCAO_TEXTO,
  criarTriagem,
  salvarTriagem,
  urgenciaMeta,
  useConfirmarTriagem,
  useTriagens,
  type Triagem,
  type TriagemResumo,
  type TriagemUrgencia,
} from "@/lib/pacientes";
import { formatarDuracao, gerarResumoTriagem, transcreverJanela } from "@/lib/triagem";
import {
  criarTriagemRecorder,
  TRIAGEM_MAX_SECONDS,
  type TriagemRecorder,
} from "@/lib/triagem-audio";

type Etapa = "consentimento" | "gravando" | "processando" | "revisao";

/** Resumo curto do atendimento, enviado como contexto para a geração da minuta. */
function contextoDaTriagem(r: TriagemResumo): string {
  return [
    `Motivo: ${r.motivo || "não informado"}`,
    `Prioridade: ${urgenciaMeta(r.urgencia).label}`,
    r.resumo.length ? `Pontos do atendimento: ${r.resumo.join("; ")}` : "",
    r.encaminhamento ? `Encaminhamento: ${r.encaminhamento}` : "",
    r.pendencias.length ? `A confirmar: ${r.pendencias.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 1500);
}

export function TriagemVoz({ patientId }: { patientId: string }) {
  const [etapa, setEtapa] = useState<Etapa>("consentimento");
  const [consenteAtendimento, setConsenteAtendimento] = useState(false);
  const [consenteAudio, setConsenteAudio] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [transcricao, setTranscricao] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [triagem, setTriagem] = useState<Triagem | null>(null);
  const [resumo, setResumo] = useState<TriagemResumo | null>(null);
  const [nivel, setNivel] = useState(0);
  const [semSom, setSemSom] = useState(false);

  const recorderRef = useRef<TriagemRecorder | null>(null);
  const filaRef = useRef<Promise<void>>(Promise.resolve());
  const triagemIdRef = useRef<string | null>(null);

  const { data: triagens } = useTriagens(patientId);
  const confirmar = useConfirmarTriagem();
  const { data: perfilWhatsapp } = useQuery({
    queryKey: ["profile-whatsapp"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("whatsapp")
        .eq("user_id", userId)
        .maybeSingle();
      return data?.whatsapp ?? null;
    },
  });

  useEffect(() => () => recorderRef.current?.cancelar(), []);

  function enfileirarJanela(wav: Blob) {
    filaRef.current = filaRef.current.then(async () => {
      try {
        const trecho = await transcreverJanela(wav, (fragmento) =>
          setTranscricao((atual) => atual + fragmento),
        );
        if (trecho) setTranscricao((atual) => (atual.endsWith(trecho) ? atual : `${atual} `));
      } catch (e) {
        setAviso(e instanceof Error ? e.message : "Um trecho do áudio não pôde ser transcrito.");
      }
    });
  }

  async function iniciar() {
    if (!consenteAtendimento) {
      toast.error("Registre o consentimento do paciente antes de gravar.");
      return;
    }
    setAviso(null);
    setTranscricao("");
    setResumo(null);
    setTriagem(null);
    try {
      triagemIdRef.current = await criarTriagem({
        patientId,
        consentimentoAtendimento: consenteAtendimento,
        consentimentoAudio: consenteAudio,
      });
    } catch {
      toast.error("Não foi possível iniciar a triagem.");
      return;
    }

    const recorder = criarTriagemRecorder({
      onJanela: (wav) => enfileirarJanela(wav),
      onErro: (mensagem) => setAviso(mensagem),
      onSegundo: (s) => setSegundos(s),
      onNivel: (v) => setNivel(v),
      onSilencio: (mudo) => setSemSom(mudo),
      onLimite: () => void encerrar(),
    });
    recorderRef.current = recorder;
    try {
      await recorder.iniciar();
      setEtapa("gravando");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível acessar o microfone.");
    }
  }

  async function encerrar() {
    const recorder = recorderRef.current;
    const triagemId = triagemIdRef.current;
    if (!recorder || !triagemId) return;
    recorderRef.current = null;
    setEtapa("processando");

    try {
      const { audio, duracaoSeg } = await recorder.encerrar();
      await filaRef.current;
      const texto = transcricao.trim();
      if (texto.length < 20) {
        setAviso(
          "A transcrição ficou curta demais. Grave novamente falando mais perto do aparelho.",
        );
        setEtapa("consentimento");
        return;
      }
      const gerado = await gerarResumoTriagem(texto);
      await salvarTriagem({
        triageId: triagemId,
        patientId,
        transcricao: texto,
        resumo: gerado,
        duracaoSeg,
        audio: consenteAudio ? audio : null,
      });
      setResumo(gerado);
      setTriagem({
        id: triagemId,
        patient_id: patientId,
        audio_path: null,
        transcricao: texto,
        resumo: gerado,
        resumo_original: gerado,
        urgencia: gerado.urgencia,
        encaminhamento: gerado.encaminhamento,
        consentimento_atendimento_em: new Date().toISOString(),
        consentimento_audio_em: consenteAudio ? new Date().toISOString() : null,
        duracao_seg: duracaoSeg,
        status: "revisao",
        revisado_por: null,
        revisado_em: null,
        created_at: new Date().toISOString(),
      });
      setEtapa("revisao");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível concluir a triagem.");
      setEtapa("consentimento");
    }
  }

  async function handleConfirmar() {
    if (!triagem || !resumo) return;
    try {
      await confirmar.mutateAsync({ triagem, resumo });
      toast.success("Triagem confirmada e registrada no histórico.");
      setEtapa("consentimento");
      setTranscricao("");
      setResumo(null);
      setTriagem(null);
      setSegundos(0);
    } catch {
      toast.error("Não foi possível confirmar a triagem.");
    }
  }

  const ultimas = (triagens ?? []).slice(0, 3);

  return (
    <section className="rounded-2xl glass-card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-foreground">Triagem por voz</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A IA escuta o contato inicial, organiza a demanda e indica o encaminhamento. Ela não
            diagnostica nem sugere conduta clínica — a decisão é sempre do profissional.
          </p>
        </div>
        {etapa === "gravando" ? (
          <span className="text-sm text-gold">
            {formatarDuracao(segundos)} / {formatarDuracao(TRIAGEM_MAX_SECONDS)}
          </span>
        ) : null}
      </div>

      {etapa === "consentimento" ? (
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 text-xs text-muted-foreground">
            <Checkbox
              checked={consenteAtendimento}
              onCheckedChange={(v) => setConsenteAtendimento(v === true)}
              aria-label="Consentimento do paciente para a triagem"
            />
            <span>
              O paciente foi informado e consentiu com a triagem assistida por inteligência
              artificial.
            </span>
          </label>
          <label className="flex items-start gap-3 text-xs text-muted-foreground">
            <Checkbox
              checked={consenteAudio}
              onCheckedChange={(v) => setConsenteAudio(v === true)}
              aria-label="Consentimento para guardar o áudio"
            />
            <span>
              O paciente autorizou guardar o áudio da conversa. Sem esta autorização, apenas a
              transcrição é mantida.
            </span>
          </label>
          <div className="rounded-xl border border-border p-4 text-[11px] leading-relaxed text-muted-foreground">
            <p className="text-xs text-foreground">O que é guardado e por quanto tempo</p>
            <p className="mt-1">
              Guardamos a transcrição da conversa e, se autorizado, o arquivo de áudio.{" "}
              {AUDIO_RETENCAO_TEXTO} Podem acessar o profissional dono da conta e o assistente com
              vínculo ativo na clínica. A organização do conteúdo é feita por um serviço de
              inteligência artificial contratado, sob obrigação de sigilo, e toda leitura fica
              registrada. A revisão do profissional é obrigatória antes de qualquer uso.
            </p>
          </div>
          <Button
            onClick={() => void iniciar()}
            className="h-12 w-full gold-gradient text-base text-background shadow-[var(--shadow-gold)] hover:brightness-105 sm:h-11 sm:w-auto sm:text-sm"
          >
            <Mic className="mr-2 h-5 w-5" />
            Iniciar triagem
          </Button>
          {aviso ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Se o microfone não funcionar neste aparelho, use a triagem por escrito logo abaixo
              nesta mesma ficha — o resultado é o mesmo.
            </p>
          ) : null}
        </div>
      ) : null}

      {etapa === "gravando" ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
            <span className="text-sm text-foreground">Gravando e transcrevendo…</span>
          </div>
          <div className="space-y-1.5">
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-label="Nível de voz captado"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(nivel * 100)}
            >
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-150"
                style={{ width: `${Math.max(2, Math.round(nivel * 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {semSom
                ? "Nenhum som captado — fale mais perto do aparelho ou confira o microfone."
                : "Microfone ativo. Mantenha o aparelho próximo de quem fala."}
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-4 text-sm leading-relaxed text-muted-foreground">
            {transcricao || "Aguardando as primeiras palavras…"}
          </div>
          <Button variant="outline" onClick={() => void encerrar()} className="border-border">
            <Square className="mr-2 h-4 w-4" />
            Encerrar e organizar
          </Button>
        </div>
      ) : null}

      {etapa === "processando" ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Organizando a demanda…
        </p>
      ) : null}

      {etapa === "revisao" && resumo ? (
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tri-motivo" className="text-xs text-muted-foreground">
              Motivo do contato
            </Label>
            <Input
              id="tri-motivo"
              value={resumo.motivo}
              onChange={(e) => setResumo({ ...resumo, motivo: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Prioridade de atendimento</Label>
              <Select
                value={resumo.urgencia}
                onValueChange={(v) => setResumo({ ...resumo, urgencia: v as TriagemUrgencia })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Prioridade alta</SelectItem>
                  <SelectItem value="media">Prioridade média</SelectItem>
                  <SelectItem value="baixa">Prioridade baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tri-enc" className="text-xs text-muted-foreground">
                Encaminhamento
              </Label>
              <Input
                id="tri-enc"
                value={resumo.encaminhamento}
                onChange={(e) => setResumo({ ...resumo, encaminhamento: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tri-resumo" className="text-xs text-muted-foreground">
              Pontos do contato (um por linha)
            </Label>
            <Textarea
              id="tri-resumo"
              rows={5}
              value={resumo.resumo.join("\n")}
              onChange={(e) =>
                setResumo({ ...resumo, resumo: e.target.value.split("\n").filter(Boolean) })
              }
            />
          </div>

          {resumo.pendencias.length ? (
            <div className="rounded-xl border border-warn/40 bg-warn/10 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-warn">
                Confirmar com o paciente
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {resumo.pendencias.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {resumo.documentos.length ? (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-gold">
                Minutas sugeridas para este caso
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ao tocar, o modelo abre na Biblioteca já vinculado a este paciente.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {resumo.documentos.map((doc) => (
                  <Button
                    key={doc.slug}
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-11 w-full rounded-xl border-gold/40 bg-transparent text-gold hover:bg-gold/10 sm:h-9 sm:w-auto"
                  >
                    <Link
                      to="/biblioteca"
                      search={{
                        cat: "minutas",
                        doc: doc.slug,
                        pac: patientId,
                        ctx: contextoDaTriagem(resumo),
                      }}
                    >
                      Gerar esta minuta: {doc.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              onClick={() => void handleConfirmar()}
              disabled={confirmar.isPending}
              className="h-12 w-full gold-gradient text-background shadow-[var(--shadow-gold)] hover:brightness-105 sm:h-11 sm:w-auto"
            >
              {confirmar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar triagem
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-gold/40 bg-transparent text-gold hover:bg-gold/10"
              onClick={() =>
                abrirWhatsApp(perfilWhatsapp, {
                  titulo: `Triagem — ${resumo.motivo || "atendimento"}`,
                  corpo: [
                    `Prioridade: ${urgenciaMeta(resumo.urgencia).label}`,
                    resumo.resumo.join("\n"),
                    resumo.encaminhamento ? `Encaminhamento: ${resumo.encaminhamento}` : "",
                    resumo.pendencias.length ? `A confirmar: ${resumo.pendencias.join("; ")}` : "",
                  ]
                    .filter(Boolean)
                    .join("\n\n"),
                  caminho: `/paciente/${patientId}`,
                })
              }
            >
              Enviar no meu WhatsApp
            </Button>
          </div>
        </div>
      ) : null}

      {aviso ? <p className="mt-4 text-sm text-warn">{aviso}</p> : null}

      {ultimas.length ? (
        <div className="mt-6 space-y-3 border-t border-border pt-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Triagens anteriores
          </p>
          {ultimas.map((item) => {
            const meta = urgenciaMeta(item.urgencia);
            return (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-foreground">
                    {item.resumo?.motivo || "Triagem por voz"}
                  </p>
                  <span
                    className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", meta.className)}
                  >
                    {meta.label}
                  </span>
                </div>
                {item.encaminhamento ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">{item.encaminhamento}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
