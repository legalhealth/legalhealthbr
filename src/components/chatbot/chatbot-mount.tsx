import { Suspense, lazy, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import type { ChatbotVariant } from "@/lib/chatbot";

// O widget e suas dependências (markdown, prompt input, cliente do banco) só são
// baixados quando a pessoa abre o assistente — nada disso pesa no carregamento.
const ChatWidget = lazy(() =>
  import("@/components/chatbot/chat-widget").then((m) => ({ default: m.ChatWidget })),
);

/**
 * Uma única bolha por tela. O botão é HTML/CSS estático; a variante (logada ou
 * pública) é resolvida no clique, junto do carregamento do widget.
 */
export function ChatbotMount() {
  const [aberto, setAberto] = useState(false);
  const [variant, setVariant] = useState<ChatbotVariant | null>(null);

  useEffect(() => {
    if (!aberto || variant) return;
    let ativo = true;
    void import("@/integrations/supabase/client").then(({ supabase }) =>
      supabase.auth.getSession().then(({ data }) => {
        if (ativo) setVariant(data.session ? "app" : "publico");
      }),
    );
    return () => {
      ativo = false;
    };
  }, [aberto, variant]);

  if (aberto && variant) {
    return (
      <Suspense fallback={null}>
        <ChatWidget key={variant} variant={variant} defaultOpen />
      </Suspense>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAberto(true)}
      aria-label="Abrir assistente"
      className="fixed right-4 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1rem)] z-[71] grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gradient-to-br from-[#D4B87A] to-[#B8975A] shadow-xl transition-transform hover:scale-105 lg:right-6 lg:bottom-6"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <MessageCircle className="h-6 w-6 text-[#0A0A0A]" aria-hidden="true" />
    </button>
  );
}
