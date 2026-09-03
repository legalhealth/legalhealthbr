import { Suspense, lazy, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { ChatbotVariant } from "@/lib/chatbot";

// O widget (e suas dependências) só entram no bundle depois da primeira pintura,
// mantendo o JavaScript inicial da landing enxuto.
const ChatWidget = lazy(() =>
  import("@/components/chatbot/chat-widget").then((m) => ({ default: m.ChatWidget })),
);

/** Espera a página ficar ociosa ou o primeiro sinal de interação do visitante. */
function useDeferredMount() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (pronto) return;
    let cancelado = false;
    const liberar = () => {
      if (!cancelado) setPronto(true);
    };

    const eventos = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    eventos.forEach((e) => window.addEventListener(e, liberar, { once: true, passive: true }));

    const idle = (
      window as Window & { requestIdleCallback?: (cb: () => void) => number }
    ).requestIdleCallback;
    const timer = idle ? idle(liberar) : window.setTimeout(liberar, 2500);

    return () => {
      cancelado = true;
      eventos.forEach((e) => window.removeEventListener(e, liberar));
      if (!idle) window.clearTimeout(timer as number);
    };
  }, [pronto]);

  return pronto;
}

/**
 * Uma única bolha por tela: versão logada (contexto jurídico) quando existe
 * sessão, versão pública (apresentação da plataforma) para visitantes.
 */
export function ChatbotMount() {
  const pronto = useDeferredMount();
  const [variant, setVariant] = useState<ChatbotVariant | null>(null);

  useEffect(() => {
    if (!pronto) return;
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setVariant(data.session ? "app" : "publico");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setVariant(session ? "app" : "publico");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pronto]);

  if (!pronto || !variant) return null;
  return (
    <Suspense fallback={null}>
      <ChatWidget key={variant} variant={variant} />
    </Suspense>
  );
}
