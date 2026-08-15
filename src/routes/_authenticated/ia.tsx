import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { IA_TOOLS } from "@/components/ia/ia-tools";

export const Route = createFileRoute("/_authenticated/ia")({
  component: Layout,
});

function Layout() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <header className="space-y-3">
        <p className="text-[0.7rem] tracking-[0.22em] text-subtle uppercase">IA Jurídica</p>
        <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
          Ferramentas de inteligência jurídica
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Cada ferramenta usa automaticamente o contexto do seu último Juriscore®.
        </p>
      </header>

      <nav className="mt-7 flex gap-2 overflow-x-auto pb-1">
        {IA_TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground data-[status=active]:border-gold/60 data-[status=active]:bg-gold/10 data-[status=active]:text-gold"
          >
            {tool.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
