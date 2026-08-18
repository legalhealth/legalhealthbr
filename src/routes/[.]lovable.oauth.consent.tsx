import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OauthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthzDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthzDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthzDetails | null; error: Error | null }>;
};

type AuthzDetails = {
  client?: { name?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
};

function oauthApi(): OauthApi {
  return (supabase.auth as unknown as { oauth: OauthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("authorization_id ausente");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { next: location.pathname + location.searchStr },
      });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-svh items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar este pedido de autorização:{" "}
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "o aplicativo";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não devolveu um destino de redirecionamento.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl glass-card p-8">
        <h1 className="font-display text-2xl tracking-wide text-foreground">
          Conectar {clientName} à sua conta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {clientName} poderá usar as ferramentas da Legal Health em seu nome — incluindo gerar
          documentos da Biblioteca Inteligente e consultar seu histórico.
        </p>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mt-7 flex gap-3">
          <Button
            disabled={busy}
            onClick={() => void decide(true)}
            className="gold-gradient text-background hover:brightness-105"
          >
            Autorizar
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void decide(false)}
            className="border-border bg-transparent"
          >
            Recusar
          </Button>
        </div>
      </div>
    </main>
  );
}
