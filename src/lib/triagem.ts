import { supabase } from "@/integrations/supabase/client";
import type { TriagemResumo } from "@/lib/pacientes";

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const value = data.session?.access_token;
  if (!value) throw new Error("Sessão expirada. Faça login novamente.");
  return value;
}

async function erroDaResposta(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Envia uma janela WAV completa e devolve o trecho transcrito, entregando os
 * fragmentos conforme chegam para a transcrição aparecer ao vivo.
 */
export async function transcreverJanela(
  wav: Blob,
  onDelta?: (fragmento: string) => void,
): Promise<string> {
  const form = new FormData();
  form.append("file", wav, "trecho.wav");

  const response = await fetch("/api/ai-triagem-transcrever", {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}` },
    body: form,
  });

  if (!response.ok || !response.body) {
    throw new Error(
      await erroDaResposta(response, "Não foi possível transcrever este trecho do áudio."),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";
  let finalizado = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const linhas = buffer.split("\n");
    buffer = linhas.pop() ?? "";
    for (const linha of linhas) {
      const limpa = linha.trim();
      if (!limpa.startsWith("data:")) continue;
      const bruto = limpa.slice(5).trim();
      if (!bruto || bruto === "[DONE]") continue;
      try {
        const evento = JSON.parse(bruto) as { type?: string; delta?: string; text?: string };
        if (evento.type === "transcript.text.delta" && evento.delta) {
          texto += evento.delta;
          onDelta?.(evento.delta);
        } else if (evento.type === "transcript.text.done" && typeof evento.text === "string") {
          finalizado = evento.text;
        }
      } catch {
        /* fragmento incompleto */
      }
    }
  }

  return (finalizado || texto).trim();
}

/** Pede à IA a triagem estruturada a partir da transcrição completa. */
export async function gerarResumoTriagem(transcricao: string): Promise<TriagemResumo> {
  const response = await fetch("/api/ai-triagem-resumo", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${await token()}` },
    body: JSON.stringify({ transcricao }),
  });

  if (!response.ok) {
    throw new Error(
      await erroDaResposta(response, "Não foi possível organizar a triagem. Tente novamente."),
    );
  }

  const { resumo } = (await response.json()) as { resumo: TriagemResumo };
  return resumo;
}

export function formatarDuracao(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
