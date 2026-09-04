import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, QrCode, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { criarPedidoLogin, consultarPedido } from "@/lib/device-login.functions";
import { WELCOME_SEEN_KEY } from "@/lib/onboarding";

type Estado = "carregando" | "aguardando" | "expirado" | "recusado" | "entrando" | "erro";

export function QrLoginPanel({ onVoltar }: { onVoltar: () => void }) {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [imagem, setImagem] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState("");
  const pedidoRef = useRef<{ code: string; secret: string; expiresAt: string } | null>(null);
  const encerradoRef = useRef(false);

  const gerar = useCallback(async () => {
    encerradoRef.current = false;
    setEstado("carregando");
    setImagem(null);
    setErro("");
    try {
      const pedido = await criarPedidoLogin();
      pedidoRef.current = pedido;
      setCode(pedido.code);
      const url = pedido.url || `${window.location.origin}/entrar/${pedido.code}`;
      const { default: QRCode } = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        width: 460,
        color: { dark: "#0A0A0A", light: "#F5F1E8" },
      });
      setImagem(dataUrl);
      setSegundos(
        Math.max(0, Math.round((new Date(pedido.expiresAt).getTime() - Date.now()) / 1000)),
      );
      setEstado("aguardando");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Tente novamente.");
      setEstado("erro");
    }
  }, []);

  useEffect(() => {
    void gerar();
    return () => {
      encerradoRef.current = true;
    };
  }, [gerar]);

  // Contagem regressiva de validade do código.
  useEffect(() => {
    if (estado !== "aguardando") return;
    const timer = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          setEstado("expirado");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [estado]);

  // Pergunta ao servidor, a cada 2s, se o celular já autorizou.
  useEffect(() => {
    if (estado !== "aguardando") return;
    let ativo = true;
    const timer = setInterval(async () => {
      const pedido = pedidoRef.current;
      if (!pedido || !ativo || encerradoRef.current) return;
      try {
        const res = await consultarPedido({ data: { code: pedido.code, secret: pedido.secret } });
        if (!ativo || encerradoRef.current) return;
        if (res.status === "denied") {
          setEstado("recusado");
        } else if (res.status === "expired") {
          setEstado("expirado");
        } else if (res.status === "approved") {
          encerradoRef.current = true;
          setEstado("entrando");
          const { error } = await supabase.auth.verifyOtp({
            token_hash: res.tokenHash,
            type: "magiclink",
          });
          if (error) {
            setErro(error.message);
            setEstado("erro");
            return;
          }
          const seen = window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
          navigate({ to: seen ? "/inicio" : "/bem-vindo", replace: true });
        }
      } catch {
        // Falha de rede pontual: a próxima tentativa cuida disso.
      }
    }, 2000);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [estado, navigate]);

  const mmss = `${String(Math.floor(segundos / 60)).padStart(1, "0")}:${String(segundos % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-[248px] w-[248px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#F5F1E8]">
          {estado === "carregando" ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#0A0A0A]" />
          ) : imagem && (estado === "aguardando" || estado === "entrando") ? (
            <img
              src={imagem}
              alt={`QR-Code para entrar com o código ${code}`}
              className="h-full w-full"
            />
          ) : (
            <QrCode className="h-10 w-10 text-[#0A0A0A]/40" aria-hidden="true" />
          )}
        </div>

        {estado === "aguardando" && (
          <div className="space-y-2 text-center" aria-live="polite">
            <p className="text-sm text-muted-foreground">
              Abra a Legal Health no celular, toque em <strong>Entrar no computador</strong> e
              escaneie o código.
            </p>
            <p className="font-mono text-lg tracking-[0.35em] text-foreground">{code}</p>
            <p className="text-xs text-subtle">Válido por {mmss}</p>
          </div>
        )}

        {estado === "entrando" && (
          <p className="flex items-center gap-2 text-sm text-success" aria-live="polite">
            <ShieldCheck className="h-4 w-4" /> Autorizado. Entrando...
          </p>
        )}

        {estado === "recusado" && (
          <p className="flex items-center gap-2 text-sm text-destructive" aria-live="polite">
            <XCircle className="h-4 w-4" /> O pedido foi recusado no celular.
          </p>
        )}

        {estado === "expirado" && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            O código expirou. Gere um novo para tentar de novo.
          </p>
        )}

        {estado === "erro" && (
          <p className="text-sm text-destructive" aria-live="polite">
            Não foi possível concluir: {erro}
          </p>
        )}
      </div>

      {estado !== "aguardando" && estado !== "carregando" && estado !== "entrando" && (
        <Button
          type="button"
          onClick={() => void gerar()}
          className="h-11 w-full rounded-xl gold-gradient font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Gerar novo código
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onVoltar}
        className="h-11 w-full rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
      >
        Entrar com e-mail e senha
      </Button>
    </div>
  );
}
