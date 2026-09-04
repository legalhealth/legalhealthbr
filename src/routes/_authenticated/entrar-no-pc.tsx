import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera, CheckCircle2, Loader2, Monitor, ShieldCheck, XCircle } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  autorizarPedido,
  detalhesPedido,
  recusarPedido,
  type DetalhesPedido,
} from "@/lib/device-login.functions";

export const Route = createFileRoute("/_authenticated/entrar-no-pc")({
  head: () => ({
    meta: [
      { title: "Entrar no computador | Legal Health" },
      {
        name: "description",
        content: "Autorize o acesso à sua conta Legal Health no computador escaneando o QR-Code.",
      },
      { property: "og:title", content: "Entrar no computador | Legal Health" },
      {
        property: "og:description",
        content: "Autorize o acesso à sua conta Legal Health no computador pelo celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntrarNoPcPage,
});

type Fase = "inicio" | "camera" | "confirmar" | "autorizado" | "recusado" | "erro";

/** Extrai o código do conteúdo lido no QR (URL /entrar/CODIGO ou o próprio código). */
function extrairCodigo(texto: string) {
  const limpo = texto.trim();
  const match = limpo.match(/entrar\/([A-Za-z0-9]{8})/);
  const bruto = match?.[1] ?? limpo;
  const code = bruto.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.length === 8 ? code : null;
}

function EntrarNoPcPage() {
  const codeInicial =
    typeof window !== "undefined"
      ? extrairCodigo(new URLSearchParams(window.location.search).get("code") ?? "")
      : null;

  const [fase, setFase] = useState<Fase>("inicio");
  const [codigoManual, setCodigoManual] = useState("");
  const [pedido, setPedido] = useState<DetalhesPedido | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRef = useRef<number | null>(null);

  const pararCamera = useCallback(() => {
    if (scanRef.current !== null) cancelAnimationFrame(scanRef.current);
    scanRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const carregarPedido = useCallback(
    async (code: string) => {
      pararCamera();
      setErro("");
      try {
        const detalhes = await detalhesPedido({ data: { code } });
        if (detalhes.status !== "pending") {
          setErro(
            detalhes.status === "expired"
              ? "Este código expirou. Gere um novo no computador."
              : "Este pedido já foi respondido.",
          );
          setFase("erro");
          return;
        }
        setPedido(detalhes);
        setFase("confirmar");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível ler o pedido.");
        setFase("erro");
      }
    },
    [pararCamera],
  );

  useEffect(() => {
    if (codeInicial) void carregarPedido(codeInicial);
  }, [codeInicial, carregarPedido]);

  useEffect(() => pararCamera, [pararCamera]);

  const abrirCamera = async () => {
    setErro("");
    setFase("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const { default: jsQR } = await import("jsqr");

      const ler = () => {
        if (!streamRef.current || !ctx || !videoRef.current) return;
        const v = videoRef.current;
        if (v.videoWidth > 0) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(frame.data, frame.width, frame.height);
          const code = found?.data ? extrairCodigo(found.data) : null;
          if (code) {
            void carregarPedido(code);
            return;
          }
        }
        scanRef.current = requestAnimationFrame(ler);
      };
      scanRef.current = requestAnimationFrame(ler);
    } catch {
      setErro("Não foi possível abrir a câmera. Digite o código exibido no computador.");
      setFase("inicio");
    }
  };

  const responder = async (autorizar: boolean) => {
    if (!pedido) return;
    setEnviando(true);
    try {
      if (autorizar) {
        await autorizarPedido({ data: { code: pedido.code } });
        setFase("autorizado");
      } else {
        await recusarPedido({ data: { code: pedido.code } });
        setFase("recusado");
      }
    } catch (e) {
      toast.error("Não foi possível responder ao pedido", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setPedido(null);
    setCodigoManual("");
    setErro("");
    setFase("inicio");
  };

  return (
    <PageShell
      title="Entrar no computador"
      description="Escaneie o QR-Code exibido na tela de entrada do computador e confirme aqui para liberar o acesso à sua conta."
    >
      <Card className="glass-card mt-8 max-w-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Monitor className="h-4 w-4 text-gold" aria-hidden="true" />
            {fase === "confirmar" ? "Confirmar pedido" : "Liberar acesso"}
          </CardTitle>
          <CardDescription>
            {fase === "confirmar"
              ? "Confira os dados do pedido antes de autorizar."
              : "Use a câmera ou digite o código de 8 caracteres."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {erro && (
            <p
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              aria-live="polite"
            >
              {erro}
            </p>
          )}

          {(fase === "inicio" || fase === "camera") && (
            <>
              {fase === "camera" && (
                <div className="overflow-hidden rounded-2xl border border-border bg-black">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="aspect-square w-full object-cover"
                  />
                </div>
              )}

              {fase === "inicio" && (
                <Button
                  type="button"
                  onClick={() => void abrirCamera()}
                  className="h-12 w-full rounded-xl gold-gradient font-medium text-primary-foreground"
                >
                  <Camera className="h-4 w-4" />
                  Escanear QR-Code
                </Button>
              )}

              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = extrairCodigo(codigoManual);
                  if (!code) {
                    setErro("Digite os 8 caracteres do código.");
                    return;
                  }
                  void carregarPedido(code);
                }}
              >
                <Label htmlFor="codigo-pc">Ou digite o código</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigo-pc"
                    value={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                    placeholder="ABCD2345"
                    maxLength={12}
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="font-mono tracking-[0.2em]"
                  />
                  <Button type="submit" variant="outline" className="h-11 shrink-0 border-border">
                    Continuar
                  </Button>
                </div>
              </form>
            </>
          )}

          {fase === "confirmar" && pedido && (
            <>
              <dl className="space-y-3 rounded-xl border border-border bg-card/60 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Código</dt>
                  <dd className="font-mono tracking-[0.2em] text-foreground">{pedido.code}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Dispositivo</dt>
                  <dd className="text-right text-foreground">{pedido.navegador}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Pedido feito às</dt>
                  <dd className="text-right text-foreground">
                    {new Date(pedido.criadoEm).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              </dl>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Autorize somente se você mesmo pediu para entrar nesse computador. O acesso é
                liberado imediatamente após a confirmação.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  disabled={enviando}
                  onClick={() => void responder(true)}
                  className="h-12 flex-1 rounded-xl gold-gradient font-medium text-primary-foreground"
                >
                  {enviando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Autorizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={enviando}
                  onClick={() => void responder(false)}
                  className="h-12 rounded-xl border-danger/60 text-danger hover:bg-danger/10 hover:text-danger sm:w-40"
                >
                  <XCircle className="h-4 w-4" />
                  Recusar
                </Button>
              </div>
            </>
          )}

          {fase === "autorizado" && (
            <div className="space-y-4" aria-live="polite">
              <div className="flex gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Acesso liberado</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    O computador vai entrar na sua conta em alguns segundos.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={reiniciar}
                className="h-11 w-full rounded-xl border-border"
              >
                Liberar outro computador
              </Button>
            </div>
          )}

          {fase === "recusado" && (
            <div className="space-y-4" aria-live="polite">
              <p className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                Pedido recusado. Nenhum acesso foi liberado.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={reiniciar}
                className="h-11 w-full rounded-xl border-border"
              >
                Voltar
              </Button>
            </div>
          )}

          {fase === "erro" && (
            <Button
              type="button"
              variant="outline"
              onClick={reiniciar}
              className="h-11 w-full rounded-xl border-border"
            >
              Tentar de novo
            </Button>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
