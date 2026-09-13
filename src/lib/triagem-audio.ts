/**
 * Captura de áudio da triagem por voz.
 *
 * Usa Web Audio para capturar PCM e codifica janelas completas de WAV
 * (16 kHz, mono) — nunca fragmentos de MediaRecorder, que só têm cabeçalho
 * na primeira parte e são rejeitados pela transcrição.
 */

export const TRIAGEM_SAMPLE_RATE = 16000;
export const TRIAGEM_WINDOW_SECONDS = 5;
export const TRIAGEM_MAX_SECONDS = 15 * 60;
export const TRIAGEM_AVISO_SEGUNDOS = 60;

const DB_NAME = "legal-health-triagem";
const STORE = "janelas";

function abrirDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

type JanelaPendente = { id: number; blob: Blob; ordem: number };

/** Guarda a janela no navegador até o envio ser confirmado (rede instável). */
export async function guardarJanelaPendente(blob: Blob, ordem: number): Promise<number | null> {
  const db = await abrirDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add({ blob, ordem });
    req.onsuccess = () => resolve(Number(req.result));
    req.onerror = () => resolve(null);
  });
}

export async function removerJanelaPendente(id: number): Promise<void> {
  const db = await abrirDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function listarJanelasPendentes(): Promise<JanelaPendente[]> {
  const db = await abrirDb();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as JanelaPendente[]);
    req.onerror = () => resolve([]);
  });
}

function reamostrar(chunks: Float32Array[], deOrigem: number): Float32Array {
  const total = chunks.reduce((soma, c) => soma + c.length, 0);
  const bruto = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bruto.set(chunk, offset);
    offset += chunk.length;
  }
  if (deOrigem === TRIAGEM_SAMPLE_RATE) return bruto;
  const razao = deOrigem / TRIAGEM_SAMPLE_RATE;
  const tamanho = Math.floor(bruto.length / razao);
  const saida = new Float32Array(tamanho);
  for (let i = 0; i < tamanho; i += 1) {
    const inicio = Math.floor(i * razao);
    const fim = Math.min(Math.floor((i + 1) * razao), bruto.length);
    let soma = 0;
    let n = 0;
    for (let j = inicio; j < fim; j += 1) {
      soma += bruto[j] ?? 0;
      n += 1;
    }
    saida[i] = n ? soma / n : 0;
  }
  return saida;
}

