import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { aceitarConvite } from "@/lib/clinica.functions";
import { salvarContaAtiva } from "@/lib/clinica";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/convite/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Convite da clínica | Legal Health" },
      {
        name: "description",
        content: "Aceite o convite para acessar a área de pacientes da clínica na Legal Health.",
      },
      { property: "og:title", content: "Convite da clínica | Legal Health" },
      {
        property: "og:description",
        content: "Aceite o convite para acessar a área de pacientes da clínica na Legal Health.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConvitePage,
});

function ConvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const aceitar = useServerFn(aceitarConvite);
  const [estado, setEstado] = useState<"verificando" | "erro" | "pronto">("verificando");
  const [mensagem, setMensagem] = useState("Verificando o convite...");
  const executou = useRef(false);

  useEffect(() => {
    if (executou.current) return;
    executou.current = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth", search: { next: `/convite/${token}` }, replace: true });
        return;
      }
      try {
        const r = await aceitar({ data: { token } });
        salvarContaAtiva(r.medicoUserId);
        setEstado("pronto");
        setMensagem(`Acesso liberado à área de pacientes de ${r.medico}.`);
        setTimeout(() => navigate({ to: "/biblioteca", search: { cat: "pacientes" } }), 1200);
      } catch (e) {
        setEstado("erro");
        setMensagem(e instanceof Error ? e.message : "Não foi possível aceitar o convite.");
      }
    })();
  }, [aceitar, navigate, token]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      {estado === "verificando" ? (
        <p className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" />
          {mensagem}
        </p>
      ) : (
        <>
          <p className="max-w-md text-sm text-muted-foreground">{mensagem}</p>
          {estado === "erro" && (
            <Button className="rounded-xl" onClick={() => navigate({ to: "/inicio" })}>
              Ir para o início
            </Button>
          )}
        </>
      )}
    </div>
  );
}
