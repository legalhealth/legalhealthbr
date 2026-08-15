import { Link } from "@tanstack/react-router";
import { navItems } from "./nav-items";

export function MobileNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid min-h-[var(--bottom-nav-h)] grid-cols-6">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="group relative flex flex-col items-center gap-1 py-2.5 text-subtle transition-colors before:absolute before:top-0 before:h-px before:w-8 before:scale-x-0 before:bg-gold before:transition-transform data-[status=active]:text-gold data-[status=active]:before:scale-x-100"
              activeProps={{ className: "font-medium" }}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full transition-colors group-data-[status=active]:bg-gold/10">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </span>
              <span className="max-w-full truncate px-0.5 text-[0.6rem] tracking-wide">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