/** Codifica PCM float em um arquivo WAV completo (16 bits, mono). */
export function codificarWav(amostras: Float32Array, sampleRate = TRIAGEM_SAMPLE_RATE): Blob {
  const buffer = new ArrayBuffer(44 + amostras.length * 2);
  const view = new DataView(buffer);
  const texto = (offset: number, valor: string) => {
    for (let i = 0; i < valor.length; i += 1) view.setUint8(offset + i, valor.charCodeAt(i));
  };
  texto(0, "RIFF");
  view.setUint32(4, 36 + amostras.length * 2, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  texto(36, "data");
  view.setUint32(40, amostras.length * 2, true);
  let offset = 44;
  for (let i = 0; i < amostras.length; i += 1) {
    const s = Math.max(-1, Math.min(1, amostras[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export type TriagemRecorder = {
  iniciar: () => Promise<void>;
  encerrar: () => Promise<{ audio: Blob; duracaoSeg: number }>;
  cancelar: () => void;
  segundos: () => number;
};

type RecorderOpts = {
  /** chamado a cada janela completa de WAV pronta para transcrição */
  onJanela: (wav: Blob, ordem: number) => void;
  onErro?: (mensagem: string) => void;
  onSegundo?: (segundos: number) => void;
  onLimite?: () => void;
  /** nível de voz de 0 a 1, para o medidor na tela */
  onNivel?: (nivel: number) => void;
  /** avisa quando nenhum som é captado por vários segundos */
  onSilencio?: (silencioso: boolean) => void;
};

/** Mensagem legível para cada falha de permissão/captação do microfone. */
export function mensagemErroMicrofone(erro: unknown): string {
  const nome = (erro as { name?: string } | null)?.name ?? "";
  if (nome === "NotAllowedError" || nome === "SecurityError") {
    return "O microfone está bloqueado para este site. Autorize o microfone nas permissões do navegador e tente novamente.";
  }
  if (nome === "NotFoundError" || nome === "OverconstrainedError") {
    return "Nenhum microfone foi encontrado neste aparelho.";
  }
  if (nome === "NotReadableError" || nome === "AbortError") {
    return "O microfone está sendo usado por outro aplicativo. Feche chamadas ou gravadores abertos e tente novamente.";
  }
  if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
    return "Este navegador não permite gravar áudio. Abra o app pelo Chrome ou Safari atualizado.";
  }
  return "Não foi possível acessar o microfone. Autorize o uso do microfone e tente novamente.";
}

/** Worklet que apenas repassa os blocos de PCM para a thread principal. */
const WORKLET_SRC = `
class TriagemCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const canal = inputs[0] && inputs[0][0];
    if (canal && canal.length) this.port.postMessage(new Float32Array(canal));
    return true;
  }
}
registerProcessor('triagem-capture', TriagemCaptureProcessor);
`;

/**
 * Gravador de triagem: entrega janelas WAV completas durante a fala e o
 * arquivo integral no encerramento. Usa AudioWorklet (com fallback para
 * ScriptProcessor em navegadores antigos) e retoma sozinho quando o
 * navegador suspende o áudio (app em segundo plano / tela travada no PWA).
 */
export function criarTriagemRecorder(opts: RecorderOpts): TriagemRecorder {
  let ctx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let worklet: AudioWorkletNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  let wakeLock: { release: () => Promise<void> } | null = null;
  let janela: Float32Array[] = [];
  let completo: Float32Array[] = [];
  let taxa = TRIAGEM_SAMPLE_RATE;
  let ordem = 0;
  let amostrasJanela = 0;
  let amostrasTotal = 0;
  let ativo = false;
  let ticker: ReturnType<typeof setInterval> | null = null;
  let avisou = false;
  let picoJanela = 0;
  let segundosMudos = 0;
  let avisouSilencio = false;

  const segundos = () => Math.floor(amostrasTotal / (taxa || TRIAGEM_SAMPLE_RATE));

  async function pedirWakeLock() {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<never> } })
      .wakeLock;
    if (!wl) return;
    try {
      wakeLock = (await wl.request("screen")) as unknown as { release: () => Promise<void> };
    } catch {
      wakeLock = null;
    }
  }

  function retomar() {
    if (!ativo) return;
    if (ctx && ctx.state === "suspended") void ctx.resume();
    if (document.visibilityState === "visible" && !wakeLock) void pedirWakeLock();
  }

  function receber(dados: Float32Array) {
    if (!ativo) return;
    janela.push(dados);
    completo.push(dados);
    amostrasJanela += dados.length;
    amostrasTotal += dados.length;
    let pico = 0;
    for (let i = 0; i < dados.length; i += 8) {
      const v = Math.abs(dados[i] ?? 0);
      if (v > pico) pico = v;
    }
    if (pico > picoJanela) picoJanela = pico;
    if (amostrasJanela >= taxa * TRIAGEM_WINDOW_SECONDS) flushJanela();
  }

  function flushJanela() {
    if (!janela.length) return;
    const amostras = reamostrar(janela, taxa);
    janela = [];
    amostrasJanela = 0;
    if (amostras.length < TRIAGEM_SAMPLE_RATE / 2) return;
    ordem += 1;
    opts.onJanela(codificarWav(amostras), ordem);
  }

  function limpar() {
    ativo = false;
    if (ticker) clearInterval(ticker);
    ticker = null;
    document.removeEventListener("visibilitychange", retomar);
    if (worklet) worklet.port.onmessage = null;
    worklet?.disconnect();
    processor?.disconnect();
    source?.disconnect();
    stream?.getTracks().forEach((t) => t.stop());
    void wakeLock?.release().catch(() => undefined);
    void ctx?.close();
    worklet = null;
    processor = null;
    source = null;
    stream = null;
    ctx = null;
    wakeLock = null;
  }

  return {
    segundos,
    async iniciar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("sem suporte");
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (erro) {
        throw new Error(mensagemErroMicrofone(erro));
      }
      ctx = new AudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      taxa = ctx.sampleRate;
      source = ctx.createMediaStreamSource(stream);
      janela = [];
      completo = [];
      ordem = 0;
      amostrasJanela = 0;
      amostrasTotal = 0;
      avisou = false;
      picoJanela = 0;
      segundosMudos = 0;
      avisouSilencio = false;
      ativo = true;

      let usouWorklet = false;
      if (ctx.audioWorklet) {
        try {
          const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "text/javascript" }));
          await ctx.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);
          worklet = new AudioWorkletNode(ctx, "triagem-capture");
          worklet.port.onmessage = (event: MessageEvent<Float32Array>) => receber(event.data);
          source.connect(worklet);
          // saída silenciosa: mantém o grafo ativo sem devolver som ao alto-falante
          const mudo = ctx.createGain();
          mudo.gain.value = 0;
          worklet.connect(mudo);
          mudo.connect(ctx.destination);
          usouWorklet = true;
        } catch {
          worklet = null;
        }
      }

      if (!usouWorklet) {
        processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          receber(new Float32Array(event.inputBuffer.getChannelData(0)));
        };
        source.connect(processor);
        processor.connect(ctx.destination);
      }

      document.addEventListener("visibilitychange", retomar);
      await pedirWakeLock();

      ticker = setInterval(() => {
        const s = segundos();
        opts.onSegundo?.(s);
        opts.onNivel?.(Math.min(1, picoJanela * 3));
        if (picoJanela < 0.01) {
          segundosMudos += 1;
          if (segundosMudos >= 6 && !avisouSilencio) {
            avisouSilencio = true;
            opts.onSilencio?.(true);
          }
        } else {
          segundosMudos = 0;
          if (avisouSilencio) {
            avisouSilencio = false;
            opts.onSilencio?.(false);
          }
        }
        picoJanela = 0;
        retomar();
        if (!avisou && s >= TRIAGEM_MAX_SECONDS - TRIAGEM_AVISO_SEGUNDOS) {
          avisou = true;
          opts.onErro?.(
            "A triagem se aproxima do limite de 15 minutos e será encerrada automaticamente.",
          );
        }
        if (s >= TRIAGEM_MAX_SECONDS) opts.onLimite?.();
      }, 1000);
    },
    async encerrar() {
      flushJanela();
      const duracaoSeg = segundos();
      const amostras = reamostrar(completo, taxa);
      completo = [];
      limpar();
      return { audio: codificarWav(amostras), duracaoSeg };
    },
    cancelar() {
      janela = [];
      completo = [];
      limpar();
    },
  };
}
