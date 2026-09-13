import { Link } from "@tanstack/react-router";
import monograma from "@/assets/lh-monograma.png.asset.json";
import { navItems } from "./nav-items";
import { useEhAssistente } from "@/lib/clinica";

export function SiteHeader() {
  const { data: ehAssistente } = useEhAssistente();
  const itens = ehAssistente
    ? navItems.filter((i) => i.to === "/biblioteca" || i.to === "/perfil")
    : navItems;
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid min-h-[var(--header-h)] max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 md:px-8">
        <Link
          to={ehAssistente ? "/biblioteca" : "/inicio"}
          className="flex min-w-0 items-center gap-3"
        >
          <img src={monograma.url} alt="Legal Health" className="h-9 w-auto shrink-0 md:h-10" />
          <span className="min-w-0">
            <span className="block truncate wordmark text-[0.95rem] leading-none text-gold-light md:text-lg">
              Legal Health
            </span>
            <span className="mt-1.5 block truncate text-[0.55rem] uppercase tracking-[0.24em] text-gold md:text-[0.62rem]">
              inteligência jurídica para saúde
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-6">
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
            {itens.map(({ to, label, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact }}
                className="relative py-1 text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-gold after:transition-transform data-[status=active]:text-gold data-[status=active]:after:scale-x-100"
                activeProps={{ className: "font-medium" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <Link
            to="/perfil"
            aria-label="Perfil"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/40 bg-card text-xs font-medium tracking-widest text-gold transition-colors hover:border-gold"
          >
            LH
          </Link>
        </div>
      </div>
    </header>
  );
}
