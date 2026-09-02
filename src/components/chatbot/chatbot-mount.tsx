import { useEffect, useState } from "react";

import { ChatWidget } from "@/components/chatbot/chat-widget";
import { supabase } from "@/integrations/supabase/client";
import type { ChatbotVariant } from "@/lib/chatbot";

/**
 * Uma única bolha por tela: versão logada (contexto jurídico) quando existe
 * sessão, versão pública (apresentação da plataforma) para visitantes.
 */
export function ChatbotMount() {
  const [variant, setVariant] = useState<ChatbotVariant | null>(null);

  useEffect(() => {
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
  }, []);

  if (!variant) return null;
  return <ChatWidget key={variant} variant={variant} />;
}
