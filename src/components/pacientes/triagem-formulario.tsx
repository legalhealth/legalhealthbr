import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Loader2, Send, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { streamBibliotecaDoc } from "@/lib/biblioteca";
import { saveHistoryItem } from "@/lib/ia-history";
import { useCriarEvento } from "@/lib/pacientes";
import { abrirWhatsApp } from "@/lib/whatsapp";
import {
  FATORES_RISCO,
  SINAIS_ALERTA,
  calcularRisco,
  riscoMeta,
  resumoParaMinuta,
  useSalvarTriagemEstruturada,
  useTriagensEstruturadas,
} from "@/lib/triagem-estruturada";

const MINUTA_LABEL = "Registro de triagem e encaminhamento";

/** Triagem por formulário: queixa, histórico, exames, risco e minuta automática. */
export function TriagemFormulario({ patientId }: { patientId: string }) {
  const [aberto, setAberto] = useState(false);
  const [queixa, setQueixa] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [historico, setHistorico] = useState("");
  const [medicacoes, setMedicacoes] = useState("");
  const [exames, setExames] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [sinais, setSinais] = useState<string[]>([]);
  const [fatores, setFatores] = useState<string[]>([]);
  const [minuta, setMinuta] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const emCurso = useRef(false);

  const salvar = useSalvarTriagemEstruturada();
  const criarEvento = useCriarEvento();
  const triagens = useTriagensEstruturadas(patientId);

  const { data: perfil } = useQuery({
    queryKey: ["profile-triagem"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome, crm, especialidade, cidade, whatsapp")
        .eq("user_id", userId)
        .maybeSingle();
      return data ?? null;
    },
  });

  const avaliacao = useMemo(() => calcularRisco(sinais, fatores), [sinais, fatores]);
  const meta = riscoMeta(avaliacao.risco);

  const alternar = (lista: string[], set: (v: string[]) => void, item: string) => {
    set(lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item]);
  };

  const limpar = () => {
    setQueixa("");
    setSintomas("");
    setHistorico("");
    setMedicacoes("");
    setExames("");
    setEncaminhamento("");
    setSinais([]);
    setFatores([]);
    setMinuta(null);
  };

  async function registrar() {
    if (emCurso.current) return;
    if (!queixa.trim()) {
      toast.error("Descreva a queixa principal para registrar a triagem.");
      return;
    }
    emCurso.current = true;
    setGerando(true);
    setMinuta("");
    const input = {
      patientId,
      queixa,
      sintomas,
      historico,
      medicacoes,
      exames,
      sinais,
      fatores,
      encaminhamento,
    };
    try {
      const texto = await streamBibliotecaDoc(
        {
          categoria: "minutas",
          documento: MINUTA_LABEL,
          documentoLabel: MINUTA_LABEL,
          nome: perfil?.nome ?? "",
          crm: perfil?.crm ?? "",
          especialidade: perfil?.especialidade ?? "",
          cidade: perfil?.cidade ?? "",
          contexto: resumoParaMinuta(input, avaliacao.risco, avaliacao.justificativa),
        },
        (chunk) => setMinuta((prev) => (prev ?? "") + chunk),
      );

      const docId = await saveHistoryItem({
        origem: "biblioteca",
        tipo: MINUTA_LABEL,
        titulo: `${MINUTA_LABEL} — ${queixa.trim().slice(0, 60)}`,
        conteudo: texto,
        patientId,
      });

      await salvar.mutateAsync({ ...input, docId: docId ?? null });
      if (docId) {
        await criarEvento.mutateAsync({
          patientId,
          tipo: "minuta",
          titulo: MINUTA_LABEL,
          descricao: meta.label,
          docId,
        });
      }
      toast.success("Triagem registrada", {
        description: "A minuta foi gerada e vinculada à ficha do paciente.",
      });
    } catch (e) {
      toast.error("Não foi possível concluir a triagem", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setGerando(false);
      emCurso.current = false;
    }
  }

  return (
    <section className="rounded-2xl glass-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
            <ClipboardList className="h-5 w-5 text-gold" aria-hidden="true" />
            Triagem clínica
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sintomas, histórico, exames e prioridade de atendimento. A minuta de registro é gerada
            no fim — a classificação é administrativa e não substitui avaliação médica.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? "Fechar" : "Nova triagem"}
        </Button>
      </div>

      {aberto && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tr-queixa">Queixa principal</Label>
              <Input
                id="tr-queixa"
                value={queixa}
                onChange={(e) => setQueixa(e.target.value)}
                placeholder="Dor abdominal há 3 dias"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-sintomas">Sintomas relatados</Label>
              <Textarea
                id="tr-sintomas"
                value={sintomas}
                onChange={(e) => setSintomas(e.target.value)}
                rows={3}
                placeholder="Início, intensidade, evolução…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-historico">Histórico relevante</Label>
              <Textarea
                id="tr-historico"
                value={historico}
                onChange={(e) => setHistorico(e.target.value)}
                rows={3}
                placeholder="Cirurgias, alergias, condições crônicas…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-medicacoes">Medicações em uso</Label>
              <Textarea
                id="tr-medicacoes"
                value={medicacoes}
                onChange={(e) => setMedicacoes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-exames">Exames apresentados</Label>
              <Textarea
                id="tr-exames"
                value={exames}
                onChange={(e) => setExames(e.target.value)}
                rows={2}
                placeholder="Exames trazidos pelo paciente e datas"
              />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-[0.18em] text-subtle">
              Sinais de alerta
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SINAIS_ALERTA.map((item) => (
                <label key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={sinais.includes(item)}
                    onCheckedChange={() => alternar(sinais, setSinais, item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-[0.18em] text-subtle">
              Fatores de risco
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {FATORES_RISCO.map((item) => (
                <label key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={fatores.includes(item)}
                    onCheckedChange={() => alternar(fatores, setFatores, item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={cn("rounded-xl border px-4 py-3 text-sm", meta.className)}>
            <p className="font-medium">{meta.label}</p>
            <p className="mt-1 text-xs opacity-90">{avaliacao.justificativa}</p>
            <p className="mt-1 text-xs opacity-90">Sugestão: {meta.prazo}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tr-enc">Encaminhamento (opcional)</Label>
            <Input
              id="tr-enc"
              value={encaminhamento}
              onChange={(e) => setEncaminhamento(e.target.value)}
              placeholder={meta.prazo}
              maxLength={200}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={registrar} disabled={gerando} className="rounded-xl">
              {gerando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Registrar e gerar minuta
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={limpar}>
              Limpar
            </Button>
          </div>

          {minuta !== null && (
            <div className="space-y-3">
              <Textarea
                value={minuta}
                onChange={(e) => setMinuta(e.target.value)}
                rows={14}
                className="font-mono text-xs"
                aria-label="Minuta gerada a partir da triagem"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-gold/40 text-gold hover:bg-gold/10"
                disabled={!minuta}
                onClick={() =>
                  abrirWhatsApp(perfil?.whatsapp, {
                    titulo: MINUTA_LABEL,
                    corpo: minuta ?? "",
                    caminho: "/biblioteca?cat=pacientes",
                  })
                }
              >
                <Send className="h-4 w-4" />
                Enviar para o meu WhatsApp
              </Button>
            </div>
          )}
        </div>
      )}

      {(triagens.data?.length ?? 0) > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-subtle">Triagens registradas</p>
          {(triagens.data ?? []).slice(0, 5).map((t) => (
            <div key={t.id} className="rounded-xl border border-border/60 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-foreground">{t.queixa}</p>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px]",
                    riscoMeta(t.risco).className,
                  )}
                >
                  {riscoMeta(t.risco).label}
                </span>
              </div>
              <p className="mt-1 text-xs text-subtle">
                {new Date(t.created_at).toLocaleString("pt-BR")} · {t.encaminhamento ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
