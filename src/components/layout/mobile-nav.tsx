import { Link } from "@tanstack/react-router";
import { navItems } from "./nav-items";

export function MobileNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-6">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={exact ? { exact: true } : undefined}
              className="flex flex-col items-center gap-1 py-2.5 text-subtle transition-colors"
              activeProps={{ className: "text-gold" }}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
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
