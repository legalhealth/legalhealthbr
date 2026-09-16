import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Suspense, lazy, useEffect, type ReactNode } from "react";


import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ChatbotMount } from "@/components/chatbot/chatbot-mount";
import { jsonLdScript, organizationLd, webSiteLd } from "@/lib/seo";

// Chrome do app e toaster só existem nas rotas autenticadas: carregados sob
// demanda para não entrar no bundle inicial das páginas públicas.
const SiteHeader = lazy(() =>
  import("@/components/layout/site-header").then((m) => ({ default: m.SiteHeader })),
);
const SiteFooter = lazy(() =>
  import("@/components/layout/site-footer").then((m) => ({ default: m.SiteFooter })),
);
const MobileNav = lazy(() =>
  import("@/components/layout/mobile-nav").then((m) => ({ default: m.MobileNav })),
);
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/inicio"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar atualizar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Legal Health | Inteligência Jurídica para Saúde" },
      {
        name: "description",
        content:
          "Plataforma de inteligência jurídica para médicos e clínicas no Brasil.",
      },
      { name: "author", content: "Legal Health" },
      { name: "theme-color", content: "#0A0A0A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Legal Health" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "google-site-verification",
        content: "SO_pzW0PZZ0pZZvf1CS7-z5INyn_x56pZZeW8RU5WEQ",
      },
    ],
    scripts: [jsonLdScript([organizationLd, webSiteLd])],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        // carregado sem bloquear a renderização: media="print" + troca por script
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Playfair+Display:wght@500&family=Karla:wght@400;500;600&display=swap",
        media: "print",
        "data-fontes": "google",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/pwa-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script
          // ativa a folha de fontes sem bloquear o primeiro render
          dangerouslySetInnerHTML={{
            __html:
              "document.querySelectorAll('link[data-fontes]').forEach(function(l){l.media='all'});",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const location = useLocation();
  // Rotas públicas trazem o próprio cabeçalho/rodapé: não usam o chrome do app.
  const path = location.pathname.replace(/\/$/, "") || "/";
  const isPublicChrome =
    path === "/" ||
    path === "/auth" ||
    path === "/embaixadores" ||
    path === "/termos" ||
    path === "/privacidade" ||
    path === "/retencao-de-dados" ||
    path === "/canal-de-privacidade" ||
    path === "/reset-password" ||
    path.startsWith("/revisao");
  const isAuthRoute = isPublicChrome;

  // Cliente de autenticação entra por import dinâmico: fora do bundle inicial
  // das páginas públicas, sem afetar o comportamento nas rotas autenticadas.
  useEffect(() => {
    let ativo = true;
    let unsubscribe: (() => void) | null = null;

    void import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!ativo) return;
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      ativo = false;
      unsubscribe?.();
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Suspense fallback={null}>{!isAuthRoute && <SiteHeader />}</Suspense>
        <main className={cn("flex-1", !isAuthRoute && "pt-[calc(var(--header-h)+1rem)] pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)] lg:pb-0")}>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <Suspense fallback={null}>
          {!isAuthRoute && <SiteFooter />}
          {!isAuthRoute && <MobileNav />}
        </Suspense>
        <ChatbotMount />
        <Suspense fallback={null}>
          <Toaster position="bottom-right" />
        </Suspense>
      </div>
    </QueryClientProvider>
  );
}

import { cn } from "@/lib/utils";
