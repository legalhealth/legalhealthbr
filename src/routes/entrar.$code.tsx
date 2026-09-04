import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/entrar/$code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Liberar acesso | Legal Health" },
      {
        name: "description",
        content: "Confirme no celular a entrada da sua conta Legal Health no computador.",
      },
      { property: "og:title", content: "Liberar acesso | Legal Health" },
      {
        property: "og:description",
        content: "Confirme no celular a entrada da sua conta Legal Health no computador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntrarCodePage,
});

function EntrarCodePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [mensagem, setMensagem] = useState("Verificando sua conta...");

  useEffect(() => {
    const limpo = code
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        navigate({ to: "/entrar-no-pc", search: { code: limpo }, replace: true });
        return;
      }
      setMensagem("Entre na sua conta para liberar o acesso no computador...");
      navigate({ to: "/auth", search: { next: `/entrar/${limpo}` }, replace: true });
    })();
  }, [code, navigate]);

  return (
    <div className="flex min-h-svh items-center justify-center px-6 text-center">
      <p className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" />
        {mensagem}
      </p>
    </div>
  );
}
