import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AUDIO_RETENCAO_TEXTO,
  audioAssinado,
  formatarData,
  useExcluirAudioTriagem,
  useTriagens,
} from "@/lib/pacientes";
import { formatarDuracao } from "@/lib/triagem";

/** Gravações da triagem por voz: ouvir por link temporário e apagar quando quiser. */
export function GravacoesPaciente({ patientId }: { patientId: string }) {
  const { data: triagens } = useTriagens(patientId);
  const excluir = useExcluirAudioTriagem();
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [tocando, setTocando] = useState<{ id: string; url: string } | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);

  const comAudio = (triagens ?? []).filter((t) => Boolean(t.audio_path));

  async function ouvir(triageId: string) {
    setAbrindo(triageId);
    const url = await audioAssinado(triageId);
    setAbrindo(null);
    if (!url) {
      toast.error("Não foi possível abrir a gravação.");
      return;
    }
    setTocando({ id: triageId, url });
  }

  return (
    <section className="rounded-2xl glass-card p-5 md:p-6">
      <h2 className="font-display text-lg text-foreground">Gravações da triagem</h2>
      <p className="mt-1 text-xs text-muted-foreground">{AUDIO_RETENCAO_TEXTO}</p>

      <div className="mt-4 space-y-3">
        {!comAudio.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma gravação guardada. O áudio só é salvo quando o paciente autoriza.
          </p>
        ) : (
          comAudio.map((triagem) => (
            <div key={triagem.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {formatarData(triagem.created_at)} · {formatarDuracao(triagem.duracao_seg ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {triagem.resumo?.motivo || "Triagem por voz"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Autorização do áudio registrada em{" "}
                    {triagem.consentimento_audio_em
                      ? formatarData(triagem.consentimento_audio_em)
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    disabled={abrindo === triagem.id}
                    onClick={() => void ouvir(triagem.id)}
                  >
                    {abrindo === triagem.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Ouvir
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Apagar gravação"
                    className="text-muted-foreground hover:text-danger"
                    disabled={apagando === triagem.id}
                    onClick={async () => {
                      setApagando(triagem.id);
                      try {
                        await excluir.mutateAsync(triagem);
                        if (tocando?.id === triagem.id) setTocando(null);
                        toast.success("Gravação apagada. A transcrição continua na ficha.");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Não foi possível apagar a gravação.",
                        );
                      } finally {
                        setApagando(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {tocando?.id === triagem.id ? (
                <audio className="mt-3 w-full" controls autoPlay src={tocando.url} />
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
